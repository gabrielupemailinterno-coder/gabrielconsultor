
# Redesign do /admin — Cockpit de Gestão

Transformar o painel atual (header + faixa horizontal de 15 abas) em um cockpit executivo com sidebar navegável, dashboard inicial com KPIs e ações rápidas, e agrupamento lógico dos módulos existentes. **Nenhum módulo é removido ou alterado internamente — apenas a moldura de navegação e a home mudam.**

## Estado atual (diagnóstico)

- `src/pages/Admin.tsx` concentra: guarda de auth, carga de dados, 4 StatCards fixos no topo, faixa horizontal com 15 abas e o conteúdo inline de cada aba (leads, visits, clicks, sessions).
- Componentes de módulo (Mentorados, Score, Conteúdos, E-mails, Prospecção, WhatsApp, Ritual, BotFlow, BotConversa, Integrações, Blog) já estão isolados em `src/components/admin/*` — só são renderizados condicionalmente.
- A tira de 15 abas quebra visualmente e não escala. Não há home, não há hierarquia, não há atalhos.

## Direção visual

- Layout shell com **sidebar shadcn** (`collapsible="icon"`) à esquerda + header fino com breadcrumb e ações globais + área de conteúdo.
- Paleta oficial da marca (Grafite/Petróleo/Laranja/Areia — memory: Visual Identity). Acento laranja `#C4632D` apenas em CTAs e estado ativo. Fundo Grafite, cards Petróleo, texto Off-white.
- Tipografia: Libre Baskerville nos títulos de seção e KPIs numéricos em IBM Plex Mono.
- Sem alterar tokens globais do projeto — só usar os tokens semânticos já existentes; se faltar variante, adicionar em `index.css` sem quebrar o resto.

## Estrutura de navegação (sidebar)

Sidebar com grupos colapsáveis, cada item leva a uma view (mantendo os componentes atuais como conteúdo):

```
COCKPIT
  └ Visão Geral              (nova home /admin)

OPERAÇÃO
  ├ Mentorados               (MenteesAdmin)
  ├ Score Comercial          (ScoreAdmin)
  └ Conteúdos                (ContentsAdmin)

RELACIONAMENTO
  ├ E-mails                  (MenteeEmailComposer)
  ├ Prospecção               (ProspectingBulk)
  ├ WhatsApp                 (WhatsAppAdmin)
  └ Ritual WhatsApp          (WhatsAppRitualAdmin)

AUTOMAÇÕES
  ├ Fluxo do Bot             (BotFlowsAdmin)
  ├ BotConversa              (BotConversaAdmin)
  └ Integrações              (IntegrationsAdmin)

ANALYTICS
  ├ Cadastros                (leads inline)
  ├ Visitas                  (visits inline)
  ├ Cliques                  (clicks inline)
  └ Sessões                  (sessions inline)

CONTEÚDO
  └ Blog                     (BlogAdmin)
```

Sidebar colapsa para tira de ícones; grupo do item ativo abre automaticamente.

## Dashboard "Visão Geral" (nova home)

Grid de cards, todos alimentados por queries já existentes ou uma extensão simples do `loadData`:

**Linha 1 — KPIs (6 cards compactos)**
- Cadastros totais / últimos 7d
- Mentorados ativos
- Score: usuários ativos hoje
- Visitas 7d + únicos
- Cliques 7d
- Tempo médio de sessão

**Linha 2 — Ações rápidas** (grid 2×3, ícone + label, cada botão navega para o módulo)
- Convidar mentorado · Novo e-mail · Nova campanha WhatsApp · Testar BotConversa · Novo post do blog · Ver integrações

**Linha 3 — Feeds** (2 colunas)
- Últimos 5 cadastros (nome, form_type, tempo relativo, atalho "virar mentorado")
- Últimas 5 entregas de integração (`integration_deliveries` — status, evento, tempo)

