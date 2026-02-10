// Conversation Interface Component - v2 with phase-based engine
// Integrates PhaseManager, EmotionalStateTracker, and v2 API

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Vignette, Message } from '@/lib/types/modules';
import { isVignetteV2 } from '@/lib/types/modules';
import { ConversationSessionState, VignetteV2 } from '@/lib/types/difficult-conversations';
import { Send, Download, X, Mic, MicOff } from 'lucide-react';
import PhaseIndicator from './PhaseIndicator';
import { isVoiceEnabled } from '@/lib/types/difficult-conversations';
import { useVoiceRecorder } from '@/lib/voice/useVoiceRecorder';
import { useAudioPlayback } from '@/lib/voice/useAudioPlayback';
import EmotionalStateIndicator from './EmotionalStateIndicator';
import BranchingHint from './BranchingHint';
import AssessmentResults from './AssessmentResults';
import { useAuth } from '@/context/AuthContext';

/** V1 vignette_data shape for fallback branches */
interface V1VignetteData {
  initialPrompt?: string;
  primaryAvatar?: { id?: string; name?: string; role?: string; color?: string };
  context?: string;
  facts?: unknown[];
  escalationTriggers?: unknown[];
}

interface ConversationInterfaceProps {
  vignette: Vignette;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  onEnd: () => void;
}

