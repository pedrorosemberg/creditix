"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

/**
 * Processa o retorno de qualquer link de autenticação por e-mail
 * (confirmação de cadastro, link mágico, redefinição de senha).
 *
 * Os links são gerados server-side via admin.generateLink() (ver
 * src/lib/supabase/auth-links.ts), que — diferente do fluxo PKCE iniciado
 * no navegador (ex.: signUp() com emailRedirectTo) — devolve a sessão no
 * fragmento da URL (#access_token=...&refresh_token=...) em vez de um
 * parâmetro "?code=". Por isso este processamento precisa ser client-side:
 * o fragmento nunca chega ao servidor.
 */
function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function processar() {
      const supabase = createClient();
      const next = searchParams.get("next") || "/dashboard";
      const code = searchParams.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (!access_token || !refresh_token) {
            throw new Error("Link incompleto.");
          }
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else {
          throw new Error("Link sem credenciais.");
        }

        if (!cancelado) router.replace(next);
      } catch {
        if (!cancelado) {
          setErro("Não foi possível confirmar o link. Ele pode ter expirado — solicite um novo.");
        }
      }
    }

    processar();
    return () => {
      cancelado = true;
    };
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <Card className="w-full max-w-sm text-center">
        <span className="font-display text-2xl text-brand-red">Creditix</span>
        {erro ? (
          <>
            <p className="mt-4 text-sm text-danger">{erro}</p>
            <a href="/login" className="mt-3 inline-block text-sm text-brand-red hover:underline">
              Voltar para o login
            </a>
          </>
        ) : (
          <p className="mt-4 text-sm text-foreground-muted">Confirmando...</p>
        )}
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
          <Card className="w-full max-w-sm text-center">
            <span className="font-display text-2xl text-brand-red">Creditix</span>
          </Card>
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
