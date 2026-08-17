#!/usr/bin/env node
/**
 * Gera JWT_SECRET, ANON_KEY e SERVICE_ROLE_KEY para o stack Supabase
 * self-hosted (docker/). Não depende de nenhuma lib externa.
 *
 * Uso:
 *   node scripts/generate-jwt-keys.mjs
 *
 * Copie a saída para docker/.env (nunca faça commit desse arquivo).
 */
import { createHmac, randomBytes } from "node:crypto";

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const jwtSecret = randomBytes(32).toString("hex");
const issuedAt = Math.floor(Date.now() / 1000);
const tenYears = 10 * 365 * 24 * 60 * 60;

const anonKey = signJwt({ role: "anon", iss: "creditix-self-hosted", iat: issuedAt, exp: issuedAt + tenYears }, jwtSecret);
const serviceRoleKey = signJwt(
  { role: "service_role", iss: "creditix-self-hosted", iat: issuedAt, exp: issuedAt + tenYears },
  jwtSecret,
);

console.log("# Cole estas linhas em docker/.env (e nunca as compartilhe publicamente)\n");
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ANON_KEY=${anonKey}`);
console.log(`SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log(`POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`);
console.log(`CRON_SECRET=${randomBytes(32).toString("hex")}`);