**Linha 4 — Saúde do sistema** (chips discretos)
- Webhooks BotConversa ativos, integrações habilitadas, fila de e-mails pendente, últimos erros.

## Etapas de implementação

1. **Shell de layout**
   - Criar `src/components/admin/AdminLayout.tsx` com `SidebarProvider`, `AppSidebar`, header com `SidebarTrigger` + email + logout, e `<Outlet />`/children.
   - Criar `src/components/admin/AdminSidebar.tsx` com grupos e itens acima, usando `NavLink` + `isActive`.

2. **Home do cockpit**
   - Criar `src/components/admin/DashboardOverview.tsx` com KPIs, ações rápidas, feeds e saúde.
   - Criar hook `src/hooks/useAdminOverview.ts` que agrega as consultas (leads, visits, clicks, sessions, integration_deliveries, mentees count, botconversa/integrations enabled counts). Reaproveitar o padrão de `loadData` atual.
   - Componente reutilizável `src/components/admin/KpiCard.tsx` (variante do StatCard atual com sparkline opcional e delta 7d).
   - Componente `src/components/admin/QuickAction.tsx`.

3. **Refatoração de `src/pages/Admin.tsx`**
   - Manter guarda de auth e estado de tab, mas trocar a tira horizontal pelo `AdminLayout` + `AdminSidebar`.
   - Extrair os 4 blocos inline (leads/visits/clicks/sessions) para `src/components/admin/analytics/{LeadsTable,VisitsTable,ClicksTable,SessionsTable}.tsx` para desinchar o `Admin.tsx`.
   - Roteamento interno via estado (sem mudar rotas do `App.tsx`): `view` controla qual módulo renderiza.
   - Preservar `tab` param opcional via querystring (`?view=score`) para deep-link.

4. **Ajustes visuais**
   - Revisar `src/index.css` só se faltar token para o fundo do sidebar/cockpit (adicionar variáveis, não hardcode).
   - Garantir dark mode consistente e contraste no acento laranja.

5. **Responsivo**
   - Sidebar em `offcanvas` no mobile (via `useIsMobile`), header ganha `SidebarTrigger` visível.
   - Dashboard: KPIs em grid 2 colunas no mobile, 3 no tablet, 6 no desktop.

6. **Validação**
   - Abrir cada item da sidebar e confirmar que o módulo antigo renderiza igual.
   - Testar colapso do sidebar, deep-link `?view=…`, mobile.
   - `tsgo` + build.

## Arquivos envolvidos

**Novos**
- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/DashboardOverview.tsx`
- `src/components/admin/KpiCard.tsx`
- `src/components/admin/QuickAction.tsx`
- `src/components/admin/analytics/LeadsTable.tsx`
- `src/components/admin/analytics/VisitsTable.tsx`
- `src/components/admin/analytics/ClicksTable.tsx`
- `src/components/admin/analytics/SessionsTable.tsx`
- `src/hooks/useAdminOverview.ts`

**Editados**
- `src/pages/Admin.tsx` (trocar shell, remover blocos inline)
- `src/index.css` (apenas se necessário adicionar token de sidebar/cockpit)

**Não tocados**
- Todos os componentes de módulo existentes (`MenteesAdmin`, `ScoreAdmin`, `ContentsAdmin`, `MenteeEmailComposer`, `ProspectingBulk`, `WhatsAppAdmin`, `WhatsAppRitualAdmin`, `BotFlowsAdmin`, `BotConversaAdmin`, `IntegrationsAdmin`, `BlogAdmin`).
- Rotas em `src/App.tsx`, edge functions, tabelas do backend, `.env`, tipos gerados.

## Premissas (corrija se necessário)

- A sidebar substitui totalmente a tira de abas horizontal — sem manter as duas.
- Os 4 KPIs atuais no topo continuam existindo, mas dentro da home "Visão Geral" (não em todas as telas).
- Deep-link por querystring é suficiente; não é preciso criar sub-rotas (`/admin/mentorados`, etc.).
