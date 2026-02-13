import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Creates a Supabase admin client (service role) that bypasses RLS.
 * Use for server-side operations in Edge Functions.
 */
export function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Creates a Supabase client authenticated as the requesting user.
 * Use when operations should respect RLS policies.
 */
export function createUserClient(token: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
