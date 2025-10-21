import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
async function testConnection() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Connection failed:', error);
  } else {
    console.log('✓ Supabase connected successfully');
  }
}

testConnection();