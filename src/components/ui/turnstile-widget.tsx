"use client";

import { useEffect, useId, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    __onTurnstileVerified?: (widgetId: string, token: string) => void;
  }
}

/**
 * Widget do Cloudflare Turnstile (CAPTCHA). Só renderiza algo se
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY estiver configurada — sem a variável,
 * este componente não retorna nada e o formulário continua funcionando
 * exatamente como antes (nenhuma quebra pra quem não configurar).
 *
 * Preencher isso não basta por si só: a validação de verdade acontece no
 * Supabase Auth (Authentication -> Attack Protection), que precisa estar
 * habilitada com a chave secreta correspondente — ver docs/AUTENTICACAO.md.
 */
export function TurnstileWidget({ fieldName = "captchaToken" }: { fieldName?: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState("");
  const widgetId = useId();

  useEffect(() => {
    if (!siteKey) return;
    window.__onTurnstileVerified = (_id, tok) => setToken(tok);
    return () => {
      delete window.__onTurnstileVerified;
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-callback="__onTurnstileVerified"
        data-widget-id={widgetId}
      />
      <input type="hidden" name={fieldName} value={token} />
    </div>
  );
}
