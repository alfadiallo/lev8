// Assessment Engine: Calculates scores based on pattern matching and conversation analysis
// Integrates PatternMatcher to provide real-time assessment updates

import { PatternMatcher, PatternMatcherConfig } from './PatternMatcher';
import {
  AssessmentResult,
  AssessmentHooks,
  AssessmentWeights,
  Message,
  PatternMatch,
} from '../../types/difficult-conversations';

export interface AssessmentEngineConfig {
  assessmentHooks: AssessmentHooks;
  weights: AssessmentWeights;
  passingScore: number;
  excellenceScore: number;
}

export class AssessmentEngine {
  private config: AssessmentEngineConfig;
  private patternMatcher: PatternMatcher;
  private conversationHistory: Message[] = [];
  private assessmentHistory: AssessmentResult[] = [];

  constructor(config: AssessmentEngineConfig) {
    this.config = config;
    this.patternMatcher = new PatternMatcher({
      assessmentHooks: config.assessmentHooks,
      caseInsensitive: true,
      minConfidence: 0.5,
    });
  }

  /**
   * Assess a single message and update scores
   */
  assessMessage(message: Message): AssessmentResult {
    // Add message to history
    this.conversationHistory.push(message);

    // Analyze patterns
    const analysis = this.patternMatcher.analyzeMessage(message.text);

    // Calculate scores
    const empathyScore = this.calculateEmpathyScore(analysis.empathy);
    const clarityScore = this.calculateClarityScore(analysis.clarity);
    const accountabilityScore = this.calculateAccountabilityScore(analysis.accountability);

    // Calculate overall score using weights
    const overallScore = this.calculateOverallScore({
      empathy: empathyScore,
      clarity: clarityScore,
      accountability: accountabilityScore,
    });

    const result: AssessmentResult = {
      empathy: {
        score: empathyScore,
        patterns: analysis.empathy.patterns,
        antiPatterns: analysis.empathy.antiPatterns,
      },
      clarity: {
        score: clarityScore,
        patterns: analysis.clarity.patterns,
        antiPatterns: analysis.clarity.antiPatterns,
      },
      accountability: {
        score: accountabilityScore,
        patterns: analysis.accountability.patterns,
        antiPatterns: analysis.accountability.antiPatterns,
      },
      overall: overallScore,
      timestamp: new Date(),
    };

    // Store in history
    this.assessmentHistory.push(result);

    return result;
  }

  /**
   * Assess entire conversation and return cumulative scores
   */
  assessConversation(messages: Message[]): AssessmentResult {
    // Analyze all messages together
    const analysis = this.patternMatcher.analyzeConversation(messages);

    // Calculate cumulative scores
    const empathyScore = this.calculateEmpathyScore(analysis.empathy);
    const clarityScore = this.calculateClarityScore(analysis.clarity);
    const accountabilityScore = this.calculateAccountabilityScore(analysis.accountability);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      empathy: empathyScore,
      clarity: clarityScore,
      accountability: accountabilityScore,
    });

    return {
      empathy: {
        score: empathyScore,
        patterns: analysis.empathy.patterns,
        antiPatterns: analysis.empathy.antiPatterns,
      },
      clarity: {
        score: clarityScore,
        patterns: analysis.clarity.patterns,
        antiPatterns: analysis.clarity.antiPatterns,
      },
      accountability: {
        score: accountabilityScore,
        patterns: analysis.accountability.patterns,
        antiPatterns: analysis.accountability.antiPatterns,
      },
      overall: overallScore,
      timestamp: new Date(),
    };
  }

  /**
   * Get current assessment scores (from latest assessment)
   */
  getCurrentScores(): {
    empathy: number;
    clarity: number;
    accountability: number;
    overall: number;
  } {
    if (this.assessmentHistory.length === 0) {
      return {
        empathy: 0,
        clarity: 0,
        accountability: 0,
        overall: 0,
      };
    }

    const latest = this.assessmentHistory[this.assessmentHistory.length - 1];
    return {
      empathy: latest.empathy.score,
      clarity: latest.clarity.score,
      accountability: latest.accountability.score,
      overall: latest.overall,
    };
  }

  /**
   * Get assessment history
   */
  getAssessmentHistory(): AssessmentResult[] {
    return [...this.assessmentHistory];
  }

  /**
   * Calculate empathy score based on patterns and anti-patterns
   */
  private calculateEmpathyScore(analysis: {
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  }): number {
    let score = 0.5; // Start at neutral

    // Positive patterns increase score
    for (const pattern of analysis.patterns) {
      score += pattern.confidence * 0.15; // Each pattern adds up to 15%
    }

    // Anti-patterns decrease score
    for (const antiPattern of analysis.antiPatterns) {
      score -= antiPattern.confidence * 0.2; // Each anti-pattern subtracts up to 20%
    }

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate clarity score based on patterns and anti-patterns
   */
  private calculateClarityScore(analysis: {
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  }): number {
    let score = 0.5; // Start at neutral

    // Positive patterns increase score
    for (const pattern of analysis.patterns) {
      score += pattern.confidence * 0.15;
    }

    // Anti-patterns decrease score
    for (const antiPattern of analysis.antiPatterns) {
      score -= antiPattern.confidence * 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate accountability score based on patterns and anti-patterns
   */
  private calculateAccountabilityScore(analysis: {
    patterns: PatternMatch[];
    antiPatterns: PatternMatch[];
  }): number {
    let score = 0.5; // Start at neutral

    // Positive patterns increase score
    for (const pattern of analysis.patterns) {
      score += pattern.confidence * 0.15;
    }

    // Anti-patterns decrease score
    for (const antiPattern of analysis.antiPatterns) {
      score -= antiPattern.confidence * 0.25; // Anti-patterns more heavily penalize accountability
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(scores: {
    empathy: number;
    clarity: number;
    accountability: number;
  }): number {
    const weights = this.config.weights;
    const totalWeight = weights.empathy + weights.clarity + weights.accountability;

    if (totalWeight === 0) {
      // Fallback to equal weights
      return (scores.empathy + scores.clarity + scores.accountability) / 3;
    }

    return (
      scores.empathy * (weights.empathy / totalWeight) +
      scores.clarity * (weights.clarity / totalWeight) +
      scores.accountability * (weights.accountability / totalWeight)
    );
  }

  /**
   * Check if passing threshold is met
   */
  isPassing(): boolean {
    const scores = this.getCurrentScores();
    return scores.overall >= this.config.passingScore;
  }

  /**
   * Check if excellence threshold is met
   */
  isExcellent(): boolean {
    const scores = this.getCurrentScores();
    return scores.overall >= this.config.excellenceScore;
  }

  /**
   * Get performance level based on scores
   */
  getPerformanceLevel(): 'needs_improvement' | 'developing' | 'proficient' | 'exemplary' {
    const scores = this.getCurrentScores();
    
    if (scores.overall >= this.config.excellenceScore) {
      return 'exemplary';
    } else if (scores.overall >= this.config.passingScore) {
      return 'proficient';
    } else if (scores.overall >= this.config.passingScore * 0.7) {
      return 'developing';
    } else {
      return 'needs_improvement';
    }
  }

  /**
   * Reset assessment engine (clear history)
   */
  reset(): void {
    this.conversationHistory = [];
    this.assessmentHistory = [];
  }

  /**
   * Update conversation history
   */
  updateConversationHistory(messages: Message[]): void {
    this.conversationHistory = [...messages];
  }
}


