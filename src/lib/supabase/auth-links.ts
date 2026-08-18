import "server-only";
import { createAdminClient } from "./admin";

/**
 * URL pública da aplicação, usada em todo link de autenticação enviado
 * por e-mail. "||" (não "??") é proposital: em alguns ambientes a
 * variável chega como string vazia, não undefined/null, e "??" não cai
 * no fallback nesse caso — já nos mordeu uma vez no build da Vercel.
 */
export function urlPublicaApp(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://creditix.metadax.com.br";
}

type TipoLink = "signup" | "recovery" | "magiclink";

/**
 * Gera um link de autenticação assinado pelo Supabase Auth (via service
 * role — nunca pelo mailer embutido, que não é usado por este projeto).
 * O redirect_to precisa estar na allow-list de "Redirect URLs" do projeto
 * Supabase (Authentication -> URL Configuration) para o link funcionar
 * quando clicado — isso é configurado no painel, não por código.
 */
export async function gerarLinkAuth(params: {
  type: TipoLink;
  email: string;
  password?: string;
  redirectPath: string;
  displayName?: string;
}): Promise<string> {
  const admin = createAdminClient();
  const redirectTo = `${urlPublicaApp()}/auth/callback?next=${encodeURIComponent(params.redirectPath)}`;
  const options = {
    redirectTo,
    data: params.displayName ? { display_name: params.displayName } : undefined,
  };

  const resultado =
    params.type === "signup"
      ? await admin.auth.admin.generateLink({
          type: "signup",
          email: params.email,
          password: params.password!,
          options,
        })
      : await admin.auth.admin.generateLink({ type: params.type, email: params.email, options });

  if (resultado.error || !resultado.data?.properties?.action_link) {
    throw resultado.error ?? new Error("Não foi possível gerar o link de autenticação.");
  }

  return resultado.data.properties.action_link;
}

/**
 * Gera os dois links de confirmação de troca de e-mail (Supabase exige
 * confirmação tanto do e-mail atual quanto do novo — "secure email
 * change"). Cada link deve ser enviado ao endereço correspondente; a troca
 * só é efetivada depois que ambos forem clicados.
 */
export async function gerarLinksTrocaEmail(params: {
  emailAtual: string;
  emailNovo: string;
}): Promise<{ linkParaEmailAtual: string; linkParaEmailNovo: string }> {
  const admin = createAdminClient();
  const redirectTo = `${urlPublicaApp()}/auth/callback?next=${encodeURIComponent("/perfil")}`;
  const options = { redirectTo };

  const [atual, novo] = await Promise.all([
    admin.auth.admin.generateLink({
      type: "email_change_current",
      email: params.emailAtual,
      newEmail: params.emailNovo,
      options,
    }),
    admin.auth.admin.generateLink({
      type: "email_change_new",
      email: params.emailAtual,
      newEmail: params.emailNovo,
      options,
    }),
  ]);

  if (atual.error || !atual.data?.properties?.action_link) {
    throw atual.error ?? new Error("Não foi possível gerar o link de confirmação do e-mail atual.");
  }
  if (novo.error || !novo.data?.properties?.action_link) {
    throw novo.error ?? new Error("Não foi possível gerar o link de confirmação do novo e-mail.");
  }

  return {
    linkParaEmailAtual: atual.data.properties.action_link,
    linkParaEmailNovo: novo.data.properties.action_link,
  };
}
