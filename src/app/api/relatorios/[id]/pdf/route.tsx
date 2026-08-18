import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { analisarDivida } from "@/lib/legal/analisar-divida";
import { DebtReportPdf } from "@/components/relatorios/debt-report-pdf";
import { uuidSchema } from "@/lib/security/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return new Response("ID inválido", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { data: divida } = await supabase.from("debts").select("*").eq("id", parsedId.data).maybeSingle();
  if (!divida) return new Response("Dívida não encontrada", { status: 404 });

  const { analise, prescricao } = analisarDivida(divida);
  const buffer = await renderToBuffer(
    <DebtReportPdf divida={divida} analise={analise} prescricao={prescricao} />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="divida-${divida.id}.pdf"`,
    },
  });
}
