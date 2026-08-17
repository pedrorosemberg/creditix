import { Badge } from "@/components/ui/badge";
import type { VeredictoJuros } from "@/lib/legal/tipos";

const CONFIG: Record<VeredictoJuros, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  dentro_da_faixa: { label: "Juros dentro da faixa legal", tone: "success" },
  zona_de_atencao: { label: "Zona de atenção", tone: "warning" },
  provavelmente_abusivo: { label: "Provavelmente abusivo", tone: "danger" },
  acima_do_teto_legal: { label: "Acima do teto legal", tone: "danger" },
  sem_dados_suficientes: { label: "Dados insuficientes", tone: "neutral" },
};

export function VeredictoBadge({ veredicto }: { veredicto: VeredictoJuros }) {
  const { label, tone } = CONFIG[veredicto];
  return <Badge tone={tone}>{label}</Badge>;
}
