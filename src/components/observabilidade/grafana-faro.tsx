"use client";

import { useEffect } from "react";

/**
 * Observabilidade de produto (Grafana Cloud Frontend Observability —
 * gratuito no plano free) para o time interno da METADAX acompanhar
 * erros, performance e uso agregado — nunca dados financeiros ou
 * identificáveis de usuários. Só inicializa se
 * NEXT_PUBLIC_GRAFANA_FARO_URL estiver configurada; sem ela, este
 * componente não faz nada (mesmo padrão defensivo do Turnstile/Upstash).
 *
 * Deliberadamente NÃO habilitamos session replay nem enviamos e-mail/nome
 * do usuário como atributo — só o necessário pra ver erros e performance
 * agregados. Ver docs/OBSERVABILIDADE.md.
 */
export function GrafanaFaro() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_GRAFANA_FARO_URL;
    if (!url) return;

    let descartada = false;
    import("@grafana/faro-web-sdk").then(({ initializeFaro, getWebInstrumentations }) => {
      if (descartada) return;
      initializeFaro({
        url,
        app: {
          name: "creditix",
          environment: process.env.NEXT_PUBLIC_APP_ENV || "production",
        },
        instrumentations: getWebInstrumentations({
          captureConsole: false,
        }),
      });
    });

    return () => {
      descartada = true;
    };
  }, []);

  return null;
}
