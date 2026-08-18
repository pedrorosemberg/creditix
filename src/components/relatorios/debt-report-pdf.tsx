import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Debt } from "@/types/database.types";
import type { ResultadoAnaliseJuros } from "@/lib/legal/tipos";
import type { ResultadoPrescricao } from "@/lib/legal/prescricao";
import { fundamento } from "@/lib/legal/fundamentos";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica", color: "#1e1e1e" },
  title: { fontSize: 16, marginBottom: 4, color: "#DC2626" },
  subtitle: { fontSize: 10, marginBottom: 16, color: "#5b5f66" },
  sectionTitle: { fontSize: 12, marginTop: 14, marginBottom: 6, color: "#DC2626" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  label: { color: "#5b5f66" },
  value: { fontWeight: 700 },
  paragraph: { marginBottom: 6, lineHeight: 1.4 },
  passo: { marginBottom: 6 },
  passoTitulo: { fontWeight: 700, marginBottom: 1 },
  footer: { marginTop: 20, fontSize: 8, color: "#5b5f66" },
});

export function DebtReportPdf({
  divida,
  analise,
  prescricao,
}: {
  divida: Debt;
  analise: ResultadoAnaliseJuros;
  prescricao: ResultadoPrescricao;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de dívida — Creditix</Text>
        <Text style={styles.subtitle}>
          Gerado em {new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Credor</Text>
          <Text style={styles.value}>{divida.credor_nome}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Produto/serviço</Text>
          <Text style={styles.value}>{divida.produto_servico}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Valor original</Text>
          <Text style={styles.value}>{Number(divida.valor_original).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Valor atual</Text>
          <Text style={styles.value}>{Number(divida.valor_atual).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Text>
        </View>
        {analise.taxaMensalImplicita !== null && (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>Taxa mensal estimada</Text>
              <Text style={styles.value}>{(analise.taxaMensalImplicita * 100).toFixed(2)}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Taxa anual estimada</Text>
              <Text style={styles.value}>{(analise.taxaAnualImplicita! * 100).toFixed(1)}%</Text>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Análise de juros</Text>
        <Text style={styles.paragraph}>{analise.explicacao}</Text>

        {prescricao.possivelmentePrescrita && (
          <>
            <Text style={styles.sectionTitle}>Possível prescrição</Text>
            <Text style={styles.paragraph}>{prescricao.explicacao}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Próximos passos recomendados</Text>
        {analise.proximosPassos.map((passo, i) => (
          <View key={i} style={styles.passo}>
            <Text style={styles.passoTitulo}>
              {i + 1}. {passo.titulo}
            </Text>
            <Text>{passo.descricao}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Fundamentos legais</Text>
        {analise.fundamentoIds.map((fid) => {
          const f = fundamento(fid as Parameters<typeof fundamento>[0]);
          return (
            <Text key={fid} style={styles.paragraph}>
              {f.titulo}: {f.resumo}
            </Text>
          );
        })}

        <Text style={styles.footer}>
          Documento gerado automaticamente pelo Creditix. Conteúdo orientativo com base em legislação e
          jurisprudência federais — não substitui aconselhamento jurídico individualizado por advogado(a)
          ou pela Defensoria Pública.
        </Text>
      </Page>
    </Document>
  );
}
