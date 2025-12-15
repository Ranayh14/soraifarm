
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real Next.js/Vite app, use process.env.NEXT_PUBLIC_SUPABASE_URL
// For this environment, we are initializing loosely to prevent crash if keys are missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
