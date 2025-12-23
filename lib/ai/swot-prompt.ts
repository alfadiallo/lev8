// SWOT analysis prompt templates for Claude

// Rubric Version Tracking
export const SWOT_RUBRIC_VERSION = '1.0.0';
export const SWOT_RUBRIC_LAST_UPDATED = '2025-01-22';

export interface CommentWithDate {
  text: string;
  date: string;
}

export interface PromptContext {
  residentName: string;
  residentPseudonym?: string; // Anonymized identifier for privacy
  periodLabel: string;
  comments: CommentWithDate[];
  nComments: number;
}

export function buildSWOTPrompt(context: PromptContext): string {
  const { residentName, residentPseudonym, periodLabel, comments, nComments } = context;
  
  // Use pseudonym if provided (for privacy), otherwise fall back to real name
  const displayName = residentPseudonym || residentName;
  const privacyNote = residentPseudonym ? '\n- Note: This data has been anonymized for privacy protection' : '';

  return `You are an expert medical education analyst tasked with evaluating a resident physician's performance based on faculty evaluations. Your analysis must be BRUTALLY HONEST, evidence-based, and clinically focused.

# CONTEXT
- Resident: ${displayName}
- Training Period: ${periodLabel}
- Number of Evaluations: ${nComments}${privacyNote}

# FACULTY EVALUATIONS
${comments.map((comment, i) => `[${i + 1}] [Date: ${comment.date}] ${comment.text}`).join('\n\n')}

# YOUR TASK
Analyze these evaluations and provide a comprehensive SWOT analysis with quantitative scores. Be DIRECT and HONEST - this is for professional development, not a performance review letter.

## CRITICAL INSTRUCTIONS:
1. **STRENGTHS**: Identify 3-5 genuine strengths with specific evidence from comments
2. **WEAKNESSES**: Identify 3-5 areas needing improvement. For EACH weakness, assign a severity level:
   - "critical": Immediate patient safety concern, professionalism issue, or major competency gap
   - "moderate": Significant skill deficiency requiring focused improvement plan
   - "minor": Area for refinement, normal developmental need
3. **OPPORTUNITIES**: 2-4 growth areas or untapped potential based on strengths
4. **THREATS**: 1-3 risks to development (burnout, bad habits forming, skill plateaus)

## SCORING (1.0 to 5.0 scale):
Score the resident on these attributes based on EVIDENCE in the comments:

### EQ (Emotional Intelligence):
- empathy: Patient/family interactions, compassion
- adaptability: Handling change, flexibility
- stress_mgmt: Performance under pressure, resilience
- curiosity: Learning drive, asking questions
- communication: Clarity, professionalism, team communication

### PQ (Professional Intelligence):
- work_ethic: Reliability, dedication, follow-through
- integrity: Honesty, accountability, ethics
- teachability: Accepting feedback, implementing changes
- documentation: Charting quality, thoroughness
- leadership: Team dynamics, teaching, taking charge

### IQ (Intellectual Intelligence):
- knowledge: Medical knowledge base
- analytical: Clinical reasoning, problem-solving
- learning: Ability to acquire new information
- flexibility: Adapting approach based on evidence
- performance: Overall clinical performance for level

## SCORING GUIDANCE:
- 5.0 = Exceptional, far exceeds expectations
- 4.0 = Strong, consistently meets/exceeds expectations
- 3.0 = Adequate, meets basic expectations
- 2.0 = Below expectations, needs improvement
- 1.0 = Significantly deficient, serious concern

## CONFIDENCE SCORE:
Rate your confidence in this analysis (0.0-1.0) based on:
- Number and quality of comments
- Consistency across evaluators
- Specificity of feedback

## SUPPORTING QUOTES
For EACH SWOT element, extract 2-3 SPECIFIC QUOTES from the comments that support your analysis:
- Use EXACT text from the evaluations (15-30 words)
- Include the comment number in brackets as citation: [Comment #X]
- Choose quotes that best illustrate the theme

# OUTPUT FORMAT
Respond with ONLY a JSON object (no markdown, no explanation):

{
  "strengths": [
    {
      "theme": "Brief theme", 
      "description": "Specific evidence-based description",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #1]"},
        {"quote": "Another exact quote", "citation": "[Comment #5]"}
      ]
    }
  ],
  "weaknesses": [
    {
      "theme": "Brief theme", 
      "description": "Specific concern", 
      "severity": "critical|moderate|minor",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #3]"},
        {"quote": "Another exact quote", "citation": "[Comment #7]"}
      ]
    }
  ],
  "opportunities": [
    {
      "theme": "Brief theme", 
      "description": "Growth potential",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #2]"}
      ]
    }
  ],
  "threats": [
    {
      "theme": "Brief theme", 
      "description": "Risk to development",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #4]"}
      ]
    }
  ],
  "scores": {
    "eq": {
      "empathy": 3.5,
      "adaptability": 3.0,
      "stress_mgmt": 2.5,
      "curiosity": 4.0,
      "communication": 3.5,
      "avg": 3.3
    },
    "pq": {
      "work_ethic": 4.0,
      "integrity": 4.5,
      "teachability": 3.0,
      "documentation": 2.5,
      "leadership": 3.0,
      "avg": 3.4
    },
    "iq": {
      "knowledge": 3.5,
      "analytical": 3.0,
      "learning": 4.0,
      "flexibility": 3.5,
      "performance": 3.0,
      "avg": 3.4
    }
  },
  "confidence": 0.85
}

REMEMBER: 
- Be HONEST. If the comments show serious concerns, flag them as "critical". If performance is mediocre, score it as 2.0-3.0. Don't inflate scores.
- Include 2-3 supporting quotes for EACH SWOT element using exact text from the numbered comments above.`;
}

/**
 * Get rubric metadata for version tracking
 */
export function getRubricMetadata() {
  return {
    version: SWOT_RUBRIC_VERSION,
    lastUpdated: SWOT_RUBRIC_LAST_UPDATED,
    type: 'individual_resident' as const
  };
}

export function buildTestPrompt(): string {
  return buildSWOTPrompt({
    residentName: 'Test Resident',
    periodLabel: 'PGY-1 Fall',
    comments: [
      { text: 'Excellent communication with patients and families.', date: '3/15/2024' },
      { text: 'Needs to improve time management during busy shifts.', date: '3/20/2024' },
      { text: 'Strong clinical reasoning skills for this level.', date: '4/1/2024' },
    ],
    nComments: 3,
  });
}

