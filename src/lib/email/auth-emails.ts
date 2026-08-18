import "server-only";

/**
 * Templates dos e-mails de autenticação (confirmação de cadastro,
 * redefinição de senha, link mágico de login), no mesmo estilo visual do
 * lembrete mensal. Todos são enviados via Resend — nunca pelo mailer
 * embutido do Supabase Auth — para garantir remetente/domínio
 * consistentes e o link sempre apontando para a URL de produção.
 */

function baseTemplate(params: { titulo: string; corpo: string; textoBotao: string; link: string }): string {
  const { titulo, corpo, textoBotao, link } = params;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1e1e1e">
    <h1 style="color:#DC2626;font-size:20px;margin-bottom:16px">Creditix</h1>
    <h2 style="font-size:16px;margin-bottom:8px">${titulo}</h2>
    <p style="color:#3a3d42;line-height:1.5">${corpo}</p>
    <p style="margin-top:24px">
      <a href="${link}" style="background:#DC2626;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${textoBotao}</a>
    </p>
    <p style="margin-top:16px;font-size:12px;color:#5b5f66;word-break:break-all">
      Se o botão não funcionar, copie e cole este link no navegador: ${link}
    </p>
    <p style="margin-top:24px;font-size:12px;color:#5b5f66">
      Se você não reconhece essa solicitação, pode ignorar este e-mail com segurança.
    </p>
  </div>`;
}

export function emailConfirmacaoCadastro(link: string) {
  return {
    subject: "Confirme seu cadastro no Creditix",
    html: baseTemplate({
      titulo: "Confirme seu e-mail",
      corpo: "Falta um passo para começar a organizar suas dívidas no Creditix. Confirme seu e-mail para ativar sua conta.",
      textoBotao: "Confirmar cadastro",
      link,
    }),
  };
}

export function emailRedefinicaoSenha(link: string) {
  return {
    subject: "Redefinir sua senha do Creditix",
    html: baseTemplate({
      titulo: "Redefinir senha",
      corpo: "Recebemos um pedido para redefinir a senha da sua conta Creditix. Clique no botão abaixo para escolher uma nova senha. Este link expira em pouco tempo por segurança.",
      textoBotao: "Redefinir senha",
      link,
    }),
  };
}

export function emailConfirmarEmailAtual(link: string, emailNovo: string) {
  return {
    subject: "Confirme a troca de e-mail da sua conta Creditix",
    html: baseTemplate({
      titulo: "Confirmar troca de e-mail",
      corpo: `Foi solicitada a troca do e-mail da sua conta Creditix para <strong>${emailNovo}</strong>. Para autorizar, confirme aqui pelo seu e-mail atual. Você também vai precisar confirmar pelo novo endereço.`,
      textoBotao: "Confirmar pelo e-mail atual",
      link,
    }),
  };
}

export function emailConfirmarEmailNovo(link: string) {
  return {
    subject: "Confirme seu novo e-mail no Creditix",
    html: baseTemplate({
      titulo: "Confirmar novo e-mail",
      corpo: "Este é o novo e-mail solicitado para sua conta Creditix. Confirme aqui para concluir a troca (a confirmação pelo e-mail anterior também é necessária).",
      textoBotao: "Confirmar novo e-mail",
      link,
    }),
  };
}

export function emailLinkMagico(link: string) {
  return {
    subject: "Seu link de acesso ao Creditix",
    html: baseTemplate({
      titulo: "Entrar no Creditix",
      corpo: "Use o botão abaixo para entrar na sua conta sem senha. Este link expira em pouco tempo e só pode ser usado uma vez.",
      textoBotao: "Entrar no Creditix",
      link,
    }),
  };
}
