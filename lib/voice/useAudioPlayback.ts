'use client';

import { useState, useRef, useCallback } from 'react';

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBase64Audio = useCallback(async (base64: string): Promise<void> => {
    if (!base64) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const arrayBuffer = bytes.buffer.byteLength === bytes.length
      ? bytes.buffer
      : bytes.buffer.slice(0, bytes.length);
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    setIsPlaying(true);
    return new Promise<void>((resolve) => {
      source.onended = () => {
        setIsPlaying(false);
        resolve();
      };
      source.start();
    });
  }, []);

  return { isPlaying, playBase64Audio };
}
