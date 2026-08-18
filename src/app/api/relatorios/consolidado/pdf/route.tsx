import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { parsearFiltros } from "@/lib/relatorios/filtros";
import { obterDadosRelatorio } from "@/lib/relatorios/dados";
import { ConsolidadoReportPdf } from "@/components/relatorios/consolidado-pdf";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Não autenticado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const filtros = parsearFiltros(searchParams);
  const dados = await obterDadosRelatorio(supabase, filtros);

  const buffer = await renderToBuffer(<ConsolidadoReportPdf dados={dados} filtros={filtros} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="relatorio-creditix.pdf"`,
    },
  });
}
