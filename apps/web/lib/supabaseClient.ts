import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const PLAYER_SOFASCORE_ID = Number(
  process.env.NEXT_PUBLIC_PLAYER_SOFASCORE_ID ?? "977679",
);
