// MED-001: Voice configuration for Difficult Conversations voice mode
// Enables voice simulation for the Adenosine Error vignette (Margaret / spouse avatar)

import { VoiceConfig } from '../../../types/difficult-conversations';

export const med001VoiceConfig: VoiceConfig = {
  enabled: true,

  context_brief:
    "You're an emergency physician in a family consultation room near the ICU. A 72-year-old man with cardiomyopathy was given adenosine for what was thought to be SVT with aberrancy; it was actually ventricular tachycardia. He had a cardiac arrest and was resuscitated. He's now intubated in the ICU. His wife Margaret has been waiting to speak with you. She's been married to him for 45 years and is a retired teacher. Your task is to disclose the error, answer her questions, and support her through the conversation.",

  opening_line:
    "Doctor? The nurse said you needed to speak with me about my husband. Is everything okay? He seemed stable when I left last night.",

  closing_line:
    "I need to call our daughter. Thank you for talking to me, doctor.",

  max_duration_seconds: 600, // 10 minutes
  silence_timeout_seconds: 10,

  silence_prompts: [
    'Doctor?',
    'Please, just tell me what happened.',
    'Are you still there? I need to know what\'s going on.',
    'Why won\'t you say anything? Is it that bad?',
  ],

  voice_profile: {
    // "Edna" - warm, motherly, calm senior woman (ElevenLabs pre-made voice)
    elevenlabs_voice_id: 'FrCDCQwye0euHmliGxP9',
    openai_voice: 'nova',
    display_label: 'Margaret — Spouse',
    emotional_baseline: 'anxious',
    default_stability: 0.55,
    default_similarity_boost: 0.75,
  },

  phase_voice_directives: {
    opening: {
      voice_behavior:
        'Speak with nervous energy. Anxious but cooperative, seeking reassurance. Measured, thoughtful questions. Worried but hopeful.',
      stability_override: 0.5,
    },
    disclosure: {
      voice_behavior:
        'Process shocking information. If the resident is clear and compassionate, voice softens slightly; if jargon or defensive, become sharper and more upset. May ask "Are you saying this was preventable?" or "How could this happen?"',
      stability_override: 0.35,
      style_override: 0.55,
    },
    emotional_processing: {
      voice_behavior:
        'Height of emotional response. May ask repeated questions, express anger or blame, show grief. Intensity varies by difficulty. Match the resident\'s empathy with gradual calming or continued distress.',
      stability_override: 0.4,
      style_override: 0.6,
    },
    clinical_questions: {
      voice_behavior:
        'Information-gathering mode. Ask specific questions about status, prognosis, and prevention. More measured if trust has been built. Expect clear, honest answers.',
      stability_override: 0.5,
      style_override: 0.4,
    },
    next_steps: {
      voice_behavior:
        'Resolution and closure. Voice reflects outcome—collaborative if trust rebuilt, guarded or resigned if not. May ask about visiting or follow-up.',
      stability_override: 0.55,
      style_override: 0.35,
    },
  },
};
