import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto assets estáticos e as rotas que usam
     * autenticação própria (cron por secret, webhooks por assinatura),
     * nunca sessão de usuário.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/cron|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
