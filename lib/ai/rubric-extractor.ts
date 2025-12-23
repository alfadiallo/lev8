// Rubric Extraction Utility
// Extracts human-readable rubric from SWOT prompt template

import { buildSWOTPrompt } from './swot-prompt';

export interface RubricSection {
  title: string;
  content: string;
  subsections?: RubricSection[];
}

export interface ParsedRubric {
  overview: string;
  categories: RubricSection[];
  scoringScale: RubricSection;
  scoringGuidance: string;
  evidenceRequirements: string;
  outputFormat: string;
}

/**
 * Extract rubric from the SWOT prompt template
 * This ensures the displayed rubric always matches what Claude receives
 */
export function extractRubricFromPrompt(): ParsedRubric {
  // Generate a sample prompt to extract structure from
  const samplePrompt = buildSWOTPrompt({
    residentName: 'Sample Resident',
    periodLabel: 'PGY-1 Fall',
    comments: [{ text: 'Sample comment', date: '2024-01-01' }],
    nComments: 1
  });

  return {
    overview: extractSection(samplePrompt, '# YOUR TASK', '## CRITICAL INSTRUCTIONS'),
    categories: parseCriticalInstructions(extractSection(samplePrompt, '## CRITICAL INSTRUCTIONS:', '## SCORING')),
    scoringScale: parseScoring(extractSection(samplePrompt, '## SCORING (1.0 to 5.0 scale):', '## SCORING GUIDANCE:')),
    scoringGuidance: extractSection(samplePrompt, '## SCORING GUIDANCE:', '## CONFIDENCE SCORE:'),
    evidenceRequirements: extractSection(samplePrompt, '## SUPPORTING QUOTES', '# OUTPUT FORMAT'),
    outputFormat: extractSection(samplePrompt, 'REMEMBER:', null)
  };
}

/**
 * Extract text between two markers
 */
function extractSection(text: string, startMarker: string, endMarker: string | null): string {
  const startIndex = text.indexOf(startMarker);
  if (startIndex === -1) return '';

  const contentStart = startIndex + startMarker.length;
  const endIndex = endMarker ? text.indexOf(endMarker, contentStart) : text.length;
  
  if (endIndex === -1) return text.substring(contentStart).trim();
  
  return text.substring(contentStart, endIndex).trim();
}

/**
 * Parse CRITICAL INSTRUCTIONS section into structured categories
 */
function parseCriticalInstructions(text: string): RubricSection[] {
  const sections: RubricSection[] = [];
  
  // Extract STRENGTHS
  const strengthsMatch = text.match(/\*\*STRENGTHS\*\*:([^*]+)/);
  if (strengthsMatch) {
    sections.push({
      title: 'Strengths',
      content: strengthsMatch[1].trim()
    });
  }

  // Extract WEAKNESSES with severity levels
  const weaknessesMatch = text.match(/\*\*WEAKNESSES\*\*:([^*]+?)(?=\d\.|\*\*|$)/s);
  if (weaknessesMatch) {
    const weaknessText = weaknessesMatch[1].trim();
    const severityLevels = [
      { level: 'critical', desc: weaknessText.match(/"critical":([^"]+)/)?.[1] || 'Immediate patient safety concern, professionalism issue, or major competency gap' },
      { level: 'moderate', desc: weaknessText.match(/"moderate":([^"]+)/)?.[1] || 'Significant skill deficiency requiring focused improvement plan' },
      { level: 'minor', desc: weaknessText.match(/"minor":([^"]+)/)?.[1] || 'Area for refinement, normal developmental need' }
    ];
    
    sections.push({
      title: 'Weaknesses',
      content: 'Identify 3-5 areas needing improvement. For EACH weakness, assign a severity level:',
      subsections: severityLevels.map(s => ({
        title: s.level.charAt(0).toUpperCase() + s.level.slice(1),
        content: s.desc.trim()
      }))
    });
  }

  // Extract OPPORTUNITIES
  const opportunitiesMatch = text.match(/\*\*OPPORTUNITIES\*\*:([^*]+)/);
  if (opportunitiesMatch) {
    sections.push({
      title: 'Opportunities',
      content: opportunitiesMatch[1].trim()
    });
  }

  // Extract THREATS
  const threatsMatch = text.match(/\*\*THREATS\*\*:([^*]+)/);
  if (threatsMatch) {
    sections.push({
      title: 'Threats',
      content: threatsMatch[1].trim()
    });
  }

  return sections;
}

/**
 * Parse SCORING section into structured format
 */
function parseScoring(text: string): RubricSection {
  const subsections: RubricSection[] = [];

  // Extract EQ attributes
  const eqMatch = text.match(/### EQ \(Emotional Intelligence\):(.+?)(?=###|$)/s);
  if (eqMatch) {
    const attributes = parseAttributes(eqMatch[1]);
    subsections.push({
      title: 'EQ (Emotional Intelligence)',
      content: '',
      subsections: attributes
    });
  }

  // Extract PQ attributes
  const pqMatch = text.match(/### PQ \(Professional Intelligence\):(.+?)(?=###|$)/s);
  if (pqMatch) {
    const attributes = parseAttributes(pqMatch[1]);
    subsections.push({
      title: 'PQ (Professional Intelligence)',
      content: '',
      subsections: attributes
    });
  }

  // Extract IQ attributes
  const iqMatch = text.match(/### IQ \(Intellectual Intelligence\):(.+?)(?=###|$)/s);
  if (iqMatch) {
    const attributes = parseAttributes(iqMatch[1]);
    subsections.push({
      title: 'IQ (Intellectual Intelligence)',
      content: '',
      subsections: attributes
    });
  }

  return {
    title: 'Scoring Attributes (1.0-5.0 scale)',
    content: 'Score the resident on these attributes based on EVIDENCE in the comments:',
    subsections
  };
}

/**
 * Parse attribute lines (e.g., "- empathy: Description")
 */
function parseAttributes(text: string): RubricSection[] {
  const lines = text.split('\n').filter(line => line.trim().startsWith('-'));
  return lines.map(line => {
    const match = line.match(/- (\w+):\s*(.+)/);
    if (match) {
      return {
        title: match[1].charAt(0).toUpperCase() + match[1].slice(1).replace(/_/g, ' '),
        content: match[2].trim()
      };
    }
    return { title: '', content: line.trim() };
  }).filter(item => item.title);
}

/**
 * Get human-readable scoring scale
 */
export function getScoringScale(): Array<{ score: string; description: string }> {
  return [
    { score: '5.0', description: 'Exceptional, far exceeds expectations' },
    { score: '4.0', description: 'Strong, consistently meets/exceeds expectations' },
    { score: '3.0', description: 'Adequate, meets basic expectations' },
    { score: '2.0', description: 'Below expectations, needs improvement' },
    { score: '1.0', description: 'Significantly deficient, serious concern' }
  ];
}


