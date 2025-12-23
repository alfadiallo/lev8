// Claude API client with retry logic for SWOT analysis
// WITH PII DETECTION for privacy protection

import Anthropic from '@anthropic-ai/sdk';
import { containsPII } from './anonymizer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface SupportingQuote {
  quote: string;
  citation: string;
}

export interface AnalysisResult {
  strengths: Array<{ 
    theme: string; 
    description: string;
    supporting_quotes?: SupportingQuote[];
  }>;
  weaknesses: Array<{ 
    theme: string; 
    description: string; 
    severity: 'critical' | 'moderate' | 'minor';
    supporting_quotes?: SupportingQuote[];
  }>;
  opportunities: Array<{ 
    theme: string; 
    description: string;
    supporting_quotes?: SupportingQuote[];
  }>;
  threats: Array<{ 
    theme: string; 
    description: string;
    supporting_quotes?: SupportingQuote[];
  }>;
  scores: {
    eq: {
      empathy: number;
      adaptability: number;
      stress_mgmt: number;
      curiosity: number;
      communication: number;
      avg: number;
    };
    pq: {
      work_ethic: number;
      integrity: number;
      teachability: number;
      documentation: number;
      leadership: number;
      avg: number;
    };
    iq: {
      knowledge: number;
      analytical: number;
      learning: number;
      flexibility: number;
      performance: number;
      avg: number;
    };
  };
  confidence: number;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeCommentsWithRetry(
  prompt: string,
  options: RetryOptions = {}
): Promise<AnalysisResult> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Claude] Attempt ${attempt + 1}/${maxRetries + 1}...`);
      
      // CRITICAL PRIVACY CHECK: Verify no PII in prompt before sending
      if (containsPII(prompt)) {
        console.error('[Claude] ⚠️  WARNING: Potential PII detected in prompt!');
        console.error('[Claude] Prompt preview:', prompt.substring(0, 500));
        throw new Error('PII detected in prompt! Anonymization may have failed. Aborting API call for privacy protection.');
      }
      
      console.log('[Claude] ✓ PII check passed - prompt is anonymized');
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.3, // Lower temperature for more consistent analysis
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract the text content
      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse the JSON response
      const text = content.text;
      
      // Try to extract JSON from markdown code blocks if present
      let jsonText = text;
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const result = JSON.parse(jsonText) as AnalysisResult;

      // Validate the structure
      if (!result.strengths || !result.weaknesses || !result.opportunities || !result.threats) {
        throw new Error('Invalid response structure: missing SWOT fields');
      }

      if (!result.scores || !result.scores.eq || !result.scores.pq || !result.scores.iq) {
        throw new Error('Invalid response structure: missing scores');
      }

      console.log(`[Claude] Success! Analyzed with ${result.confidence}% confidence`);
      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`[Claude] Attempt ${attempt + 1} failed:`, error);

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        console.log(`[Claude] Retrying in ${delay}ms...`);
        await sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
}

export async function testClaudeConnection(): Promise<boolean> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Reply with just the word "OK" if you can read this.',
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text' && content.text.includes('OK')) {
      console.log('[Claude] Connection test successful');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Claude] Connection test failed:', error);
    return false;
  }
}

