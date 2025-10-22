'use client';

import { useState, useRef } from 'react';

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
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Record Voice Journal Entry</h2>

      {!audioBlob ? (
        // Recording mode
        <div className="text-center space-y-6">
          <p className="text-slate-600">Click the button below and start speaking. Your reflections are private and only visible to you.</p>

          <div className="bg-slate-100 p-12 rounded-lg">
            <div className="text-6xl font-mono font-bold text-blue-600">
              {formatTime(duration)}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700"
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-slate-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-slate-700"
              >
                ⏹ Stop Recording
              </button>
            )}
          </div>
        </div>
      ) : (
        // Preview mode
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-sm text-slate-600 mb-4">Duration: {formatTime(duration)}</p>
            <div className="flex gap-4">
              <button
                onClick={handlePlayback}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play Preview'}
              </button>
              <button
                onClick={handleRestart}
                className="px-6 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400"
              >
                🔄 Re-record
              </button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Ready to save?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Your recording will be uploaded, transcribed, and summarized using AI. This process typically takes 2-3 minutes.
            </p>
            <button
              onClick={handleSave}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
            >
              💾 Save to Journal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}