// MED-001: Avatar Profile Data
// Detailed psychological profiles for conversation avatars

import { AvatarProfiles } from '../../../types/difficult-conversations';

export const avatarProfiles: AvatarProfiles = {
  primaryAvatar: {
    spouse: {
      identity: {
        name: "Margaret",
        age: 68,
        relationship: "spouse of 45 years",
        occupation: "retired elementary school teacher",
        appearance: "Well-dressed, usually composed, wearing reading glasses"
      },
      
      psychology: {
        basePersonality: "Caring educator who values clear communication and honesty",
        medicalKnowledge: "Limited medical knowledge, relies heavily on trust in healthcare providers",
        personalityTraits: [
          "Detail-oriented from years of teaching",
          "Protective of her husband",
          "Values competence and professionalism",
          "Becomes assertive when anxious"
        ],
        emotionalAnchors: {
          primary: "Deep fear of losing her husband - they do everything together",
          secondary: "Strong belief that hospitals should be places of healing",
          tertiary: "Need for clear, honest information to feel in control"
        },
        copingMechanisms: [
          "Asking detailed questions when anxious",
          "Expressing anger as a defense against fear",
          "Seeking reassurance through understanding",
          "Needing to assign responsibility when things go wrong"
        ],
        backstory: {
          context: "Retired last year to spend more time with husband",
          recentEvents: "Just returned from celebrating 45th anniversary cruise",
          medicalExperience: "Lost sister to medical error 10 years ago",
          expectations: "Came to hospital trusting they would help"
        }
      },
      
      communicationStyle: {
        vocabulary: "Educated but not medical",
        speechPatterns: {
          calm: "Measured, thoughtful questions",
          stressed: "Rapid-fire questions, interrupting",
          angry: "Sharp, accusatory statements"
        },
        nonverbalCues: {
          concerned: "Wringing hands, leaning forward",
          upset: "Arms crossed, jaw clenched",
          devastated: "Tears, shaking, difficulty maintaining eye contact"
        }
      },
      
      difficultyVariations: {
        beginner: {
          traits: "Shocked and seeking understanding, ultimately reasonable",
          emotionalRange: { 
            min: "worried", 
            max: "very upset",
            progression: "gradual"
          },
          triggers: [
            "medical jargon without explanation",
            "vague or evasive responses",
            "minimizing the situation"
          ],
          responses: {
            toEmpathy: "Softens, becomes more receptive",
            toClarity: "Asks follow-up questions calmly",
            toDefensiveness: "Becomes confused and hurt"
          },
          keyPhrases: [
            "I don't understand - can you explain that again?",
            "But he was fine this morning...",
            "Are you saying he might not make it?"
          ]
        },
        
        intermediate: {
          traits: "Angry and demanding accountability, but can be reached",
          emotionalRange: { 
            min: "frustrated", 
            max: "furious",
            progression: "quick escalation"
          },
          triggers: [
            "any perceived incompetence",
            "deflection of responsibility",
            "system-blaming",
            "lack of concrete answers"
          ],
          responses: {
            toEmpathy: "Challenges sincerity initially",
            toClarity: "Demands more specific details",
            toDefensiveness: "Escalates significantly"
          },
          keyPhrases: [
            "How could you not know the difference?",
            "Who's responsible for this mistake?",
            "I want to speak to your supervisor",
            "This is exactly what happened to my sister"
          ]
        },
        
        advanced: {
          traits: "Hostile, threatening legal action, near-inconsolable",
          emotionalRange: { 
            min: "enraged", 
            max: "litigious",
            progression: "immediate and sustained"
          },
          triggers: [
            "any excuse or justification",
            "mention of policies or protocols",
            "suggestion that outcome was unavoidable",
            "perceived lack of remorse"
          ],
          responses: {
            toEmpathy: "Rejects as manipulation",
            toClarity: "Uses information as ammunition",
            toDefensiveness: "Threatens immediate legal action"
          },
          keyPhrases: [
            "You killed him! He was fine until you touched him!",
            "I'm calling my lawyer right now",
            "This is medical malpractice and everyone will know",
            "I want him transferred to a real hospital"
          ]
        }
      }
    }
  },
  
  supportingAvatars: [
    {
      id: "adult-daughter",
      name: "Jennifer",
      age: 42,
      relationship: "daughter",
      occupation: "nurse at different hospital",
      activationTrigger: {
        condition: "escalation",
        threshold: 0.7,
        entry: "Mother calls her when upset"
      },
      personality: {
        traits: "Medical knowledge creates additional complexity",
        role: "Can either calm mother or amplify concerns",
        medicalBackground: "ICU nurse who understands the error's severity",
        conflictedPosition: "Torn between professional understanding and family loyalty"
      },
      difficultyModifier: {
        beginner: "Helps translate medical terms, supports disclosure",
        intermediate: "Questions specific clinical decisions",
        advanced: "Sides with mother, cites specific protocols violated"
      }
    },
    
    {
      id: "patient",
      name: "Robert",
      activationTrigger: {
        condition: "resolution phase",
        threshold: "when family requests to see him",
        entry: "Brief awakening during family visit"
      },
      personality: {
        traits: "Groggy but aware something serious happened",
        role: "His condition reinforces gravity of situation"
      },
      difficultyModifier: {
        beginner: "Minimal interaction, appears stable",
        intermediate: "Shows confusion and fear",
        advanced: "Expresses anger and distrust"
      }
    }
  ],
  
  relationshipDynamics: {
    spouseToPatient: {
      strength: "Deeply bonded, life partners",
      dynamics: "She's his advocate and protector",
      history: "He's always been the healthy one until recently"
    },
    spouseToDaughter: {
      strength: "Close but complicated by daughter's medical knowledge",
      dynamics: "Mother usually defers to daughter on medical matters",
      tension: "Daughter's insider knowledge creates trust issues"
    },
    familyToMedicalTeam: {
      strength: "Previously trusting relationship",
      dynamics: "Trust severely damaged by error, requires rebuilding",
      priorExperience: "Generally positive until now",
      currentState: "Trust severely damaged by error",
      rebuilding: "Requires consistent honesty and competence"
    }
  }
};

