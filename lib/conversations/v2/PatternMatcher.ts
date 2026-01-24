// Pattern Matcher: Semantic pattern recognition for assessment
// Detects empathy, clarity, and accountability patterns in conversation messages

import { PatternMatch, AssessmentHooks, Message } from '../../types/difficult-conversations';
import { SemanticPatternMatcher } from './SemanticPatternMatcher';

export interface PatternMatcherConfig {
  assessmentHooks: AssessmentHooks;
  caseInsensitive?: boolean;
  minConfidence?: number;
}

export class PatternMatcher {
  private config: PatternMatcherConfig;
  private empathyPatterns: string[];
  private empathyAntiPatterns: string[];
  private clarityPatterns: string[];
  private clarityAntiPatterns: string[];
  private accountabilityPatterns: string[];
  private accountabilityAntiPatterns: string[];

  constructor(config: PatternMatcherConfig) {
    this.config = {
      caseInsensitive: true,
      minConfidence: 0.5,
      ...config,
    };

    // Extract patterns from assessment hooks
    this.empathyPatterns = config.assessmentHooks.empathy.patterns || [];
    this.empathyAntiPatterns = config.assessmentHooks.empathy.antiPatterns || [];
    this.clarityPatterns = config.assessmentHooks.clarity.patterns || [];
    this.clarityAntiPatterns = config.assessmentHooks.clarity.antiPatterns || [];
    this.accountabilityPatterns = config.assessmentHooks.accountability.patterns || [];
    this.accountabilityAntiPatterns = config.assessmentHooks.accountability.antiPatterns || [];
  }

  /**
   * Match empathy patterns in a message
   */
  matchEmpathyPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.empathyPatterns, 'empathy');
  }

  /**
   * Match empathy anti-patterns in a message
   */
  matchEmpathyAntiPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.empathyAntiPatterns, 'empathy-anti');
  }

  /**
   * Match clarity patterns in a message
   */
  matchClarityPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.clarityPatterns, 'clarity');
  }

  /**
   * Match clarity anti-patterns in a message
   */
  matchClarityAntiPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.clarityAntiPatterns, 'clarity-anti');
  }

  /**
   * Match accountability patterns in a message
   */
  matchAccountabilityPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.accountabilityPatterns, 'accountability');
  }

  /**
   * Match accountability anti-patterns in a message
   */
  matchAccountabilityAntiPatterns(message: string): PatternMatch[] {
    return this.matchPatterns(message, this.accountabilityAntiPatterns, 'accountability-anti');
  }

  /**
   * Core pattern matching logic
   */
  private matchPatterns(
    message: string,
    patterns: string[],
    _category: string
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];
    const text = this.config.caseInsensitive ? message.toLowerCase() : message;

    for (const pattern of patterns) {
      // Try semantic pattern matching first (for concepts like "emotional acknowledgment")
      if (this.isSemanticPattern(pattern)) {
        const semanticMatch = SemanticPatternMatcher.matchSemanticPattern(pattern, message);
        if (semanticMatch) {
          matches.push(semanticMatch);
          continue; // Skip literal matching if semantic match found
        }
      }

      // Fallback to simple keyword/phrase matching
      const patternLower = this.config.caseInsensitive ? pattern.toLowerCase() : pattern;
      if (text.includes(patternLower)) {
        const confidence = this.calculateConfidence(pattern, message);
        
        if (confidence >= (this.config.minConfidence || 0.5)) {
          matches.push({
            pattern,
            matched: true,
            confidence,
            context: this.extractContext(message, pattern),
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  private calculateConfidence(pattern: string, message: string): number {
    // Base confidence from exact match
    let confidence = 0.7;

    // Boost confidence if pattern appears multiple times
    const occurrences = (message.toLowerCase().match(new RegExp(pattern.toLowerCase(), 'g')) || []).length;
    if (occurrences > 1) {
      confidence = Math.min(0.95, confidence + (occurrences - 1) * 0.1);
    }

    // Boost confidence for longer, more specific patterns
    if (pattern.split(' ').length > 3) {
      confidence = Math.min(0.95, confidence + 0.15);
    }

    // Reduce confidence if pattern is very short (common word)
    if (pattern.length < 5) {
      confidence = Math.max(0.5, confidence - 0.2);
    }

    return confidence;
  }

  /**
   * Extract context around a matched pattern
   */
  private extractContext(message: string, pattern: string, contextLength: number = 50): string {
    const index = message.toLowerCase().indexOf(pattern.toLowerCase());
    if (index === -1) return message.substring(0, Math.min(contextLength, message.length));

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(message.length, index + pattern.length + contextLength / 2);
    return message.substring(start, end);
  }

  /**
   * Check if a pattern is semantic (requires meaning-based matching)
   */
  private isSemanticPattern(pattern: string): boolean {
    // Semantic patterns are concepts like "emotional acknowledgment", "validation phrases"
    // These are defined in SemanticPatternMatcher and need meaning-based matching
    // Check if pattern matches known semantic pattern names
    const semanticPatterns = [
      'emotional acknowledgment',
      'validation phrases',
      'reflective listening',
      'genuine concern expression',
      'minimizing emotions',
      'rushing through feelings',
      'false reassurance',
      'plain language usage',
      'structured explanation',
      'checking understanding',
      'appropriate detail level',
      'medical jargon',
      'vague explanations',
      'information overload',
      'clear responsibility acceptance',
      'system improvement discussion',
      'no blame shifting',
      'honest disclosure',
      'defensive responses',
      'excuse making',
      'minimizing error',
    ];
    return semanticPatterns.includes(pattern.toLowerCase()) || pattern.split(' ').length >= 3;
  }


  /**
   * Check if a word is too common to be meaningful
   */
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    ];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Analyze all patterns in a conversation message
   */
  analyzeMessage(message: string): {
    empathy: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
    clarity: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
    accountability: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
  } {
    return {
      empathy: {
        patterns: this.matchEmpathyPatterns(message),
        antiPatterns: this.matchEmpathyAntiPatterns(message),
      },
      clarity: {
        patterns: this.matchClarityPatterns(message),
        antiPatterns: this.matchClarityAntiPatterns(message),
      },
      accountability: {
        patterns: this.matchAccountabilityPatterns(message),
        antiPatterns: this.matchAccountabilityAntiPatterns(message),
      },
    };
  }

  /**
   * Analyze patterns across multiple messages (conversation history)
   */
  analyzeConversation(messages: Message[]): {
    empathy: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
    clarity: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
    accountability: {
      patterns: PatternMatch[];
      antiPatterns: PatternMatch[];
    };
  } {
    const userMessages = messages.filter(m => m.sender === 'user');
    const allText = userMessages.map(m => m.text).join(' ');

    return this.analyzeMessage(allText);
  }
}

