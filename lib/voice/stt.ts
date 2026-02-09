/**
 * Speech-to-text via OpenAI Whisper API.
 * Used by the voice conversation pipeline (Difficult Conversations).
 */

export interface STTResult {
  transcript: string;
  confidence: number;
}

/**
 * Transcribe audio buffer to text using OpenAI Whisper.
 * @param audioBuffer - Raw audio bytes (e.g. from MediaRecorder, webm or wav)
 * @param mimeType - Optional MIME type for the file (default: audio/webm)
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<STTResult> {
  const ext = mimeType.includes('webm') ? 'webm' : 'wav';
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper API error: ${response.status} ${err}`);
  }

  const data = (await response.json()) as { text?: string };
  const transcript = (data.text ?? '').trim();
  return {
    transcript,
    confidence: transcript ? 0.95 : 0,
  };
}