export default function ConversationInterface({ vignette, difficulty, onEnd }: ConversationInterfaceProps) {
  const { user: _user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<ConversationSessionState | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [phaseTransition, setPhaseTransition] = useState<{ from: string; to: string; reason: string } | null>(null);
  const [voiceModeOn, setVoiceModeOn] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check if vignette is v2 - use useMemo to prevent recalculation
  const isV2 = isVignetteV2(vignette);

  // Use useMemo to stabilize vignetteV2 reference
  const vignetteV2 = useMemo(() => {
    if (!isV2) return null;
    try {
      return vignette.vignette_data as unknown as VignetteV2;
    } catch {
      return null;
    }
  }, [isV2, vignette.vignette_data]);

  const voiceEnabled = isV2 && vignetteV2 && isVoiceEnabled(vignette);
  const { playBase64Audio, isPlaying } = useAudioPlayback();

  const handleVoiceResponse = useCallback(
    async (blob: Blob) => {
      if (!vignetteV2 || !voiceEnabled) return;
      const { supabaseClient } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, text: 'Error: Not authenticated', sender: 'avatar', timestamp: new Date() },
        ]);
        return;
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('vignetteId', vignette.id);
        formData.append('difficulty', difficulty);
        if (sessionState) formData.append('sessionState', JSON.stringify(sessionState));

        const response = await fetch('/api/conversations/v2/voice', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          const msg = error.details ? `${error.error}: ${error.details}` : error.error || 'Voice request failed';
          throw new Error(msg);
        }

        const data = await response.json();
        const residentText = data.residentTranscript || '(speech)';
        const avatarText = data.assistantTranscript || '';

        setMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, text: residentText, sender: 'user', timestamp: new Date() },
          {
            id: `a-${Date.now()}`,
            text: avatarText,
            sender: 'avatar',
            avatarId: Object.keys(vignetteV2.avatars.primaryAvatar)[0],
            timestamp: new Date(),
            phaseId: data.sessionState?.currentPhase?.currentPhaseId,
          },
        ]);
        setSessionState(data.sessionState ?? null);

        if (data.phaseTransition) {
          setPhaseTransition(data.phaseTransition);
          setTimeout(() => setPhaseTransition(null), 5000);
        }

        if (data.assistantAudio) await playBase64Audio(data.assistantAudio);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Voice request failed';
        setMessages((prev) => [
          ...prev,
          { id: `err-${Date.now()}`, text: `Error: ${message}`, sender: 'avatar', timestamp: new Date() },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [vignette.id, difficulty, sessionState, voiceEnabled, vignetteV2, playBase64Audio]
  );

  const { isRecording, hasPermission, requestPermission, startRecording, stopRecording } = useVoiceRecorder({
    onRecordingComplete: handleVoiceResponse,
  });

  const playOpeningLine = useCallback(async () => {
    if (!voiceEnabled || !vignette?.id) return;
    const { supabaseClient } = await import('@/lib/supabase-client');
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch('/api/conversations/v2/voice/narrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vignetteId: vignette.id, type: 'opening_line' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.audio) await playBase64Audio(data.audio);
    } catch {
      // ignore
    }
  }, [voiceEnabled, vignette?.id, playBase64Audio]);

  // Initialize messages once on mount
  useEffect(() => {
    // Reset messages when vignette changes
    if (isV2 && vignetteV2) {
      // Initialize with opening phase message
      const currentPhase = vignetteV2.conversation?.phases?.find((p: { id?: string }) => p.id === 'opening') || vignetteV2.conversation?.phases?.[0];
      const openingLine = currentPhase?.avatarState?.openingLine || vignette.description || 'Hello, how can I help you?';
      
      const initialMessage: Message = {
        id: 'initial',
        text: openingLine,
        sender: 'avatar',
        avatarId: vignetteV2.avatars?.primaryAvatar ? Object.keys(vignetteV2.avatars.primaryAvatar)[0] : undefined,
        timestamp: new Date(),
        phaseId: currentPhase?.id,
      };

      setMessages([initialMessage]);
    } else {
      // Fallback for v1 vignettes
      const vignetteData = (vignette.vignette_data || {}) as V1VignetteData;
      const initialPrompt = vignetteData.initialPrompt || vignette.description || 'Hello, how can I help you?';

      const initialMessage: Message = {
        id: 'initial',
        avatarId: vignetteData.primaryAvatar?.id,
        text: initialPrompt,
        sender: 'avatar',
        timestamp: new Date(),
      };

      setMessages([initialMessage]);
    }
  }, [vignette.id, vignette.description, vignette.vignette_data, isV2, vignetteV2]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Get auth token
      const { supabaseClient } = await import('@/lib/supabase-client');
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      if (isV2 && vignetteV2) {
        // Use v2 API
        const response = await fetch('/api/conversations/v2/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            vignetteId: vignette.id,
            message: currentInput,
            difficulty,
            sessionState: sessionState, // Pass existing session state
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          const message = error.details
            ? `${error.error || 'Failed to get response'}: ${error.details}`
            : (error.error || 'Failed to get response');
          throw new Error(message);
        }

        const data = await response.json();

        // Add avatar response
        const avatarMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'avatar',
          avatarId: Object.keys(vignetteV2.avatars.primaryAvatar)[0],
          timestamp: new Date(),
          phaseId: data.sessionState?.currentPhase?.currentPhaseId,
          emotionalImpact: data.emotionDelta,
        };

        setMessages(prev => [...prev, avatarMessage]);
        setSessionState(data.sessionState);

        // Update assessment scores if provided
        if (data.assessmentUpdate) {
          // Scores are already in sessionState, but we can trigger a re-render
        }

        // Handle phase transition
        if (data.phaseTransition) {
          setPhaseTransition(data.phaseTransition);
          setTimeout(() => setPhaseTransition(null), 5000); // Clear after 5 seconds
        }
      } else {
        // Fallback to v1 API
        const vignetteData = (vignette.vignette_data || {}) as V1VignetteData;
        const v1Response = await fetch('/api/conversations/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: currentInput,
            conversationHistory: messages,
            vignetteContext: {
              context: vignetteData.context || vignette.description || '',
              facts: vignetteData.facts || [],
              escalationTriggers: vignetteData.escalationTriggers || [],
            },
            avatarPersonality: vignetteData.primaryAvatar || {
              name: 'Patient/Family Member',
              role: 'Patient/Family',
            },
            difficulty,
          }),
        });

        if (!v1Response.ok) {
          throw new Error('Failed to get response');
        }

        const v1Data = await v1Response.json();

        const avatarMessage: Message = {
          id: (Date.now() + 1).toString(),
          avatarId: vignetteData.primaryAvatar?.id,
          text: v1Data.response,
          sender: 'avatar',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, avatarMessage]);
      }
    } catch (error: unknown) {
      console.error('[ConversationInterface] Error:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get response. Please try again.'}`,
        sender: 'avatar',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChat = () => {
    const chatData = {
      vignette: vignette.title,
      difficulty,
      timestamp: new Date().toISOString(),
      sessionState: sessionState,
      conversation: messages,
    };

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${vignette.id}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get avatar info
  const getAvatarInfo = () => {
    if (isV2 && vignetteV2) {
      const primaryAvatars = vignetteV2.avatars.primaryAvatar;
      const avatarKey = Object.keys(primaryAvatars)[0];
      const avatar = primaryAvatars[avatarKey];
      return {
        name: avatar.identity.name,
        role: avatar.identity.relationship || avatar.identity.occupation || 'Family Member',
        color: '#7EC8E3',
      };
    } else {
      const vignetteData = (vignette.vignette_data || {}) as V1VignetteData;
      const primaryAvatar = vignetteData.primaryAvatar;
      return {
        name: primaryAvatar?.name || 'Patient/Family',
        role: primaryAvatar?.role || 'Family Member',
        color: primaryAvatar?.color || '#7EC8E3',
      };
    }
  };

  const avatarInfo = getAvatarInfo();

  // Get phases for phase indicator (v2 only)
  const getPhases = () => {
    if (!isV2 || !vignetteV2) return [];
    
    const currentPhaseId = sessionState?.currentPhase?.currentPhaseId || 'opening';
    
    return vignetteV2.conversation.phases
      .filter(p => p.id !== 'preparation')
      .map((phase, index) => {
        const allPhases = vignetteV2.conversation.phases.filter(p => p.id !== 'preparation');
        const currentIndex = allPhases.findIndex(p => p.id === currentPhaseId);
        return {
          id: phase.id,
          name: phase.name,
          objective: phase.objective,
          completed: index < currentIndex,
          current: phase.id === currentPhaseId,
        };
      });
  };

  // Get hints based on current phase (v2 only)
  const getHints = (): string[] => {
    if (!isV2 || !vignetteV2 || !sessionState) return [];
    
    const currentPhase = vignetteV2.conversation.phases.find(
      p => p.id === sessionState.currentPhase.currentPhaseId
    );
    
    if (!currentPhase) return [];

    // Get hints from escalation prevention
    const escalationPrevention = vignetteV2.conversation.conversationMechanics.adaptiveDifficulty.escalationPrevention;
    return escalationPrevention?.supportPrompts || [];
  };

  // Get emotional trajectory
  const getEmotionalTrajectory = (): 'improving' | 'stable' | 'worsening' => {
    if (!sessionState) return 'stable';
    
    const history = sessionState.emotionalState.history;
    if (history.length < 3) return 'stable';
    
    const recent = history.slice(-3);
    const firstValue = recent[0].value;
    const lastValue = recent[recent.length - 1].value;
    const difference = lastValue - firstValue;
    
    if (difference < -0.1) return 'improving';
    if (difference > 0.1) return 'worsening';
    return 'stable';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] max-w-6xl mx-auto gap-4">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-sm rounded-t-2xl shadow-md border border-white/30 p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800">{vignette.title}</h2>
            <p className="text-sm text-neutral-600">Difficulty: {difficulty}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadChat}
              className="px-4 py-2 border border-white/40 text-neutral-700 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Download
            </button>
            <button
              onClick={onEnd}
              className="px-4 py-2 bg-[#F4A5A5] text-white rounded-xl hover:bg-[#E89595] transition-colors"
            >
              End Session
            </button>
          </div>
        </div>

        {/* Avatar Info */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: avatarInfo.color }}
          >
            {avatarInfo.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-neutral-800">{avatarInfo.name}</p>
            <p className="text-sm text-neutral-600">{avatarInfo.role}</p>
          </div>
        </div>
      </div>

      {/* Phase Transition Notification */}
      {phaseTransition && (
        <div className="bg-[#E0F2FE] backdrop-blur-sm rounded-xl border border-[#0EA5E9]/30 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm text-neutral-800">Phase Transition</p>
            <p className="text-xs text-neutral-700">{phaseTransition.reason}</p>
          </div>
          <button
            onClick={() => setPhaseTransition(null)}
            className="text-neutral-600 hover:text-neutral-800"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Sidebar Layout: Phase Indicator and Emotional State */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Sidebar - Phase Indicator */}
        {isV2 && (
          <div className="w-80 flex-shrink-0">
            <PhaseIndicator
              phases={getPhases()}
              currentPhaseId={sessionState?.currentPhase?.currentPhaseId || 'opening'}
              objectivesCompleted={sessionState?.currentPhase?.objectivesCompleted || []}
              objectivesPending={sessionState?.currentPhase?.objectivesPending || []}
            />
            
            {/* Emotional State Indicator */}
            {sessionState && (
              <div className="mt-4">
                <EmotionalStateIndicator
                  emotionalState={sessionState.emotionalState}
                  trajectory={getEmotionalTrajectory()}
                  showByDefault={false}
                />
              </div>
            )}

            {/* Assessment Results */}
            {sessionState && sessionState.assessmentScores && vignetteV2 && (
              <div className="mt-4">
                <AssessmentResults
                  scores={sessionState.assessmentScores}
                  passingScore={vignetteV2.passingScore}
                  excellenceScore={vignetteV2.excellenceScore}
                  showDetails={true}
                  compact={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Main Content - Input on top, messages below (newest first) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Input */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/30 p-4 mb-4">
            <div className="flex gap-3 items-center">
              {voiceEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (hasPermission === false) {
                      requestPermission();
                      return;
                    }
                    const next = !voiceModeOn;
                    setVoiceModeOn(next);
                    if (next) playOpeningLine();
                  }}
                  title={voiceModeOn ? 'Turn off voice' : 'Turn on voice'}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 ${
                    voiceModeOn
                      ? 'bg-[#7EC8E3]/30 border-[#7EC8E3] text-[#0EA5E9]'
                      : 'border-white/40 text-neutral-600 hover:bg-white/30'
                  }`}
                >
                  {voiceModeOn ? <Mic size={18} /> : <MicOff size={18} />}
                  <span className="text-xs font-medium">{voiceModeOn ? 'Voice on' : 'Voice'}</span>
                </button>
              )}
              {voiceEnabled && voiceModeOn && (
                <button
                  type="button"
                  onClick={() => (isRecording ? stopRecording() : startRecording())}
                  disabled={isLoading}
                  title={isRecording ? 'Stop recording' : 'Start recording'}
                  className={`p-2 rounded-xl flex items-center justify-center ${
                    isRecording
                      ? 'bg-[#F4A5A5] text-white animate-pulse'
                      : 'bg-[#0EA5E9] text-white hover:bg-[#0284C7]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Mic size={22} />
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your response..."
                className="flex-1 px-4 py-2 rounded-xl border border-white/40 bg-white/30 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#7EC8E3]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-[#0EA5E9] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#0284C7] hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </div>

          {/* Branching Hints */}
          {isV2 && showHints && getHints().length > 0 && (
            <div className="mb-4">
              <BranchingHint
                hints={getHints()}
                phaseName={sessionState?.currentPhase?.currentPhaseId}
                onDismiss={() => setShowHints(false)}
              />
            </div>
          )}

          {/* Messages (newest first) */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-white/30 p-6 space-y-4">
            {(isLoading || isRecording || isPlaying) && (
              <div className="flex justify-start">
                <div className="bg-white/80 border border-white/40 p-4 rounded-2xl">
                  {isRecording ? (
                    <p className="text-sm text-neutral-600">Recording... Click mic to stop.</p>
                  ) : isPlaying ? (
                    <p className="text-sm text-neutral-600">Playing response...</p>
                  ) : (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {[...messages].reverse().map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#0EA5E9] text-white'
                      : 'bg-white/80 border border-white/40 text-neutral-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
