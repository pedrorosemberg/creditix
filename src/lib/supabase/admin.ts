import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase com a service role key — ignora RLS. Uso restrito a
 * rotinas de sistema server-side (ex.: cron de lembretes) que precisam
 * operar entre usuários. NUNCA importe este módulo em código que roda no
 * navegador; o import "server-only" quebra o build se isso acontecer.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_URL não configurados.");
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
