// Unified session storage service for all modules

import { supabase } from '@/lib/supabase';
import { TrainingSession, Message, SessionMetrics, ModuleType, Difficulty } from '@/lib/types/modules';

export interface SessionData {
  vignetteId?: string;
  vignetteTitle: string;
  moduleType: ModuleType;
  difficulty: Difficulty;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  metrics: SessionMetrics;
  sessionData?: Record<string, unknown>;
  completed: boolean;
  aiProvider?: string;
  sessionDurationSeconds?: number;
}

export class SessionStorageService {
  /**
   * Create a new training session
   */
  static async createSession(sessionData: SessionData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_sessions')
        .insert({
          user_id: user.id,
          vignette_id: sessionData.vignetteId,
          vignette_title: sessionData.vignetteTitle,
          module_type: sessionData.moduleType,
          difficulty: sessionData.difficulty,
          start_time: sessionData.startTime.toISOString(),
          end_time: sessionData.endTime?.toISOString(),
          messages: sessionData.messages.map(msg => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString(),
          })),
          metrics: sessionData.metrics,
          session_data: sessionData.sessionData || {},
          completed: sessionData.completed,
          ai_provider: sessionData.aiProvider,
          session_duration_seconds: sessionData.sessionDurationSeconds,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('[SessionStorage] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Update an existing training session
   */
  static async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
      if (updates.messages) {
        updateData.messages = updates.messages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : msg.timestamp.toISOString(),
        }));
      }
      if (updates.metrics) updateData.metrics = updates.metrics;
      if (updates.sessionData) updateData.session_data = updates.sessionData;
      if (updates.completed !== undefined) updateData.completed = updates.completed;
      if (updates.aiProvider) updateData.ai_provider = updates.aiProvider;
      if (updates.sessionDurationSeconds) updateData.session_duration_seconds = updates.sessionDurationSeconds;

      const { error } = await supabase
        .from('training_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('[SessionStorage] Error updating session:', error);
      throw error;
    }
  }

  /**
   * Get user's sessions
   */
  static async getUserSessions(userId?: string): Promise<TrainingSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id;
      
      if (!currentUserId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('start_time', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        user_id: row.user_id,
        vignette_id: row.vignette_id,
        vignette_title: row.vignette_title,
        module_type: row.module_type,
        difficulty: row.difficulty,
        start_time: row.start_time,
        end_time: row.end_time,
        messages: row.messages || [],
        metrics: row.metrics || {},
        session_data: row.session_data || {},
        completed: row.completed,
        ai_provider: row.ai_provider,
        session_duration_seconds: row.session_duration_seconds,
        viewable_by_roles: row.viewable_by_roles || [],
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } catch (error) {
      console.error('[SessionStorage] Error fetching user sessions:', error);
      throw error;
    }
  }

  /**
   * Get a single session by ID
   */
  static async getSession(sessionId: string): Promise<TrainingSession | null> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        vignette_id: data.vignette_id,
        vignette_title: data.vignette_title,
        module_type: data.module_type,
        difficulty: data.difficulty,
        start_time: data.start_time,
        end_time: data.end_time,
        messages: data.messages || [],
        metrics: data.metrics || {},
        session_data: data.session_data || {},
        completed: data.completed,
        ai_provider: data.ai_provider,
        session_duration_seconds: data.session_duration_seconds,
        viewable_by_roles: data.viewable_by_roles || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('[SessionStorage] Error fetching session:', error);
      throw error;
    }
  }
}


