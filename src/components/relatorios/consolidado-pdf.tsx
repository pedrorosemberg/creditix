import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { STATUS_DIVIDA_LABEL, TIPO_TRANSACAO_LABEL } from "@/lib/constants/labels";
import { veredictoLabel } from "@/components/dividas/veredicto-badge";
import type { DadosRelatorio } from "@/lib/relatorios/dados";
import type { FiltrosRelatorio } from "@/lib/relatorios/tipos";

const MODALIDADE_LABEL: Record<string, string> = {
  avista_acumulado: "Quitada à vista",
  parcelado: "Parcelada",
  nao_alocada: "Não coube no orçamento",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1e1e1e" },
  title: { fontSize: 16, marginBottom: 4, color: "#DC2626" },
  subtitle: { fontSize: 9, marginBottom: 16, color: "#5b5f66" },
  sectionTitle: { fontSize: 12, marginTop: 16, marginBottom: 8, color: "#DC2626" },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1px solid #e3e5e9",
    paddingBottom: 4,
    marginBottom: 4,
    color: "#5b5f66",
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "1px solid #f5f6f8",
  },
  col: { paddingRight: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  summaryLabel: { color: "#5b5f66" },
  summaryValue: { fontWeight: 700 },
  empty: { color: "#5b5f66", fontStyle: "italic", marginBottom: 8 },
  footer: { marginTop: 20, fontSize: 8, color: "#5b5f66" },
});

export function ConsolidadoReportPdf({ dados, filtros }: { dados: DadosRelatorio; filtros: FiltrosRelatorio }) {
  const periodo =
    filtros.inicio || filtros.fim
      ? `Período: ${filtros.inicio ? formatarData(filtros.inicio) : "início"} a ${filtros.fim ? formatarData(filtros.fim) : "hoje"}`
      : "Sem filtro de período (todos os registros)";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório consolidado — Creditix</Text>
        <Text style={styles.subtitle}>
          Gerado em {new Date().toLocaleDateString("pt-BR")} · {periodo}
        </Text>

        {filtros.secoes.includes("dividas") && (
          <>
            <Text style={styles.sectionTitle}>Dívidas ({dados.dividas.length})</Text>
            {dados.dividas.length === 0 ? (
              <Text style={styles.empty}>Nenhuma dívida no filtro selecionado.</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={{ ...styles.col, width: "26%" }}>Credor</Text>
                  <Text style={{ ...styles.col, width: "20%" }}>Valor atual</Text>
                  <Text style={{ ...styles.col, width: "18%" }}>Status</Text>
                  <Text style={{ ...styles.col, width: "36%" }}>Veredicto jurídico</Text>
                </View>
                {dados.dividas.map((d) => (
                  <View key={d.id} style={styles.tableRow}>
                    <Text style={{ ...styles.col, width: "26%" }}>{d.credor_nome}</Text>
                    <Text style={{ ...styles.col, width: "20%" }}>{formatarMoeda(Number(d.valor_atual))}</Text>
                    <Text style={{ ...styles.col, width: "18%" }}>{STATUS_DIVIDA_LABEL[d.status]}</Text>
                    <Text style={{ ...styles.col, width: "36%" }}>{veredictoLabel(d.veredictoJuridico)}</Text>
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total das dívidas listadas</Text>
                  <Text style={styles.summaryValue}>{formatarMoeda(dados.totalDividas)}</Text>
                </View>
              </>
            )}
          </>
        )}

        {filtros.secoes.includes("transacoes") && (
          <>
            <Text style={styles.sectionTitle}>Transações ({dados.transacoes.length})</Text>
            {dados.transacoes.length === 0 ? (
              <Text style={styles.empty}>Nenhuma transação no filtro selecionado.</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={{ ...styles.col, width: "15%" }}>Data</Text>
                  <Text style={{ ...styles.col, width: "40%" }}>Descrição</Text>
                  <Text style={{ ...styles.col, width: "20%" }}>Tipo</Text>
                  <Text style={{ ...styles.col, width: "25%" }}>Valor</Text>
                </View>
                {dados.transacoes.map((t) => (
                  <View key={t.id} style={styles.tableRow}>
                    <Text style={{ ...styles.col, width: "15%" }}>{formatarData(t.data)}</Text>
                    <Text style={{ ...styles.col, width: "40%" }}>{t.descricao}</Text>
                    <Text style={{ ...styles.col, width: "20%" }}>{TIPO_TRANSACAO_LABEL[t.tipo]}</Text>
                    <Text style={{ ...styles.col, width: "25%" }}>{formatarMoeda(Number(t.valor))}</Text>
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total de receitas</Text>
                  <Text style={styles.summaryValue}>{formatarMoeda(dados.totalReceitas)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total de despesas/pagamentos</Text>
                  <Text style={styles.summaryValue}>{formatarMoeda(dados.totalDespesas)}</Text>
                </View>
              </>
            )}
          </>
        )}

        {filtros.secoes.includes("recuperacao") && dados.plano && (
          <>
            <Text style={styles.sectionTitle}>Recuperação financeira (situação atual)</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Margem mensal (renda − essenciais)</Text>
              <Text style={styles.summaryValue}>{formatarMoeda(dados.plano.margemDisponivel)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reserva de segurança (mínimo existencial)</Text>
              <Text style={styles.summaryValue}>{formatarMoeda(dados.plano.reservaSeguranca)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Disponível de fato para dívidas</Text>
              <Text style={styles.summaryValue}>{formatarMoeda(dados.plano.margemParaDividas)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Economia total com descontos à vista</Text>
              <Text style={styles.summaryValue}>{formatarMoeda(dados.plano.totalEconomizadoComDescontos)}</Text>
            </View>
            {dados.plano.resultados.length > 0 && (
              <>
                <View style={{ ...styles.tableHeader, marginTop: 8 }}>
                  <Text style={{ ...styles.col, width: "40%" }}>Dívida</Text>
                  <Text style={{ ...styles.col, width: "30%" }}>Estratégia</Text>
                  <Text style={{ ...styles.col, width: "30%" }}>Mês de quitação</Text>
                </View>
                {dados.plano.resultados.map((r) => (
                  <View key={r.dividaId} style={styles.tableRow}>
                    <Text style={{ ...styles.col, width: "40%" }}>{r.credorNome}</Text>
                    <Text style={{ ...styles.col, width: "30%" }}>{MODALIDADE_LABEL[r.modalidadeEscolhida]}</Text>
                    <Text style={{ ...styles.col, width: "30%" }}>{r.mesQuitacao ?? "—"}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        <Text style={styles.footer}>
          Documento gerado automaticamente pelo Creditix a partir dos filtros selecionados. Conteúdo
          orientativo — não substitui aconselhamento jurídico ou financeiro individualizado.
        </Text>
      </Page>
    </Document>
  );
}
