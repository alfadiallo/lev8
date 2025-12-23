'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Save } from 'lucide-react';

interface VoiceJournalRecorderProps {
  onSave?: (audioBlob: Blob, duration: number) => void;
}

export default function VoiceJournalRecorder({ onSave }: VoiceJournalRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualizations (future enhancement)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Use the native MIME type from the MediaRecorder
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // Create audio URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Track duration
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Please allow microphone access to record');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const handlePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      // Create or reuse audio element
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlaying(false);
        audioElementRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          alert('Could not play audio. The recording may be corrupted.');
          setIsPlaying(false);
        };
      }
      
      audioElementRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Play error:', error);
          alert('Could not play audio. Please try recording again.');
          setIsPlaying(false);
        });
    }
  };

  const handleSave = () => {
    if (audioBlob && onSave) {
      onSave(audioBlob, duration);
    }
  };

  const handleRestart = () => {
    // Clean up audio element and URL
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-2xl mx-auto border border-white/30">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] bg-clip-text text-transparent">Record Voice Journal Entry</h2>

      {!audioBlob ? (
        // Recording mode
        <div className="text-center space-y-6">
          <p className="text-neutral-600">Click the button below and start speaking. Your reflections are private and only visible to you.</p>

          <div className="bg-gradient-to-br from-[#FFE5D9]/50 to-[#D4F1F4]/50 p-12 rounded-2xl border border-white/30">
            <div className="text-6xl font-mono font-bold bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] bg-clip-text text-transparent">
              {formatTime(duration)}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white px-8 py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Mic size={20} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-neutral-600 text-white px-8 py-3 rounded-2xl font-medium hover:bg-neutral-700 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                <Square size={20} />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      ) : (
        // Preview mode
        <div className="space-y-6">
          <div className="bg-[#D4F1F4]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#7EC8E3]/30">
            <p className="text-sm text-neutral-600 mb-4">Duration: {formatTime(duration)}</p>
            <div className="flex gap-4">
              <button
                onClick={handlePlayback}
                className="px-6 py-2 bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause size={18} />
                    Pause
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Play Preview
                  </>
                )}
              </button>
              <button
                onClick={handleRestart}
                className="px-6 py-2 bg-neutral-300 text-neutral-800 rounded-2xl hover:bg-neutral-400 transition-all duration-300 flex items-center gap-2"
              >
                <RotateCcw size={18} />
                Re-record
              </button>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6">
            <h3 className="font-semibold mb-4 text-neutral-800">Ready to save?</h3>
            <p className="text-sm text-neutral-600 mb-4">
              Your recording will be uploaded, transcribed, and summarized using AI. This process typically takes 2-3 minutes.
            </p>
            <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-[#86C5A8] to-[#7EC8E3] text-white py-3 rounded-2xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save to Journal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}