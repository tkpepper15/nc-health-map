import { createClient } from '@supabase/supabase-js'

// These are server-side only — no NEXT_PUBLIC_ prefix so they are never
// bundled into the client JavaScript.
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)