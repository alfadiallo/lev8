// MED-001: Educator Guide Data
// Comprehensive guide for educators facilitating this vignette

import { EducatorGuide } from '../../../types/difficult-conversations';

export const educatorGuide: EducatorGuide = {
  overview: {
    title: "Educator's Guide: Disclosing a Medication Error",
    subtitle: "Adenosine Administration in Ventricular Tachycardia",
    totalDuration: "25 minutes (15-minute simulation + 10-minute debrief)",
    setting: "Private room or simulation lab",
    participants: "1 educator, 1 learner",
    materialsNeeded: [
      "This guide",
      "Timer",
      "Notepad for observations",
      "Debrief checklist"
    ]
  },
  
  preBriefing: {
    duration: "2 minutes",
    script: "Today we'll be practicing a difficult conversation about disclosing a serious medication error. You'll be playing yourself as an emergency physician who needs to speak with a patient's spouse about an error that occurred during treatment. Take a moment to review the scenario, then we'll begin.",
    keyPoints: [
      "Emphasize this is a safe learning environment",
      "Mistakes in simulation are learning opportunities",
      "Focus is on communication skills, not clinical knowledge"
    ]
  },
  
  scenarioSummary: {
    clinicalContext: "72-year-old male with cardiomyopathy presented with wide-complex tachycardia. Misdiagnosed as SVT with aberrancy and given adenosine, which precipitated VF arrest. Successfully resuscitated but now intubated in ICU.",
    communicationChallenge: "Disclose error to spouse who is anxious and potentially hostile",
    criticalElements: [
      "Honest disclosure",
      "Managing emotions",
      "Rebuilding trust",
      "Addressing legal concerns"
    ]
  },
  
  difficultyGuidance: {
    selectingDifficulty: {
      beginner: {
        learnerProfile: "PGY1-2 or first error disclosure",
        spouseBehavior: "Shocked but ultimately understanding",
        emotionalIntensity: "Moderate",
        recommendation: "Start here for most learners"
      },
      intermediate: {
        learnerProfile: "PGY3-4 or some disclosure experience",
        spouseBehavior: "Angry and demanding answers",
        emotionalIntensity: "High",
        recommendation: "Use when basics are mastered"
      },
      advanced: {
        learnerProfile: "Senior residents or assessment",
        spouseBehavior: "Hostile and threatening legal action",
        emotionalIntensity: "Very high",
        recommendation: "Reserve for advanced learners"
      }
    }
  },
  
  observationGuide: {
    phases: [
      {
        phase: "Introduction",
        duration: "3 minutes",
        watchFor: [
          "Clear self-introduction",
          "Acknowledges serious nature",
          "Ensures privacy and comfort"
        ],
        redFlags: [
          "Rushing to medical details",
          "Avoiding eye contact",
          "Standing while family sits"
        ]
      },
      {
        phase: "Error Disclosure",
        duration: "4 minutes",
        watchFor: [
          "Clear statement that error occurred",
          "Plain language explanation",
          "Accepts responsibility",
          "Appropriate regret expression"
        ],
        redFlags: [
          "Excessive medical jargon",
          "Defensive responses",
          "Minimizing the error",
          "Blaming others or systems"
        ]
      },
      {
        phase: "Emotional Response",
        duration: "4 minutes",
        watchFor: [
          "Acknowledges emotions",
          "Remains calm",
          "Shows genuine empathy",
          "Doesn't become defensive"
        ],
        redFlags: [
          "Dismissing emotions",
          "Becoming argumentative",
          "False reassurance",
          "Shutting down"
        ]
      },
      {
        phase: "Next Steps",
        duration: "3 minutes",
        watchFor: [
          "Clear medical update",
          "Honest prognosis",
          "System improvement discussion",
          "Concrete follow-up plan"
        ],
        redFlags: [
          "Vague promises",
          "Avoiding questions",
          "No follow-up offered",
          "Rushing to end"
        ]
      }
    ]
  },
  
  debriefStructure: {
    format: "Advocacy-inquiry with good judgment",
    phases: [
      {
        phase: "Initial Reflection",
        duration: "2 minutes",
        opening: "That was a challenging conversation. How do you feel it went?",
        followUp: [
          "What was most difficult for you?",
          "What emotions did you experience?"
        ]
      },
      {
        phase: "Specific Feedback",
        duration: "4 minutes",
        structure: {
          strengths: "Start with 2-3 specific positive observations",
          improvements: "Address 1-2 key areas for growth",
          approach: "Use specific examples from simulation"
        }
      },
      {
        phase: "Key Teaching Points",
        duration: "3 minutes",
        topics: [
          {
            topic: "Error Disclosure Best Practices",
            points: [
              "Use clear language: 'I made an error' not 'suboptimal outcome'",
              "Express regret without admitting legal liability",
              "Focus on both individual and system improvements",
              "Never promise outcomes you can't guarantee"
            ]
          },
          {
            topic: "Managing Your Emotions",
            points: [
              "Feeling defensive is natural - acknowledge internally",
              "Practice self-compassion while maintaining professionalism",
              "Remember: You're human and errors happen",
              "Focus on learning and improvement"
            ]
          }
        ]
      },
      {
        phase: "Action Planning",
        duration: "1 minute",
        prompt: "What's one specific thing from today's session you'll apply in your practice?"
      }
    ]
  },
  
  assessmentChecklist: {
    criteria: [
      {
        item: "Disclosed error clearly and honestly",
        weight: "Critical",
        indicators: ["Used word 'error'", "No euphemisms", "Direct statement"]
      },
      {
        item: "Used appropriate language",
        weight: "Critical", 
        indicators: ["Avoided jargon", "Clear explanations", "Checked understanding"]
      },
      {
        item: "Expressed appropriate regret",
        weight: "Important",
        indicators: ["Said 'I'm sorry'", "No legal admissions", "Genuine tone"]
      },
      {
        item: "Acknowledged emotions",
        weight: "Critical",
        indicators: ["Named emotions", "Validated feelings", "Didn't dismiss"]
      },
      {
        item: "Remained professional",
        weight: "Important",
        indicators: ["Calm demeanor", "No defensiveness", "Appropriate boundaries"]
      },
      {
        item: "Explained next steps",
        weight: "Important",
        indicators: ["Clear plan", "Specific timeline", "Contact information"]
      },
      {
        item: "Provided follow-up",
        weight: "Important",
        indicators: ["Meeting scheduled", "Resources offered", "Availability stated"]
      }
    ],
    
    scoringRubric: {
      exemplary: "Meets all criteria with exceptional skill",
      proficient: "Meets all critical and most important criteria",
      developing: "Meets most critical criteria, working on others",
      needsImprovement: "Missing multiple critical criteria"
    }
  },
  
  commonPitfalls: [
    {
      pitfall: "Using medical jargon",
      example: "Saying 'iatrogenic ventricular fibrillation'",
      correction: "Say 'the medication caused a dangerous heart rhythm'"
    },
    {
      pitfall: "Being defensive",
      example: "Well, it's an easy mistake to make...",
      correction: "I take responsibility for this error"
    },
    {
      pitfall: "Minimizing impact",
      example: "These things happen sometimes",
      correction: "This should not have happened, and I'm sorry"
    },
    {
      pitfall: "Information overload",
      example: "Explaining all EKG criteria",
      correction: "Focus on what family needs to know"
    }
  ],
  
  clinicalPearls: [
    {
      topic: "VT vs SVT Differentiation",
      keyPoints: [
        "VT: AV dissociation, capture beats, QRS >140ms",
        "When uncertain, treat as VT",
        "Adenosine contraindicated in wide-complex tachycardia"
      ]
    },
    {
      topic: "Error Categories",
      keyPoints: [
        "Category C: Reached patient, no harm",
        "Category D: Reached patient, required intervention",
        "Category E: Temporary harm",
        "Category F: Permanent harm"
      ]
    }
  ],
  
  resources: {
    preparation: [
      {
        title: "AHRQ CANDOR Toolkit",
        url: "https://www.ahrq.gov/patient-safety/capacity/candor",
        description: "Comprehensive error disclosure framework"
      },
      {
        title: "IHI Respectful Management of Serious Clinical Adverse Events",
        description: "Best practices for error disclosure"
      }
    ],
    
    additionalReading: [
      "Hospital error disclosure policy",
      "State apology laws",
      "Risk management guidelines"
    ],
    
    followUp: [
      "Schedule additional practice if needed",
      "Review specific communication techniques",
      "Consider peer observation"
    ]
  },
  
  keyTakeaway: "Disclosing medical errors is one of the hardest conversations we have. It requires courage, compassion, and skill. Today's practice will help you handle these situations with greater confidence and effectiveness. Remember: honest disclosure, delivered with empathy, not only fulfills our ethical obligations but often strengthens the therapeutic relationship and reduces litigation risk."
};

