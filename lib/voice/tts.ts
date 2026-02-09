/**
 * Text-to-speech via ElevenLabs API (Turbo v2.5).
 * Used by the voice conversation pipeline for avatar responses.
 */

export interface TTSOptions {
  stability?: number;
  similarityBoost?: number;
}

/**
 * Synthesize speech from text using ElevenLabs.
 * @param text - Text to speak
 * @param voiceId - ElevenLabs voice_id (e.g. from vignette voice_config.voice_profile.elevenlabs_voice_id)
 * @param options - Optional voice settings (stability, similarity_boost)
 * @returns Audio buffer (MP3)
 */
export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable is required');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs TTS error: ${response.status} ${err}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
