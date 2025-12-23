// Semantic Pattern Matcher: Advanced pattern matching for semantic concepts
// Handles patterns like "emotional acknowledgment", "validation phrases", etc.

import { PatternMatch } from '../../types/difficult-conversations';

export class SemanticPatternMatcher {
  /**
   * Match semantic patterns with more sophisticated meaning-based detection
   */
  static matchSemanticPattern(pattern: string, message: string): PatternMatch | null {
    const text = message.toLowerCase();
    
    // Map semantic patterns to concrete indicators
    const patternMap: Record<string, string[]> = {
      // Empathy patterns
      'emotional acknowledgment': [
        'i understand how you feel',
        'i can see this is difficult',
        'i know this is hard',
        'i hear your concern',
        'that must be',
        'i can imagine',
        'i appreciate that',
        'your feelings are valid',
        'this is understandably',
      ],
      'validation phrases': [
        'you\'re right to',
        'it\'s completely understandable',
        'that makes sense',
        'i don\'t blame you',
        'anyone would feel',
        'that\'s a valid concern',
      ],
      'reflective listening': [
        'so you\'re saying',
        'what i hear you saying',
        'if i understand correctly',
        'you mean',
        'it sounds like',
      ],
      'genuine concern expression': [
        'i\'m so sorry',
        'i\'m truly sorry',
        'i deeply regret',
        'this is heartbreaking',
        'my heart goes out',
      ],
      
      // Empathy anti-patterns
      'minimizing emotions': [
        'don\'t worry',
        'it\'s not that bad',
        'everything will be fine',
        'you\'re overreacting',
        'calm down',
        'it could be worse',
      ],
      'rushing through feelings': [
        'let\'s move on',
        'we need to focus on',
        'there\'s no time for',
        'we should talk about',
      ],
      'false reassurance': [
        'everything will be okay',
        'it\'ll all work out',
        'don\'t worry about it',
        'these things happen',
      ],
      
      // Clarity patterns
      'plain language usage': [
        'in simple terms',
        'let me explain',
        'to put it simply',
        'what that means is',
        'in other words',
      ],
      'structured explanation': [
        'first',
        'second',
        'third',
        'to summarize',
        'the key points are',
      ],
      'checking understanding': [
        'does that make sense',
        'do you understand',
        'are you following',
        'does this help',
        'any questions',
      ],
      'appropriate detail level': [
        'the important thing is',
        'what you need to know',
        'the bottom line',
      ],
      
      // Clarity anti-patterns
      'medical jargon': [
        'iatrogenic',
        'ventricular fibrillation',
        'hemodynamic instability',
        'tachyarrhythmia',
        'cardioversion',
        'defibrillation',
        'vasopressor',
        'intubation',
        'cardiopulmonary',
      ],
      'vague explanations': [
        'something went wrong',
        'things didn\'t go as planned',
        'there was a complication',
        'an issue occurred',
        'something happened',
      ],
      'information overload': [
        'additionally',
        'furthermore',
        'moreover',
        'it\'s also important to note',
        'another thing',
      ],
      
      // Accountability patterns
      'clear responsibility acceptance': [
        'i made an error',
        'i made a mistake',
        'i was wrong',
        'i take responsibility',
        'this is my fault',
        'i am responsible',
      ],
      'system improvement discussion': [
        'we will review',
        'we need to improve',
        'we\'ll make changes',
        'we\'ll ensure this doesn\'t happen',
        'we\'ll put safeguards in place',
      ],
      'no blame shifting': [
        // Positive: not blaming others
        // Detected by absence of blame language
      ],
      'honest disclosure': [
        'i want to be completely honest',
        'i need to tell you',
        'the truth is',
        'to be transparent',
        'frankly',
      ],
      
      // Accountability anti-patterns
      'defensive responses': [
        'but it\'s not my fault',
        'i was just following',
        'that\'s standard practice',
        'anyone would have done',
        'it\'s not uncommon',
      ],
      'excuse making': [
        'we were very busy',
        'it was chaotic',
        'there wasn\'t enough time',
        'the system is flawed',
        'these things happen',
      ],
      'minimizing error': [
        'it was just a small',
        'fortunately nothing serious',
        'it could have been worse',
        'the outcome was good',
        'no real harm was done',
      ],
    };

    // Get concrete indicators for this semantic pattern
    const indicators = patternMap[pattern.toLowerCase()];
    if (!indicators || indicators.length === 0) {
      // No mapping found, fall back to simple text matching
      return text.includes(pattern.toLowerCase()) ? {
        pattern,
        matched: true,
        confidence: 0.6,
        context: message.substring(0, 100),
      } : null;
    }

    // Check for any matching indicators
    let bestMatch: { indicator: string; confidence: number } | null = null;

    for (const indicator of indicators) {
      if (text.includes(indicator)) {
        const confidence = this.calculateIndicatorConfidence(indicator, message);
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { indicator, confidence };
        }
      }
    }

    // Also check for semantic variations
    const semanticVariations = this.findSemanticVariations(pattern, message);
    if (semanticVariations && (!bestMatch || semanticVariations.confidence > bestMatch.confidence)) {
      bestMatch = semanticVariations;
    }

    if (bestMatch && bestMatch.confidence >= 0.5) {
      return {
        pattern,
        matched: true,
        confidence: bestMatch.confidence,
        context: this.extractContext(message, bestMatch.indicator),
      };
    }

    return null;
  }

  /**
   * Calculate confidence for an indicator match
   */
  private static calculateIndicatorConfidence(indicator: string, message: string): number {
    let confidence = 0.7; // Base confidence

    // Boost for longer, more specific indicators
    if (indicator.split(' ').length > 2) {
      confidence = Math.min(0.95, confidence + 0.15);
    }

    // Boost for exact phrase matches
    const exactMatch = message.toLowerCase().includes(indicator.toLowerCase());
    if (exactMatch) {
      confidence = Math.min(0.95, confidence + 0.1);
    }

    // Reduce for very short indicators (common words)
    if (indicator.length < 5) {
      confidence = Math.max(0.5, confidence - 0.2);
    }

    return confidence;
  }

  /**
   * Find semantic variations of a pattern
   */
  private static findSemanticVariations(pattern: string, message: string): { indicator: string; confidence: number } | null {
    const text = message.toLowerCase();
    
    // For "no blame shifting", check absence of blame language
    if (pattern.toLowerCase() === 'no blame shifting') {
      const blameWords = ['fault', 'blame', 'their mistake', 'someone else', 'not my'];
      const hasBlameLanguage = blameWords.some(word => text.includes(word));
      if (!hasBlameLanguage) {
        // Positive: no blame language detected
        return { indicator: 'no blame language detected', confidence: 0.65 };
      }
    }

    return null;
  }

  /**
   * Extract context around a matched indicator
   */
  private static extractContext(message: string, indicator: string, contextLength: number = 80): string {
    const index = message.toLowerCase().indexOf(indicator.toLowerCase());
    if (index === -1) return message.substring(0, Math.min(contextLength, message.length));

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(message.length, index + indicator.length + contextLength / 2);
    return message.substring(start, end);
  }
}


