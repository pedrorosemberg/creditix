"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checarLimite } from "@/lib/security/rate-limit";

const credenciaisSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export type AuthState = { error?: string; success?: string } | undefined;

async function ipDoRequisitante() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = checarLimite(`login:${ip}`, 10, 5 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas de login. Tente novamente em alguns minutos." };
  }

  const parsed = credenciaisSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/dashboard");
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = checarLimite(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." };
  }

  const parsed = credenciaisSchema
    .extend({ displayName: z.string().trim().min(1).max(120).optional() })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName") || undefined,
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) {
    return { error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  return {
    success:
      "Cadastro realizado. Se a confirmação por e-mail estiver ativada neste ambiente, verifique sua caixa de entrada para ativar a conta.",
  };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
