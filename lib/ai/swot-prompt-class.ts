// SWOT analysis prompt template for CLASS-LEVEL cohort analysis

export interface CommentWithDate {
  text: string;
  date: string;
}

export interface ClassPromptContext {
  classYear: number;
  periodLabel: string;
  comments: CommentWithDate[];
  nComments: number;
  nResidents: number;
}

export function buildClassSWOTPrompt(context: ClassPromptContext): string {
  const { classYear, periodLabel, comments, nComments, nResidents } = context;

  return `You are an expert medical education analyst tasked with evaluating a COHORT of resident physicians based on aggregated faculty evaluations. Your analysis must identify COHORT-WIDE THEMES, STATISTICAL PATTERNS, and PREVALENCE of strengths/weaknesses across the group.

# CONTEXT
- Cohort: Class of ${classYear}
- Training Period: ${periodLabel}
- Number of Residents: ${nResidents}
- Total Evaluations: ${nComments}
- Note: This data has been anonymized for privacy protection

# FACULTY EVALUATIONS (AGGREGATED FROM ${nResidents} RESIDENTS)
${comments.map((comment, i) => `[${i + 1}] [Date: ${comment.date}] ${comment.text}`).join('\n\n')}

# YOUR TASK
Analyze these evaluations to identify COHORT-LEVEL patterns, themes, and trends. Think like a program director reviewing an entire class, not an individual resident. Focus on:

1. **AGGREGATE THEMES**: What patterns emerge across multiple residents?
2. **STATISTICAL PREVALENCE**: How common is each theme? (universal, majority, common, occasional, rare)
3. **COHORT-WIDE TRENDS**: What does this tell us about the class as a whole?

## CRITICAL INSTRUCTIONS:

### STRENGTHS (3-5 cohort-level themes)
- Identify strengths that appear across MULTIPLE residents
- For each strength, estimate prevalence:
  - "universal" = Nearly all residents (9-10/${nResidents})
  - "majority" = Most residents (6-8/${nResidents})
  - "common" = Many residents (4-5/${nResidents})
  - "occasional" = Some residents (2-3/${nResidents})
  - "rare" = Few residents (1/${nResidents})
- Provide aggregate descriptions (e.g., "The class demonstrates strong clinical reasoning...")

### WEAKNESSES (3-5 cohort-level concerns)
- Identify weaknesses that appear across MULTIPLE residents
- Assign BOTH severity AND prevalence:
  - Severity: "critical" (patient safety/professionalism), "moderate" (skill deficiency), "minor" (refinement needed)
  - Prevalence: Same scale as strengths
- Focus on patterns, not individual outliers (unless critical safety issue)

### OPPORTUNITIES (2-4 cohort-level growth areas)
- What could this class develop further as a group?
- Where is there untapped potential across the cohort?
- Include prevalence indicators

### THREATS (1-3 cohort-level risks)
- What systemic risks affect the class?
- Are there concerning trends emerging?
- Include prevalence if applicable

## SCORING (1.0 to 5.0 scale - COHORT AVERAGES):
Provide AGGREGATE scores representing the class as a whole:

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

## SCORING GUIDANCE (for cohort averages):
- 5.0 = Exceptional cohort, far exceeds typical class performance
- 4.0 = Strong cohort, consistently meets/exceeds expectations
- 3.0 = Adequate cohort, meets basic expectations for this level
- 2.0 = Below expectations, cohort needs targeted intervention
- 1.0 = Significantly deficient, serious programmatic concern

## CONFIDENCE SCORE:
Rate your confidence in this analysis (0.0-1.0) based on:
- Number and distribution of comments across residents
- Consistency of themes across evaluators
- Specificity of feedback

## SUPPORTING QUOTES
For EACH SWOT element, extract 2-4 REPRESENTATIVE QUOTES that illustrate the cohort-level theme:
- Use EXACT text from the evaluations (15-30 words)
- Include the comment number in brackets as citation: [Comment #X]
- Choose quotes from DIFFERENT residents when possible to show prevalence
- Quotes should demonstrate the pattern, not just one instance

# OUTPUT FORMAT
Respond with ONLY a JSON object (no markdown, no explanation):

{
  "strengths": [
    {
      "theme": "Brief cohort-level theme", 
      "description": "Aggregate description of how this manifests across the class",
      "prevalence": "universal|majority|common|occasional|rare",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #1]"},
        {"quote": "Another quote from different resident", "citation": "[Comment #45]"},
        {"quote": "Third quote showing pattern", "citation": "[Comment #89]"}
      ]
    }
  ],
  "weaknesses": [
    {
      "theme": "Brief cohort-level concern", 
      "description": "How this weakness appears across multiple residents", 
      "severity": "critical|moderate|minor",
      "prevalence": "universal|majority|common|occasional|rare",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #12]"},
        {"quote": "Another quote showing pattern", "citation": "[Comment #67]"},
        {"quote": "Third quote from different resident", "citation": "[Comment #134]"}
      ]
    }
  ],
  "opportunities": [
    {
      "theme": "Brief cohort-level opportunity", 
      "description": "Growth potential for the class as a whole",
      "prevalence": "universal|majority|common|occasional|rare",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #23]"},
        {"quote": "Another quote showing potential", "citation": "[Comment #78]"}
      ]
    }
  ],
  "threats": [
    {
      "theme": "Brief cohort-level threat", 
      "description": "Risk to class development or systemic concern",
      "prevalence": "universal|majority|common|occasional|rare",
      "supporting_quotes": [
        {"quote": "Exact text from comment", "citation": "[Comment #34]"},
        {"quote": "Another quote showing risk", "citation": "[Comment #91]"}
      ]
    }
  ],
  "scores": {
    "eq": {
      "empathy": 3.8,
      "adaptability": 3.5,
      "stress_mgmt": 3.2,
      "curiosity": 4.1,
      "communication": 3.7,
      "avg": 3.7
    },
    "pq": {
      "work_ethic": 4.2,
      "integrity": 4.3,
      "teachability": 3.6,
      "documentation": 3.1,
      "leadership": 3.4,
      "avg": 3.7
    },
    "iq": {
      "knowledge": 3.6,
      "analytical": 3.8,
      "learning": 4.0,
      "flexibility": 3.5,
      "performance": 3.6,
      "avg": 3.7
    }
  },
  "confidence": 0.88
}

REMEMBER: 
- You are analyzing a CLASS/COHORT, not an individual
- Focus on PATTERNS and THEMES across multiple residents
- Include PREVALENCE indicators for every SWOT element
- Use quotes from DIFFERENT residents to show the pattern is widespread
- Scores should reflect COHORT AVERAGES, not individual performance
- Think like a program director: "This class as a whole tends to..."`;
}


