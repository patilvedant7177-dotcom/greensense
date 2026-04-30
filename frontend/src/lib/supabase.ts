import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  console.error(`CRITICAL: Missing environment variables: ${missing.join(', ')}`);
  throw new Error(
    `Missing required configuration: ${missing.join(', ')}. Please ensure these are set in your deployment environment (e.g., Vercel Dashboard).`,
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
