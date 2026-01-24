'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Lock, ArrowLeft, Check, ChevronRight } from 'lucide-react';
import VoiceJournalRecorder from '@/components/voice-journal/VoiceJournalRecorder';
import { useAuth } from '@/context/AuthContext';

interface VoiceJournalEntry {
  id: string;
  audio_blob_url: string;
  transcription: string | null;
  claude_summary: string | null;
  recording_duration_seconds: number;
  created_at: string;
  status?: 'uploading' | 'transcribing' | 'summarizing' | 'complete';
}

export default function VoiceJournalPage() {
  const router = useRouter();
  const _auth = useAuth();
  const [showRecorder, setShowRecorder] = useState(false);
  const [entries, setEntries] = useState<VoiceJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done'>('idle');
  const [_currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!showRecorder) {
      fetchEntries();
    }
  }, [showRecorder]);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/voice-journal', {
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAudio = async (audioBlob: Blob, duration: number) => {
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('duration', duration.toString());

      console.log('Uploading audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

      const response = await fetch('/api/voice-journal/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed - Status:', response.status);
        console.error('Upload failed - Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Upload failed (${response.status}): ${errorText}` };
        }
        
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      setCurrentEntryId(data.entryId);
      setUploadStatus('transcribing');

      // Poll for status updates
      pollStatus(data.entryId);
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus('idle');
      const errorMessage = error instanceof Error ? error.message : 'Failed to save recording';
      alert(errorMessage);
    }
  };

  const pollStatus = async (entryId: string) => {
    const maxAttempts = 60; // 10 minutes max
    let attempts = 0;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice-journal/${entryId}/status`);
        const data = await response.json();

        if (data.status === 'complete') {
          setUploadStatus('done');
          clearInterval(interval);
          // Redirect to entry view after 2 seconds
          setTimeout(() => {
            router.push(`/modules/reflect/voice-journal/${entryId}`);
          }, 2000);
        } else if (data.status === 'summarizing') {
          setUploadStatus('summarizing');
        }

        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(interval);
          setUploadStatus('idle');
          alert('Processing timeout. Please refresh to see your entry.');
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 10000); // Poll every 10 seconds
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTruncatedSummary = (summary: string | null) => {
    if (!summary) return 'Processing...';
    return summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
  };

  // Recorder view
  if (showRecorder) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#0EA5E9] to-[#4A90A8] bg-clip-text text-transparent" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>New Voice Journal Entry</h1>
            <p className="text-neutral-600">
              Record your clinical reflections and learning moments. All entries are private and encrypted.
            </p>
          </div>
          {uploadStatus === 'idle' && (
            <button
              onClick={() => setShowRecorder(false)}
              className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors px-4 py-2 rounded-xl hover:bg-white/50 flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to List
            </button>
          )}
        </div>

        {uploadStatus === 'idle' ? (
          <VoiceJournalRecorder onSave={handleSaveAudio} />
        ) : (
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center border border-white/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2 text-neutral-800">
              {uploadStatus === 'uploading' && 'Uploading your recording...'}
              {uploadStatus === 'transcribing' && 'Transcribing your voice memo...'}
              {uploadStatus === 'summarizing' && 'Summarizing your reflection...'}
            </h2>
            <p className="text-neutral-600">This typically takes 2-3 minutes. Please don&apos;t close this page.</p>
          </div>
        )}

        {uploadStatus === 'done' && (
          <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-6 rounded-2xl text-center shadow-sm">
            <p className="text-neutral-800 font-medium flex items-center justify-center gap-2">
              <Check size={20} className="text-[#86C5A8]" />
              Your entry has been saved and is being processed.
            </p>
            <p className="text-sm text-neutral-600 mt-2">Redirecting you to view your entry...</p>
          </div>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#0EA5E9] to-[#4A90A8] bg-clip-text text-transparent" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>Voice Journal</h1>
          <p className="text-neutral-600">
            Your private reflections and clinical learning moments.
          </p>
        </div>
        <button
          onClick={() => setShowRecorder(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'white',
            backgroundColor: '#0EA5E9',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Mic size={20} />
          New Entry
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-neutral-700 flex items-start gap-2">
          <Lock size={18} className="text-[#7EC8E3] mt-0.5 flex-shrink-0" />
          <span><strong className="text-neutral-800">100% Private:</strong> Only you can see these entries. Program directors, faculty, and administrators cannot access your voice journal.</span>
        </p>
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-md text-center border border-white/30">
          <p className="text-neutral-500 mb-4">No entries yet. Start your first voice journal!</p>
          <button
            onClick={() => setShowRecorder(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#0EA5E9',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Record First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => router.push(`/modules/reflect/voice-journal/${entry.id}`)}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Mic size={24} className="text-[#7EC8E3] flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-lg text-neutral-800">{formatDate(entry.created_at)}</p>
                      <p className="text-sm text-neutral-500">
                        Duration: {formatDuration(entry.recording_duration_seconds)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-11">
                    {entry.claude_summary ? (
                      <p className="text-neutral-600 text-sm">{getTruncatedSummary(entry.claude_summary)}</p>
                    ) : entry.transcription ? (
                      <p className="text-neutral-500 text-sm italic">Summarizing...</p>
                    ) : (
                      <p className="text-neutral-500 text-sm italic">Transcribing...</p>
                    )}
                  </div>
                </div>
                <div className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors">
                  <ChevronRight size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

