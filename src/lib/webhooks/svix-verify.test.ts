import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verificarAssinaturaSvix } from "./svix-verify";

const secretBytes = Buffer.from("segredo-de-teste-32-bytes-aqui!!");
const secret = `whsec_${secretBytes.toString("base64")}`;

function assinar(id: string, timestamp: string, body: string) {
  const conteudo = `${id}.${timestamp}.${body}`;
  const sig = createHmac("sha256", secretBytes).update(conteudo).digest("base64");
  return `v1,${sig}`;
}

describe("verificarAssinaturaSvix", () => {
  it("aceita uma assinatura válida e recente", () => {
    const id = "msg_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
    const svixSignature = assinar(id, timestamp, body);

    expect(
      verificarAssinaturaSvix({ secret, svixId: id, svixTimestamp: timestamp, svixSignature, body }),
    ).toBe(true);
  });

  it("rejeita assinatura calculada com segredo errado", () => {
    const id = "msg_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = "{}";
    const assinaturaErrada = `v1,${createHmac("sha256", Buffer.from("outro-segredo")).update(`${id}.${timestamp}.${body}`).digest("base64")}`;

    expect(
      verificarAssinaturaSvix({
        secret,
        svixId: id,
        svixTimestamp: timestamp,
        svixSignature: assinaturaErrada,
        body,
      }),
    ).toBe(false);
  });

  it("rejeita timestamp fora da tolerância (replay)", () => {
    const id = "msg_123";
    const timestampAntigo = String(Math.floor(Date.now() / 1000) - 60 * 60);
    const body = "{}";
    const svixSignature = assinar(id, timestampAntigo, body);

    expect(
      verificarAssinaturaSvix({
        secret,
        svixId: id,
        svixTimestamp: timestampAntigo,
        svixSignature,
        body,
      }),
    ).toBe(false);
  });

  it("rejeita quando faltam headers", () => {
    expect(
      verificarAssinaturaSvix({ secret, svixId: null, svixTimestamp: "1", svixSignature: "v1,x", body: "{}" }),
    ).toBe(false);
  });

  it("aceita quando a assinatura correta está entre múltiplas (rotação de segredo)", () => {
    const id = "msg_123";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = "{}";
    const correta = assinar(id, timestamp, body);
    const svixSignature = `v1,invalida== ${correta}`;

    expect(
      verificarAssinaturaSvix({ secret, svixId: id, svixTimestamp: timestamp, svixSignature, body }),
    ).toBe(true);
  });
});
