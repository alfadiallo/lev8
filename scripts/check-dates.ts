import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkDates() {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('id, session_name, session_date')
    .order('session_date');

  if (error) {
    console.error(error);
    return;
  }

  console.log('Current Session Dates:');
  console.table(data.map(s => {
    const date = new Date(s.session_date);
    return {
      id: s.id,
      name: s.session_name,
      date: s.session_date,
      day: date.toLocaleDateString('en-US', { weekday: 'long' })
    };
  }));
}

checkDates();