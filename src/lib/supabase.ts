import { createClient } from "@supabase/supabase-js";

// Vite loads environment variables prefixed with VITE_ from .env files.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // This error will be thrown at runtime if the variables are missing.
  throw new Error(
    "Supabase URL/key not defined. Check your .env file and restart the server."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
