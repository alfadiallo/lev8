import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET() {
  const checks = {
    environment: {} as any,
    supabase: {} as any,
    database: {} as any,
    storage: {} as any,
  };

  try {
    // Check environment variables
    checks.environment.supabaseUrl = supabaseUrl ? '✅ Set' : '❌ Missing';
    checks.environment.supabaseKey = supabaseKey ? '✅ Set' : '❌ Missing';
    checks.environment.openaiKey = process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing';
    checks.environment.anthropicKey = process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials', checks }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check Supabase connection
    try {
      const { data, error } = await supabase.from('health_systems').select('count').limit(1);
      checks.supabase.connection = error ? `❌ ${error.message}` : '✅ Connected';
    } catch (error) {
      checks.supabase.connection = `❌ ${error}`;
    }

    // Check if tables exist
    const tables = ['health_systems', 'programs', 'residents', 'user_profiles', 'grow_voice_journal'];
    checks.database.tables = {};

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        checks.database.tables[table] = error ? `❌ ${error.message}` : '✅ Exists';
      } catch (error) {
        checks.database.tables[table] = `❌ ${error}`;
      }
    }

    // Check storage buckets
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        checks.storage.buckets = `❌ ${error.message}`;
      } else {
        checks.storage.buckets = buckets?.map(b => b.name) || [];
        const voiceJournalExists = buckets?.some(b => b.name === 'voice_journal');
        checks.storage.voiceJournalBucket = voiceJournalExists ? '✅ Exists' : '❌ Missing - Run setup script';
      }
    } catch (error) {
      checks.storage.buckets = `❌ ${error}`;
    }

    // Check if there are any users
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      checks.database.users = error ? `❌ ${error.message}` : `✅ ${users?.length || 0} users`;
    } catch (error) {
      checks.database.users = `❌ ${error}`;
    }

    // Check if there are any residents
    try {
      const { data, error } = await supabase.from('residents').select('count');
      checks.database.residents = error ? `❌ ${error.message}` : `✅ ${data?.length || 0} residents`;
    } catch (error) {
      checks.database.residents = `❌ ${error}`;
    }

    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      checks 
    }, { status: 500 });
  }
}

