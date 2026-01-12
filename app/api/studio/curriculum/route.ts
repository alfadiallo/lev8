import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Server component - cookies are read-only
          },
        },
      }
    );

    // Get the active EM curriculum
    const { data: curriculum, error: curriculumError } = await supabase
      .from('specialty_curricula')
      .select('*')
      .eq('specialty', 'emergency_medicine')
      .eq('is_active', true)
      .single();

    if (curriculumError) {
      console.error('[API/studio/curriculum] Error fetching curriculum:', curriculumError);
      return NextResponse.json({ error: 'Failed to fetch curriculum' }, { status: 500 });
    }

    if (!curriculum) {
      return NextResponse.json({ error: 'No active curriculum found' }, { status: 404 });
    }

    // Get all topics for this curriculum
    const { data: topics, error: topicsError } = await supabase
      .from('curriculum_topics')
      .select('*')
      .eq('curriculum_id', curriculum.id)
      .order('month', { ascending: true })
      .order('week', { ascending: true });

    if (topicsError) {
      console.error('[API/studio/curriculum] Error fetching topics:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch curriculum topics' }, { status: 500 });
    }

    // Group topics by month
    const topicsByMonth: Record<number, typeof topics> = {};
    for (const topic of topics || []) {
      if (!topicsByMonth[topic.month]) {
        topicsByMonth[topic.month] = [];
      }
      topicsByMonth[topic.month].push(topic);
    }

    return NextResponse.json({
      curriculum,
      topics: topics || [],
      topicsByMonth,
    });
  } catch (error) {
    console.error('[API/studio/curriculum] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
