import { createClient } from '@supabase/supabase-js';

// Retrieve values from Vite environment variables (VITE_ prefixed)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. ' +
    'Please configure them in your frontend .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
