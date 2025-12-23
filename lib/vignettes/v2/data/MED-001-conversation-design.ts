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
      learnerTasks: [
        "Introduce self clearly",
        "Acknowledge serious nature",
        "Ensure privacy and comfort"
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
      learnerTasks: [
        "State clearly that an error occurred",
        "Explain in plain language",
        "Accept responsibility",
        "Express appropriate regret"
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
      learnerTasks: [
        "Acknowledge emotions",
        "Remain calm and present",
        "Continue answering questions",
        "Don't become defensive"
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
      learnerTasks: [
        "Explain current medical status",
        "Discuss prognosis honestly",
        "Outline treatment plan",
        "Address prevention measures"
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
      learnerTasks: [
        "Provide contact information",
        "Arrange follow-up meeting",
        "Offer support resources",
        "Ensure immediate needs met"
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

