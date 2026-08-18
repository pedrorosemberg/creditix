import { z } from "zod";
import { statusDividaSchema } from "@/lib/security/validation";
import type { StatusDividaDb, TipoTransacaoDb } from "@/types/database.types";
import { SECOES_RELATORIO, type FiltrosRelatorio, type SecaoRelatorio } from "./tipos";

const tipoTransacaoSchema = z.enum(["receita", "despesa", "pagamento_divida"]);
const dataSchema = z.string().date();
const idSchema = z.string().uuid();

/** Converte o objeto de searchParams de uma página App Router em URLSearchParams. */
export function searchParamsParaURLSearchParams(
  sp: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [chave, valor] of Object.entries(sp)) {
    if (Array.isArray(valor)) {
      valor.forEach((v) => usp.append(chave, v));
    } else if (valor !== undefined) {
      usp.append(chave, valor);
    }
  }
  return usp;
}

/**
 * Extrai e valida os filtros de relatório a partir de query params — usado
 * tanto pela tela /relatorios quanto pelas rotas de exportação (PDF/CSV),
 * para garantir que o arquivo baixado reflita exatamente o que foi
 * pré-visualizado na tela.
 */
export function parsearFiltros(searchParams: URLSearchParams): FiltrosRelatorio {
  const secoesBrutas = searchParams.getAll("secao");
  const secoes = secoesBrutas.filter((s): s is SecaoRelatorio =>
    SECOES_RELATORIO.includes(s as SecaoRelatorio),
  );

  const inicioParsed = dataSchema.safeParse(searchParams.get("inicio") ?? "");
  const fimParsed = dataSchema.safeParse(searchParams.get("fim") ?? "");

  const dividaIds = searchParams.getAll("dividaId").filter((id) => idSchema.safeParse(id).success);
  const statusDivida = searchParams
    .getAll("status")
    .filter((s): s is StatusDividaDb => statusDividaSchema.safeParse(s).success);
  const tipoTransacao = searchParams
    .getAll("tipoTransacao")
    .filter((t): t is TipoTransacaoDb => tipoTransacaoSchema.safeParse(t).success);

  return {
    inicio: inicioParsed.success ? inicioParsed.data : null,
    fim: fimParsed.success ? fimParsed.data : null,
    // Sem nenhuma seção marcada (primeira visita à tela, sem filtros ainda) mostra tudo.
    secoes: secoes.length > 0 ? secoes : [...SECOES_RELATORIO],
    dividaIds,
    statusDivida,
    tipoTransacao,
  };
}
