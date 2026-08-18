"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(["signup", "recovery", "magiclink", "email_change"]),
  // Só caminhos internos (começando com "/", nunca "//" — isso seria
  // interpretado pelo navegador como protocol-relative pra outro host).
  // Evita que um "next" adulterado na query string vire um redirect aberto.
  next: z
    .string()
    .regex(/^\/(?!\/)/)
    .catch("/dashboard"),
});

/**
 * Só é chamada por um submit de formulário real (POST), nunca por um GET
 * de página — é essa exigência de clique explícito que evita que um
 * scanner automático de e-mail consuma o token de uso único antes do
 * usuário (ver comentário em lib/supabase/auth-links.ts).
 */
export async function confirmarLinkAuthAction(formData: FormData) {
  const parsed = schema.safeParse({
    token_hash: formData.get("token_hash"),
    type: formData.get("type"),
    next: formData.get("next"),
  });
  if (!parsed.success) redirect("/auth/confirmar/erro");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type,
  });
  if (error) redirect("/auth/confirmar/erro");

  redirect(parsed.data.next);
}
