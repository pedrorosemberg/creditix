"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/security/validation";
import { gerarLinksTrocaEmail } from "@/lib/supabase/auth-links";
import { checarLimite } from "@/lib/security/rate-limit";
import { getResendClient, REMETENTE_PADRAO } from "@/lib/email/resend";
import { emailConfirmarEmailAtual, emailConfirmarEmailNovo } from "@/lib/email/auth-emails";
import { registrarLog } from "@/lib/activity-log";

export type PerfilState = { error?: string; success?: string } | undefined;

const AVATAR_TIPOS_ACEITOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const AVATAR_TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3MB

const CAMINHOS_PARA_REVALIDAR = [
  "/dashboard",
  "/dividas",
  "/transacoes",
  "/orcamento",
  "/recuperacao",
  "/lembretes",
  "/configuracoes",
];

async function enviarEmail(destinatario: string, conteudo: { subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("RESEND_API_KEY não configurada — não é possível enviar e-mails de autenticação.");
  }
  await resend.emails.send({ from: REMETENTE_PADRAO, to: destinatario, ...conteudo });
}

export async function atualizarPerfilAction(formData: FormData) {
  const dados = profileSchema.parse({
    display_name: formData.get("display_name") || undefined,
    renda_mensal: formData.get("renda_mensal") || undefined,
    lembrete_email: formData.get("lembrete_email") === "on",
    lembrete_dia_mes: formData.get("lembrete_dia_mes") || 5,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: dados.display_name ?? null,
      renda_mensal: dados.renda_mensal ?? null,
      lembrete_email: dados.lembrete_email,
      lembrete_dia_mes: dados.lembrete_dia_mes,
    })
    .eq("id", user.id);
  if (error) throw new Error("Não foi possível salvar o perfil.");

  await registrarLog(supabase, user.id, { tipo: "conta", titulo: "Perfil atualizado" });

  revalidatePath("/configuracoes");
  revalidatePath("/lembretes");
}

export async function atualizarAvatarAction(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const arquivo = formData.get("avatar");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Selecione uma imagem." };
  }
  const extensao = AVATAR_TIPOS_ACEITOS[arquivo.type];
  if (!extensao) {
    return { error: "Formato inválido. Envie uma imagem PNG, JPG ou WEBP." };
  }
  if (arquivo.size > AVATAR_TAMANHO_MAXIMO) {
    return { error: "A imagem deve ter no máximo 3MB." };
  }

  const caminho = `${user.id}/avatar.${extensao}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
  if (uploadError) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao enviar foto de perfil",
      descricao: uploadError.message,
    });
    return { error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: caminho })
    .eq("id", user.id);
  if (updateError) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao salvar foto de perfil no cadastro",
      descricao: updateError.message,
    });
    return { error: "Imagem enviada, mas não foi possível salvar no perfil." };
  }

  await registrarLog(supabase, user.id, { tipo: "conta", titulo: "Foto de perfil atualizada" });

  for (const caminhoRevalidar of CAMINHOS_PARA_REVALIDAR) revalidatePath(caminhoRevalidar);
  return { success: "Foto de perfil atualizada." };
}

const emailSchema = z.string().trim().email("E-mail inválido");

export async function atualizarEmailAction(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessão expirada. Entre novamente." };

  const limite = checarLimite(`troca-email:${user.id}`, 3, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = emailSchema.safeParse(formData.get("novo_email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }
  if (parsed.data.toLowerCase() === user.email.toLowerCase()) {
    return { error: "Esse já é o seu e-mail atual." };
  }

  try {
    const { linkParaEmailAtual, linkParaEmailNovo } = await gerarLinksTrocaEmail({
      emailAtual: user.email,
      emailNovo: parsed.data,
    });
    await Promise.all([
      enviarEmail(user.email, emailConfirmarEmailAtual(linkParaEmailAtual, parsed.data)),
      enviarEmail(parsed.data, emailConfirmarEmailNovo(linkParaEmailNovo)),
    ]);
  } catch (err) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao iniciar troca de e-mail",
      descricao: err instanceof Error ? err.message : String(err),
    });
    return { error: "Não foi possível iniciar a troca de e-mail. Tente novamente." };
  }

  await registrarLog(supabase, user.id, {
    tipo: "conta",
    titulo: "Troca de e-mail solicitada",
    descricao: `Novo e-mail: ${parsed.data}`,
  });

  return {
    success:
      "Enviamos um e-mail de confirmação para o endereço atual e para o novo. A troca só é concluída depois que os dois forem confirmados.",
  };
}

const senhaSchema = z.object({
  senha_atual: z.string().min(1, "Informe sua senha atual"),
  senha_nova: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});

export async function atualizarSenhaAction(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessão expirada. Entre novamente." };

  const limite = checarLimite(`troca-senha:${user.id}`, 5, 15 * 60 * 1000);
  if (!limite.allowed) {
    return { error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const parsed = senhaSchema.safeParse({
    senha_atual: formData.get("senha_atual"),
    senha_nova: formData.get("senha_nova"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.senha_atual,
  });
  if (reauthError) {
    return { error: "Senha atual incorreta." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha_nova });
  if (error) {
    await registrarLog(supabase, user.id, {
      tipo: "erro",
      titulo: "Falha ao atualizar senha",
      descricao: error.message,
    });
    return { error: "Não foi possível atualizar a senha. Tente novamente." };
  }

  await registrarLog(supabase, user.id, { tipo: "conta", titulo: "Senha atualizada" });
  return { success: "Senha atualizada com sucesso." };
}
