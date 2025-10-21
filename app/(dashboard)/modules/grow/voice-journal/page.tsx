'use client';

import { useState } from 'react';
import VoiceJournalRecorder from '@/components/voice-journal/VoiceJournalRecorder';
import { useAuth } from '@/context/AuthContext';

export default function VoiceJournalPage() {
  const { user } = useAuth();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'summarizing' | 'done'>('idle');
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

  const handleSaveAudio = async (audioBlob: Blob, duration: number) => {
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('duration', duration.toString());

      const response = await fetch('/api/voice-journal/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setCurrentEntryId(data.entryId);
      setUploadStatus('transcribing');

      // Poll for status updates
      pollStatus(data.entryId);
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus('idle');
      alert('Failed to save recording');
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
            window.location.href = `/modules/grow/voice-journal/${entryId}`;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Voice Journal</h1>
        <p className="text-slate-600">
          Record your clinical reflections. All entries are private and encrypted.
        </p>
      </div>

      {uploadStatus === 'idle' ? (
        <VoiceJournalRecorder onSave={handleSaveAudio} />
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">
            {uploadStatus === 'uploading' && 'Uploading your recording...'}
            {uploadStatus === 'transcribing' && 'Transcribing your voice memo...'}
            {uploadStatus === 'summarizing' && 'Summarizing your reflection...'}
          </h2>
          <p className="text-slate-600">This typically takes 2-3 minutes. Please don't close this page.</p>
        </div>
      )}

      {uploadStatus === 'done' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
          <p className="text-green-700 font-medium">✓ Your entry has been saved and is being processed.</p>
          <p className="text-sm text-slate-600 mt-2">Redirecting you to view your entry...</p>
        </div>
      )}
    </div>
  );
}