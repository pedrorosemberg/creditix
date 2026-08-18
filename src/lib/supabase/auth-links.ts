import "server-only";
import { createAdminClient } from "./admin";
import { urlPublicaApp } from "@/lib/utils";

type TipoLink = "signup" | "recovery" | "magiclink";

function montarLinkConfirmacao(params: { tokenHash: string; type: string; next: string }): string {
  const url = new URL("/auth/confirmar", urlPublicaApp());
  url.searchParams.set("token_hash", params.tokenHash);
  url.searchParams.set("type", params.type);
  url.searchParams.set("next", params.next);
  return url.toString();
}

/**
 * Gera um link de autenticação que aponta para a NOSSA /auth/confirmar —
 * nunca para o endpoint hospedado pelo Supabase
 * (<projeto>.supabase.co/auth/v1/verify), que confirma o token com um
 * simples GET. Esse endpoint foi a causa raiz de um bug real: scanners de
 * segurança de e-mail (Microsoft Safe Links, Gmail, gateways corporativos)
 * "pré-visitam" automaticamente todo link de um e-mail antes do usuário —
 * o que consumia o token de uso único antes do clique de verdade (visto
 * nos logs: a conta ficava confirmada, mas o clique real do usuário
 * mostrava "link expirado"). Nossa /auth/confirmar exige um POST real
 * (submit de formulário) pra consumir o token — scanners automatizados só
 * fazem GET, então o token sobrevive até o clique humano.
 */
export async function gerarLinkAuth(params: {
  type: TipoLink;
  email: string;
  password?: string;
  redirectPath: string;
  displayName?: string;
}): Promise<{ link: string; userId: string }> {
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

  if (resultado.error || !resultado.data?.properties?.hashed_token || !resultado.data.user) {
    throw resultado.error ?? new Error("Não foi possível gerar o link de autenticação.");
  }

  return {
    link: montarLinkConfirmacao({
      tokenHash: resultado.data.properties.hashed_token,
      type: params.type,
      next: params.redirectPath,
    }),
    userId: resultado.data.user.id,
  };
}

/**
 * Gera os dois links de confirmação de troca de e-mail (Supabase exige
 * confirmação tanto do e-mail atual quanto do novo — "secure email
 * change"). Cada link deve ser enviado ao endereço correspondente; a troca
 * só é efetivada depois que ambos forem clicados. Mesmo raciocínio de
 * /auth/confirmar acima: o token_hash de cada link já identifica de qual
 * lado da troca se trata, então os dois usam type="email_change".
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

  if (atual.error || !atual.data?.properties?.hashed_token) {
    throw atual.error ?? new Error("Não foi possível gerar o link de confirmação do e-mail atual.");
  }
  if (novo.error || !novo.data?.properties?.hashed_token) {
    throw novo.error ?? new Error("Não foi possível gerar o link de confirmação do novo e-mail.");
  }

  return {
    linkParaEmailAtual: montarLinkConfirmacao({
      tokenHash: atual.data.properties.hashed_token,
      type: "email_change",
      next: "/perfil",
    }),
    linkParaEmailNovo: montarLinkConfirmacao({
      tokenHash: novo.data.properties.hashed_token,
      type: "email_change",
      next: "/perfil",
    }),
  };
}
