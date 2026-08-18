import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Info, Mail, Trash2, UserCog, AlertOctagon, CalendarClock } from "lucide-react";
import type { TipoLogDb } from "@/types/database.types";
import type { Tone } from "@/components/ui/badge";

export const TIPO_LOG_CONFIG: Record<TipoLogDb, { label: string; tone: Tone; icon: LucideIcon }> = {
  erro: { label: "Erro", tone: "danger", icon: AlertOctagon },
  aviso: { label: "Aviso", tone: "warning", icon: AlertTriangle },
  info: { label: "Informação", tone: "info", icon: Info },
  conta: { label: "Conta", tone: "brand", icon: UserCog },
  exclusao: { label: "Exclusão", tone: "danger", icon: Trash2 },
  email: { label: "E-mail", tone: "success", icon: Mail },
  agendado: { label: "Agendado", tone: "neutral", icon: CalendarClock },
};

export const TIPOS_LOG_ORDENADOS: TipoLogDb[] = ["erro", "aviso", "info", "conta", "exclusao", "email", "agendado"];
