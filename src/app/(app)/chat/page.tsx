import { Bot, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import { ChatForm } from "./chat-form";
import { limparConversaAction } from "./actions";

// O provedor de IA padrão (modelo local embutido, sem chave necessária)
// pode levar bem mais que o timeout default em cold start — dá mais tempo
// à Server Action de envio de mensagem antes da função ser encerrada.
export const maxDuration = 60;

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: mensagens } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Chat com a IA</h1>
          <p className="text-sm text-foreground-muted">
            Converse sobre suas dívidas, orçamento e plano de recuperação — só com os seus dados.
          </p>
        </div>
        {mensagens && mensagens.length > 0 && (
          <form action={limparConversaAction}>
            <Button type="submit" variant="secondary" size="sm">
              Limpar conversa
            </Button>
          </form>
        )}
      </div>

      <Card className="flex items-start gap-2 border-brand-red-soft bg-brand-red-soft">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
        <p className="text-xs text-foreground-muted">
          Este assistente só enxerga os seus próprios dados, nunca de outros usuários, e não tem permissão para
          alterar nada no seu cadastro — ele só conversa e explica. Análises não substituem aconselhamento jurídico
          formal.
        </p>
      </Card>

      <Card className="space-y-4">
        {!mensagens || mensagens.length === 0 ? (
          <CardDescription>
            Nenhuma mensagem ainda. Pergunte, por exemplo: &quot;qual dívida devo priorizar?&quot; ou &quot;dá pra
            quitar tudo à vista?&quot;.
          </CardDescription>
        ) : (
          <div className="space-y-3">
            {mensagens.map((m) => (
              <div
                key={m.id}
                className={cn("flex gap-2", m.role === "usuario" ? "flex-row-reverse text-right" : "")}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    m.role === "usuario" ? "bg-brand-red-soft text-brand-red" : "bg-surface-muted text-foreground-muted",
                  )}
                >
                  {m.role === "usuario" ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-sm",
                    m.role === "usuario" ? "bg-brand-red-soft text-foreground" : "bg-surface-muted text-foreground",
                  )}
                >
                  {m.role === "usuario" ? <p className="whitespace-pre-wrap">{m.content}</p> : <Markdown>{m.content}</Markdown>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-2 text-sm">Nova mensagem</CardTitle>
        <ChatForm />
      </Card>
    </div>
  );
}
