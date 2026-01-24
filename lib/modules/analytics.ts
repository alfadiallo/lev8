// Analytics tracking utilities for all modules

import { supabase } from '@/lib/supabase';

export interface SessionAnalytics {
  sessionId: string;
  empathyScore?: number;
  clarityScore?: number;
  deEscalationScore?: number;
  totalMessages: number;
  userMessages: number;
  avatarMessages: number;
  escalationTriggersHit: string[];
  keywordsMatched: Record<string, any>;
  personalityAlignmentScore?: number;
  emotionalTone?: string;
  moduleSpecificMetrics?: Record<string, unknown>;
}

export class AnalyticsService {
  /**
   * Save session analytics
   */
  static async saveSessionAnalytics(sessionId: string, analytics: SessionAnalytics): Promise<void> {
    try {
      const { error } = await supabase
        .from('session_analytics')
        .insert({
          session_id: sessionId,
          empathy_score: analytics.empathyScore,
          clarity_score: analytics.clarityScore,
          de_escalation_score: analytics.deEscalationScore,
          total_messages: analytics.totalMessages,
          user_messages: analytics.userMessages,
          avatar_messages: analytics.avatarMessages,
          escalation_triggers_hit: analytics.escalationTriggersHit,
          keywords_matched: analytics.keywordsMatched,
          personality_alignment_score: analytics.personalityAlignmentScore,
          emotional_tone: analytics.emotionalTone,
          module_specific_metrics: analytics.moduleSpecificMetrics,
        });

      if (error) throw error;
    } catch (error) {
      console.error('[Analytics] Error saving session analytics:', error);
      throw error;
    }
  }

  /**
   * Get session analytics
   */
  static async getSessionAnalytics(sessionId: string): Promise<SessionAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('session_analytics')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        sessionId: data.session_id,
        empathyScore: data.empathy_score,
        clarityScore: data.clarity_score,
        deEscalationScore: data.de_escalation_score,
        totalMessages: data.total_messages || 0,
        userMessages: data.user_messages || 0,
        avatarMessages: data.avatar_messages || 0,
        escalationTriggersHit: data.escalation_triggers_hit || [],
        keywordsMatched: data.keywords_matched || {},
        personalityAlignmentScore: data.personality_alignment_score,
        emotionalTone: data.emotional_tone,
        moduleSpecificMetrics: data.module_specific_metrics || {},
      };
    } catch (error) {
      console.error('[Analytics] Error fetching session analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate basic metrics from messages
   */
  static calculateMetrics(messages: Array<{ sender: string; text: string }>): {
    totalMessages: number;
    userMessages: number;
    avatarMessages: number;
  } {
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.sender === 'user').length;
    const avatarMessages = messages.filter(m => m.sender === 'avatar').length;

    return {
      totalMessages,
      userMessages,
      avatarMessages,
    };
  }

  /**
   * Calculate empathy score using v2 AssessmentEngine
   * Note: For v2 conversations, use AssessmentEngine.assessConversation() instead
   */
  static calculateEmpathyScore(_messages: Array<{ text: string }>): number {
    // Legacy v1 method - placeholder
    // For v2 conversations, use AssessmentEngine directly
    return 0;
  }

  /**
   * Calculate clarity score using v2 AssessmentEngine
   * Note: For v2 conversations, use AssessmentEngine.assessConversation() instead
   */
  static calculateClarityScore(messages: Array<{ text: string }>): number {
    // Legacy v1 method - placeholder
    // For v2 conversations, use AssessmentEngine directly
    return 0;
  }

  /**
   * Calculate de-escalation score using v2 AssessmentEngine
   * Note: For v2 conversations, use AssessmentEngine.assessConversation() instead
   */
  static calculateDeEscalationScore(_messages: Array<{ text: string }>): number {
    // Legacy v1 method - placeholder
    // For v2 conversations, use AssessmentEngine directly
    // Note: De-escalation can be inferred from emotional state trajectory
    return 0;
  }
}

