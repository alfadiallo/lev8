// Vignette data loading utilities

import { Vignette } from '@/lib/types/modules';
import { supabase } from '@/lib/supabase';

export async function getAllVignettes(): Promise<Vignette[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/vignettes', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load vignettes');
    }

    const result = await response.json();
    return result.vignettes || [];
  } catch (error) {
    console.error('[Vignettes] Error loading vignettes:', error);
    return [];
  }
}

export async function getVignetteById(id: string): Promise<Vignette | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/vignettes/${id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load vignette');
    }

    const result = await response.json();
    return result.vignette || null;
  } catch (error) {
    console.error('[Vignettes] Error loading vignette:', error);
    return null;
  }
}

export function getVignettesByCategory(vignettes: Vignette[], category: string): Vignette[] {
  return vignettes.filter(v => v.category === category);
}

export function getVignettesByDifficulty(
  vignettes: Vignette[],
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Vignette[] {
  return vignettes.filter(v => {
    const difficulties = Array.isArray(v.difficulty) ? v.difficulty : [v.difficulty];
    return difficulties.includes(difficulty);
  });
}


