"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { gerarLinkAuth } from "@/lib/supabase/auth-links";
import { registrarIndicacaoPendente } from "@/lib/supabase/referrals";
import { checarLimite } from "@/lib/security/rate-limit";
import { getResendClient, REMETENTE_PADRAO } from "@/lib/email/resend";
import { emailConfirmacaoCadastro, emailLinkMagico, emailRedefinicaoSenha } from "@/lib/email/auth-emails";

const emailSchema = z.string().trim().email("E-mail inválido");
const credenciaisSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export type AuthState = { error?: string; success?: string } | undefined;

async function ipDoRequisitante() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
}

async function enviarEmail(destinatario: string, conteudo: { subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY não configurada — não é possível enviar e-mails de autenticação.");
  }
  await resend.emails.send({ from: REMETENTE_PADRAO, to: destinatario, ...conteudo });
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = await checarLimite(`login:${ip}`, 10, 5 * 60 * 1000);
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

  const captchaToken = (formData.get("captchaToken") as string) || undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: captchaToken ? { captchaToken } : undefined,
  });
  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/dashboard");
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = await checarLimite(`signup:${ip}`, 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas de cadastro. Tente novamente mais tarde." };
  }

  const parsed = credenciaisSchema
    .extend({
      displayName: z.string().trim().min(1).max(120).optional(),
      ref: z.string().trim().max(20).optional(),
    })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName") || undefined,
      ref: formData.get("ref") || undefined,
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    const { link, userId } = await gerarLinkAuth({
      type: "signup",
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.displayName,
      redirectPath: "/dashboard",
    });
    if (parsed.data.ref) {
      await registrarIndicacaoPendente({ codigoIndicacao: parsed.data.ref, novoUsuarioId: userId });
    }
    await enviarEmail(parsed.data.email, emailConfirmacaoCadastro(link));
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "";
    // AuthApiError do Supabase traz um "code" estável (ex.: "weak_password")
    // além da "message" em inglês — checar o code primeiro evita depender
    // do texto exato da mensagem, que pode mudar entre versões.
    const codigo = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    console.error("[signupAction] Falha ao concluir cadastro:", err);
    if (mensagem.toLowerCase().includes("already been registered") || mensagem.toLowerCase().includes("already registered")) {
      return { error: "Este e-mail já tem uma conta. Tente entrar." };
    }
    if (mensagem.toLowerCase().includes("rate limit") || mensagem.toLowerCase().includes("too many requests")) {
      return { error: "Muitos cadastros em pouco tempo. Aguarde alguns minutos e tente de novo." };
    }
    if (codigo === "weak_password" || mensagem.toLowerCase().includes("weak")) {
      return {
        error:
          "Senha muito fraca ou comum demais. Use pelo menos 8 caracteres, misturando letras, números e símbolos — evite senhas óbvias (como \"12345678\" ou sequências repetidas).",
      };
    }
    return { error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  return {
    success: "Cadastro realizado. Verifique sua caixa de entrada para confirmar o e-mail e ativar a conta.",
  };
}

export async function solicitarLinkMagicoAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = await checarLimite(`magiclink:${ip}`, 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  try {
    const { link } = await gerarLinkAuth({ type: "magiclink", email: parsed.data, redirectPath: "/dashboard" });
    await enviarEmail(parsed.data, emailLinkMagico(link));
  } catch {
    // Não revela se o e-mail existe ou não — mesma mensagem em qualquer caso.
  }

  return { success: "Se esse e-mail tiver uma conta no Creditix, enviamos um link de acesso para ele." };
}

export async function solicitarRecuperacaoSenhaAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const ip = await ipDoRequisitante();
  const limite = await checarLimite(`recuperar-senha:${ip}`, 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  try {
    const { link } = await gerarLinkAuth({ type: "recovery", email: parsed.data, redirectPath: "/redefinir-senha" });
    await enviarEmail(parsed.data, emailRedefinicaoSenha(link));
  } catch {
    // Idem: mesma mensagem de sucesso independentemente de o e-mail existir.
  }

  return { success: "Se esse e-mail tiver uma conta no Creditix, enviamos um link para redefinir a senha." };
}

export async function redefinirSenhaAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres") })
    .safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Senha inválida" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Link expirado ou inválido. Solicite um novo link de redefinição." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password" || error.message.toLowerCase().includes("weak")) {
      return {
        error:
          "Senha muito fraca ou comum demais. Use pelo menos 8 caracteres, misturando letras, números e símbolos — evite senhas óbvias (como \"12345678\" ou sequências repetidas).",
      };
    }
    return { error: "Não foi possível atualizar a senha. Tente novamente." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
