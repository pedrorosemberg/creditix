# Observabilidade e analytics de produto

Duas ferramentas, ambas opcionais exceto a primeira, para o time interno acompanhar a saúde e o uso do
produto — nenhuma delas dá acesso a dados financeiros, dívidas ou qualquer informação identificável de um
usuário específico. Isso é reforçado tanto pela configuração (nenhum campo de PII é enviado) quanto pelo
acesso aos painéis (restrito ao time, nunca exposto a usuários finais).

## Vercel Analytics (sempre ativo)

Já habilitado via `import { Analytics } from "@vercel/analytics/next"` em `src/app/layout.tsx` — não
precisa de nenhuma variável de ambiente. Mostra visitas, páginas mais acessadas e origem de tráfego,
direto no painel do projeto na Vercel (aba **Analytics**). Gratuito no plano Hobby com retenção limitada;
sem custo adicional.

## Grafana Cloud (Frontend Observability / Faro) — opcional

Captura erros JavaScript não tratados e métricas de performance real dos usuários (Core Web Vitals),
agregados — sem session replay e sem enviar e-mail/nome do usuário como atributo (ver
`src/components/observabilidade/grafana-faro.tsx`). Desligado por padrão; só ativa se
`NEXT_PUBLIC_GRAFANA_FARO_URL` estiver configurada.

### Como configurar (plano gratuito, sem cartão de crédito)

1. Crie uma conta em [grafana.com](https://grafana.com/auth/sign-up/create-user) (Grafana Cloud Free —
   gratuito indefinidamente, não é trial).
2. No seu stack, vá em **Frontend Observability** (ou **Connections → Add new connection → Frontend
   Application**) e crie uma nova aplicação chamada `creditix`.
3. Copie a **Collector URL** gerada.
4. Configure `NEXT_PUBLIC_GRAFANA_FARO_URL` com essa URL nas variáveis de ambiente da Vercel (ou
   `.env.local`).
5. Os painéis de erros/performance aparecem automaticamente dentro do próprio Grafana Cloud, sob a
   aplicação `creditix` — acesso restrito a quem você convidar para a organização no Grafana, nunca
   exposto na aplicação em si.

### Por que Grafana e não Datadog

Datadog não tem um plano gratuito de verdade para uso contínuo (só um trial de 14 dias) — incompatível
com a regra deste projeto de só adicionar infraestrutura nova se for genuinamente gratuita. O Grafana
Cloud Free é gratuito indefinidamente (com limites generosos de volume), por isso foi a escolha.

## Próximos passos

- **Dashboards agregados dentro do próprio `/admin`**: hoje as métricas do Grafana só aparecem no painel
  do Grafana Cloud (fora do app). Um próximo passo seria embutir um painel público/compartilhado do
  Grafana via iframe na página `/admin`, para quem tem acesso `admin_global` não precisar sair do
  Creditix — não implementado ainda.
- **Alertas**: o Grafana Cloud Free permite configurar alertas (ex.: taxa de erro acima de X%) — não
  configurado ainda, fica como setup manual no painel do Grafana quando desejado.
