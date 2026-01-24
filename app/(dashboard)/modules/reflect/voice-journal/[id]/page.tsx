'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Bot, Clock, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VoiceJournalEntry {
  id: string;
  audio_blob_url: string;
  transcription: string | null;
  claude_summary: string | null;
  recording_duration_seconds: number;
  created_at: string;
  transcription_confidence: number | null;
}

export default function VoiceJournalEntryPage() {
  const params = useParams();
  const router = useRouter();
  const _auth = useAuth();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<VoiceJournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [_isPlaying, _setIsPlaying] = useState(false);

  useEffect(() => {
    fetchEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/voice-journal/${entryId}`, {
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error('Failed to load entry');
      }

      const data = await response.json();
      setEntry(data.entry);

      // Get signed URL for audio playback
      if (data.entry.audio_blob_url) {
        // For now, we'll use the storage URL directly
        // In production, use a signed URL from Supabase
        setAudioUrl(data.entry.audio_blob_url);
      }
    } catch (err) {
      console.error('Error fetching entry:', err);
      setError('Failed to load entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/voice-journal/${entryId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      // Redirect back to list
      router.push('/modules/reflect/voice-journal');
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry. Please try again.');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="bg-[#F4A5A5]/80 backdrop-blur-sm border border-[#F4A5A5]/30 p-6 rounded-2xl shadow-sm">
        <p className="text-neutral-800">{error || 'Entry not found'}</p>
        <button
          onClick={() => router.push('/modules/reflect/voice-journal')}
          className="mt-4 text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Voice Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/modules/reflect/voice-journal')}
          className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/50"
        >
          <ArrowLeft size={18} />
          Back to Voice Journal
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-[#F4A5A5] text-white rounded-2xl hover:bg-[#E89595] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
        >
          <Trash2 size={18} />
          {isDeleting ? 'Deleting...' : 'Delete Entry'}
        </button>
      </div>

      {/* Entry Metadata */}
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] bg-clip-text text-transparent">Voice Journal Entry</h1>
            <p className="text-sm text-neutral-500">{formatDate(entry.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Duration</p>
            <p className="text-lg font-semibold text-neutral-800">{formatDuration(entry.recording_duration_seconds)}</p>
          </div>
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="bg-[#D4F1F4]/50 backdrop-blur-sm p-4 rounded-2xl border border-[#7EC8E3]/30">
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {entry.claude_summary ? (
        <div className="bg-gradient-to-br from-[#FFE5D9]/60 to-[#D4F1F4]/60 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/30">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-neutral-800">
            <Bot size={20} className="text-[#7EC8E3]" />
            AI Summary
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-neutral-700 whitespace-pre-wrap">{entry.claude_summary}</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFD89B]/60 backdrop-blur-sm border border-[#FFD89B]/30 p-4 rounded-2xl shadow-sm">
          <p className="text-neutral-700 text-sm flex items-center gap-2">
            <Clock size={16} className="text-[#FFD89B]" />
            Summary is still being generated. Please refresh in a moment.
          </p>
        </div>
      )}

      {/* Full Transcription */}
      {entry.transcription ? (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-800">Full Transcription</h2>
            {entry.transcription_confidence && (
              <span className="text-sm text-neutral-500">
                Confidence: {(entry.transcription_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{entry.transcription}</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFD89B]/60 backdrop-blur-sm border border-[#FFD89B]/30 p-4 rounded-2xl shadow-sm">
          <p className="text-neutral-700 text-sm flex items-center gap-2">
            <Clock size={16} className="text-[#FFD89B]" />
            Transcription is still being processed. Please refresh in a moment.
          </p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-4 rounded-2xl shadow-sm">
        <p className="text-sm text-neutral-700 flex items-start gap-2">
          <Lock size={18} className="text-[#7EC8E3] mt-0.5 flex-shrink-0" />
          <span><strong className="text-neutral-800">Private:</strong> This entry is only visible to you. No one else, including program directors or faculty, can access your voice journal entries.</span>
        </p>
      </div>
    </div>
  );
}

