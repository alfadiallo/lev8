'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  const { user } = useAuth();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<VoiceJournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchEntry();
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
      router.push('/modules/grow/voice-journal');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
        <p className="text-red-700">{error || 'Entry not found'}</p>
        <button
          onClick={() => router.push('/modules/grow/voice-journal')}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Back to Voice Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/modules/grow/voice-journal')}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          ← Back to Voice Journal
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : '🗑 Delete Entry'}
        </button>
      </div>

      {/* Entry Metadata */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Voice Journal Entry</h1>
            <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Duration</p>
            <p className="text-lg font-semibold">{formatDuration(entry.recording_duration_seconds)}</p>
          </div>
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {entry.claude_summary ? (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span>🤖</span> AI Summary
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap">{entry.claude_summary}</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">⏳ Summary is still being generated. Please refresh in a moment.</p>
        </div>
      )}

      {/* Full Transcription */}
      {entry.transcription ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Full Transcription</h2>
            {entry.transcription_confidence && (
              <span className="text-sm text-slate-500">
                Confidence: {(entry.transcription_confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{entry.transcription}</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm">⏳ Transcription is still being processed. Please refresh in a moment.</p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          🔒 <strong>Private:</strong> This entry is only visible to you. No one else, including program directors or faculty, can access your voice journal entries.
        </p>
      </div>
    </div>
  );
}

