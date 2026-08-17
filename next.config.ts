import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://cdn.metadax.com.br",
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
