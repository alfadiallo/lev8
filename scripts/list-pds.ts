import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function listPDs() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('email, full_name, role')
    .eq('role', 'program_director');

  if (error) console.error(error);
  else console.table(data);
}

listPDs();
