import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Teste de carga básico do fluxo público (login e páginas estáticas) do
 * ambiente de homologação. Rode manualmente com:
 *
 *   BASE_URL=https://hmg.creditix.metadax.com.br k6 run loadtest/dividas-flow.js
 *
 * Como as rotas autenticadas exigem sessão real, este script cobre
 * primariamente a resiliência do login e do carregamento inicial — para
 * validar as rotas autenticadas, gere um token de teste dedicado e
 * complemente com cookies/headers de sessão antes de rodar contra hmg.
 */
export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function loadTest() {
  const loginPage = http.get(`${BASE_URL}/login`);
  check(loginPage, { "login retorna 200": (r) => r.status === 200 });
  sleep(1);
}
