// MED-001: Conversation Design Data
// Phase-based conversation structure with branching logic

import { ConversationDesign } from '../../../types/difficult-conversations';

export const conversationDesign: ConversationDesign = {
  conversationMetadata: {
    expectedDuration: 15,
    settingDescription: "Private family conference room near ICU",
    participantPositioning: "Seated at round table, doctor across from family",
    emotionalArc: "Shock → Anger → Questioning → Processing → Next steps"
  },
  
  phases: [
    {
      id: "preparation",
      name: "Pre-Conversation Preparation",
      duration: "Before family arrives",
      objective: "Learner prepares mentally and reviews facts",
      systemGuidance: {
        reminderPrompts: [
          "Review the clinical facts",
          "Prepare for emotional responses",
          "Have support resources ready"
        ]
      },
      avatarState: {
        emotional: "preparing"
      },
      geminiContext: {
        focus: "Preparation phase - no avatar interaction yet"
      }
    },
    
    {
      id: "opening",
      name: "Initial Contact",
      duration: "0-3 minutes",
      objective: "Establish setting and prepare for disclosure",
      maxMessages: 3,
      difficultyOverrides: {
        beginner: { maxMessages: 5 },
        advanced: { maxMessages: 2 },
      },
      learnerTasks: [
        { text: "Introduce self clearly", keywords: ["name", "i'm dr", "i am dr", "my name", "doctor"] },
        { text: "Acknowledge serious nature", keywords: ["serious", "important", "difficult", "bad news", "concerned", "need to talk", "need to tell"] },
        { text: "Ensure privacy and comfort", keywords: ["private", "comfortable", "privacy", "sit", "alone", "quiet", "take your time"] },
      ],
      avatarState: {
        emotional: "anxious",
        expectations: "Wants immediate information",
        openingLine: "Doctor? The nurse said you needed to speak with me about my husband. Is everything okay? He seemed stable when I left last night."
      },
      geminiContext: {
        focus: "Initial emotional state - worried but hopeful",
        informationLimit: "No error details revealed yet",
        behaviorGuidance: "Anxious but cooperative, seeking reassurance"
      },
      assessmentPoints: [
        "Clear introduction",
        "Appropriate setting",
        "Empathetic tone"
      ]
    },
    
    {
      id: "disclosure",
      name: "Error Disclosure",
      duration: "3-7 minutes",
      objective: "Deliver error information clearly and honestly",
      criticalPhase: true,
      maxMessages: 5,
      difficultyOverrides: {
        beginner: { maxMessages: 7 },
        advanced: { maxMessages: 4 },
      },
      learnerTasks: [
        { text: "State clearly that an error occurred", keywords: ["error", "mistake", "went wrong", "something happened", "problem occurred"] },
        { text: "Explain in plain language", keywords: ["means", "simply", "basically", "in other words", "what happened is", "plain"] },
        { text: "Accept responsibility", keywords: ["responsible", "our fault", "my fault", "we caused", "should not have", "accountability", "apologize"] },
        { text: "Express appropriate regret", keywords: ["sorry", "regret", "apologize", "wish", "terrible", "deeply"] },
      ],
      avatarState: {
        emotional: "shocked transitioning to upset/angry",
        processing: "Trying to understand what happened",
        keyQuestions: [
          "Are you saying this was preventable?",
          "How could this happen?",
          "Did you almost kill my husband?"
        ]
      },
      geminiContext: {
        focus: "Processing shocking information",
        emotionalInflection: "Based on delivery quality",
        informationBoundary: "Error occurred, basic facts only"
      },
      branchPoints: {
        "clear_empathetic": { 
          next: "emotional_processing", 
          emotionDelta: -0.2,
          description: "Family is upset but engaging"
        },
        "medical_jargon": { 
          next: "emotional_processing", // Still goes to emotional_processing but with higher emotion
          emotionDelta: +0.3,
          description: "Family becomes more frustrated"
        },
        "defensive": { 
          next: "emotional_processing", // Still goes to emotional_processing but with higher emotion
          emotionDelta: +0.5,
          description: "Family becomes hostile"
        }
      }
    },
    
    {
      id: "emotional_processing",
      name: "Managing Emotional Response",
      duration: "7-11 minutes",
      objective: "Support family through emotional reaction",
      maxMessages: 6,
      difficultyOverrides: {
        beginner: { maxMessages: 8 },
        advanced: { maxMessages: 4 },
      },
      learnerTasks: [
        { text: "Acknowledge emotions", keywords: ["understand", "feel", "imagine", "must be", "hear you", "see that", "feelings"] },
        { text: "Remain calm and present", keywords: ["here for you", "i'm here", "not going anywhere", "take your time", "listen", "stay"] },
        { text: "Continue answering questions", keywords: ["let me explain", "good question", "i'll tell you", "absolutely", "of course", "happy to"] },
        { text: "Don't become defensive", keywords: [] },
      ],
      avatarState: {
        emotional: "Varies by difficulty level",
        copingBehaviors: [
          "Asking repeated questions",
          "Expressing anger or blame",
          "Showing signs of grief"
        ]
      },
      supportingAvatarTriggers: {
        daughter: {
          condition: "emotionalIntensity > 0.7",
          threshold: 0.7,
          entry: "Mom calls daughter on phone"
        }
      },
      geminiContext: {
        focus: "Height of emotional response",
        adaptiveBehavior: "Match difficulty level intensity",
        memoryIntegration: "Remember what learner has said"
      }
    },
    
    {
      id: "clinical_questions",
      name: "Detailed Questions Phase",
      duration: "11-13 minutes",
      objective: "Address specific concerns and questions",
      maxMessages: 5,
      difficultyOverrides: {
        beginner: { maxMessages: 7 },
        advanced: { maxMessages: 4 },
      },
      learnerTasks: [
        { text: "Explain current medical status", keywords: ["currently", "right now", "at this moment", "stable", "condition", "status", "intensive care"] },
        { text: "Discuss prognosis honestly", keywords: ["recovery", "outlook", "expect", "prognosis", "future", "hopeful", "uncertain", "outcome"] },
        { text: "Outline treatment plan", keywords: ["plan", "next steps", "treatment", "going to do", "monitor", "team"] },
        { text: "Address prevention measures", keywords: ["prevent", "make sure", "steps", "protocols", "won't happen", "safeguards", "changes"] },
      ],
      commonQuestions: [
        "Will he have brain damage?",
        "Who's taking care of him now?",
        "How do I know this won't happen again?",
        "Should we transfer him?"
      ],
      avatarState: {
        emotional: "information gathering"
      },
      geminiContext: {
        focus: "Information gathering mode",
        expectation: "Specific, clear answers",
        trustBuilding: "Honesty and competence demonstration"
      }
    },
    
    {
      id: "next_steps",
      name: "Planning and Closure",
      duration: "13-15 minutes",
      objective: "Establish path forward",
      maxMessages: 4,
      difficultyOverrides: {
        beginner: { maxMessages: 6 },
        advanced: { maxMessages: 3 },
      },
      learnerTasks: [
        { text: "Provide contact information", keywords: ["call me", "reach me", "phone", "number", "contact", "available", "pager"] },
        { text: "Arrange follow-up meeting", keywords: ["follow up", "meet again", "come back", "tomorrow", "check in", "morning"] },
        { text: "Offer support resources", keywords: ["chaplain", "counselor", "support", "social worker", "someone to talk to", "resources", "patient advocate"] },
        { text: "Ensure immediate needs met", keywords: ["need anything", "can i get", "water", "someone here", "family", "call someone", "daughter"] },
      ],
      avatarState: {
        emotional: "varies by outcome"
      },
      geminiContext: {
        focus: "Resolution and closure"
      },
      resolutionPaths: {
        "trust_rebuilt": {
          indicators: ["Family asks about visiting", "Focuses on patient care"],
          outcome: "Collaborative path forward"
        },
        "guarded_acceptance": {
          indicators: ["Still angry but listening", "Asking about options"],
          outcome: "Tentative cooperation"
        },
        "hostile_impasse": {
          indicators: ["Demands transfer", "Threatens legal action"],
          outcome: "Risk management involvement needed"
        }
      }
    }
  ],
  
  conversationMechanics: {
    emotionalTracking: {
      method: "continuous",
      scale: {
        min: 0,
        max: 1,
        thresholds: {
          concerned: 0.3,
          upset: 0.5,
          angry: 0.7,
          hostile: 0.9
        }
      },
      modifiers: {
        empathyShown: -0.1,
        medicalJargon: +0.15,
        defensiveness: +0.3,
        honestApology: -0.2,
        clearExplanation: -0.15
      }
    },
    
    informationRevelation: {
      strategy: "graduated",
      stages: [
        "Error occurred",
        "Nature of error",
        "Immediate consequences",
        "Current status",
        "Prognosis",
        "Prevention plan"
      ]
    },
    
    adaptiveDifficulty: {
      adjustmentFactors: [
        "Learner performance",
        "Time in phase",
        "Emotional regulation success"
      ],
      escalationPrevention: {
        maxAttempts: 3,
        hintSystem: true,
        supportPrompts: [
          "Try acknowledging their emotions first",
          "Use simpler language to explain",
          "Express genuine regret for what happened"
        ]
      }
    }
  },
  
  geminiPromptStrategy: {
    basePrompt: {
      identity: "You are Margaret, a 68-year-old retired teacher whose husband just suffered a cardiac arrest due to a medication error",
      personality: "Refer to detailed avatar profile",
      currentState: "You've just been asked to come to the hospital urgently"
    },
    
    dynamicLayers: [
      {
        name: "emotionalStateLayer",
        updates: "Every response",
        integration: "Modifies tone and response intensity"
      },
      {
        name: "conversationHistoryLayer",
        updates: "Cumulative",
        integration: "References previous statements, maintains consistency"
      },
      {
        name: "informationBoundaryLayer",
        updates: "Phase-based",
        integration: "Limits knowledge to revealed information"
      },
      {
        name: "difficultyAdjustmentLayer",
        updates: "Performance-based",
        integration: "Modulates cooperation level"
      }
    ],
    
    responseGuidelines: {
      length: "2-3 sentences typically, up to 5 when very emotional",
      emotionalAuthenticity: "Match words with emotional state",
      questioningPattern: "Ask follow-ups based on learner's clarity",
      interruptionBehavior: "More frequent when angry",
      silenceUsage: "Pause after shocking information"
    }
  },
  
  assessmentHooks: {
    empathy: {
      semantic: true,
      patterns: [
        "emotional acknowledgment",
        "validation phrases",
        "reflective listening",
        "genuine concern expression"
      ],
      antiPatterns: [
        "minimizing emotions",
        "rushing through feelings",
        "false reassurance"
      ],
      weight: 0.4
    },
    
    clarity: {
      semantic: true,
      patterns: [
        "plain language usage",
        "structured explanation",
        "checking understanding",
        "appropriate detail level"
      ],
      antiPatterns: [
        "medical jargon",
        "vague explanations",
        "information overload"
      ],
      weight: 0.3
    },
    
    accountability: {
      semantic: true,
      patterns: [
        "clear responsibility acceptance",
        "system improvement discussion",
        "no blame shifting",
        "honest disclosure"
      ],
      antiPatterns: [
        "defensive responses",
        "excuse making",
        "minimizing error"
      ],
      weight: 0.3
    }
  },
  
  performanceMetrics: {
    phaseCompletion: {
      tracking: "Time and objective achievement",
      scoring: "Weighted by phase importance"
    },
    
    emotionalManagement: {
      tracking: "Avatar emotional trajectory",
      scoring: "Lower final emotional intensity = higher score"
    },
    
    informationDelivery: {
      tracking: "Clarity and completeness",
      scoring: "Based on avatar comprehension indicators"
    },
    
    overallEffectiveness: {
      calculation: "Weighted combination of all metrics",
      passingThreshold: 0.7,
      excellenceThreshold: 0.85
    }
  }
};

