import type { NextConfig } from "next";

// Origem do Supabase (cloud ou self-hosted) precisa estar liberada no
// img-src — é de lá que vêm as signed URLs das fotos de perfil
// (Storage). Sem isso o navegador bloqueia a imagem silenciosamente por
// CSP: a Server Action retorna sucesso normalmente, mas a foto nunca
// aparece (nenhum erro visível, só o <img> quebrado).
function origemSupabase(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: https://cdn.metadax.com.br${origemSupabase() ? ` ${origemSupabase()}` : ""}`,
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Build enxuto (standalone) só para a imagem Docker — na Vercel isso
  // quebra o build (ela espera o formato de trace normal do Next, não o
  // output standalone). docker/Dockerfile define DOCKER_BUILD=1 antes de
  // rodar "npm run build"; a Vercel nunca define essa variável.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  // @huggingface/transformers (modelo de IA local embutido) traz binários
  // nativos (onnxruntime-node) que não podem ser processados pelo
  // bundler — precisam ser carregados como módulo Node normal em runtime.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "sharp"],
  // Os pesos do modelo local (baixados no build por
  // scripts/baixar-modelo-ia.mjs, em ./models-cache) são lidos em runtime
  // via caminho de arquivo dinâmico — o file tracer do Next não detecta
  // isso sozinho, então precisam ser incluídos manualmente nas rotas que
  // usam IA para irem junto do bundle da função serverless na Vercel.
  //
  // O binário nativo do onnxruntime-node (libonnxruntime.so.1) também
  // precisa ser incluído manualmente: ele é carregado via dlopen em
  // runtime (não um require/import JS), então o tracer do Next nunca o
  // detecta sozinho — sem isso a função falha com "libonnxruntime.so.1:
  // cannot open shared object file" (confirmado nos logs de runtime da
  // Vercel). Só o binário linux/x64 é incluído — é o único que a Vercel
  // executa; os outros (darwin/win32) não são necessários no deploy.
  outputFileTracingIncludes: {
    "/chat": ["./models-cache/**/*", "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*"],
    "/dividas/[id]": ["./models-cache/**/*", "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*"],
  },
  // Padrão do Next é 1MB para o corpo de uma Server Action — menor que o
  // limite de 3MB da foto de perfil (configuracoes/actions.ts), então todo
  // upload de foto um pouco maior falhava com 413 "Body exceeded 1 MB
  // limit" antes mesmo de chegar no código da action (confirmado nos logs
  // de runtime da Vercel).
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
