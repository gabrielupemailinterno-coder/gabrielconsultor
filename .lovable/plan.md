## Score Comercial — plataforma dentro do sistema atual

Nova área em `/scoreapp` para vendedores registrarem rotina, verem métricas, score e conteúdos. Reaproveita autenticação, layout, tokens de design e admin já existentes. Não é CRM.

### 1. Rotas (React Router em `src/App.tsx`)

Público:
- `/scoreapp` — landing curta + CTA (cadastro/login)
- `/scoreapp/login` — login
- `/scoreapp/cadastro` — signup (nome, email, telefone, profissão/segmento, nível de experiência, origem do lead, aceite de termos)

Autenticado (vendedor):
- `/scoreapp/onboarding` — meta mensal, ticket médio, nº vendas, ligações/dia, whatsapps/dia, apresentações/semana, propostas/semana, segmento
- `/scoreapp/app` — dashboard pessoal (KPIs, % da meta, conversões, evolução semanal, score, diagnóstico, badges)
- `/scoreapp/app/registrar` — formulário rápido do dia (<2 min, mobile first)
- `/scoreapp/app/historico` — lista de registros diários
- `/scoreapp/app/conteudos` — biblioteca de módulos
- `/scoreapp/app/conteudos/:slug` — módulo (vídeo embed + material + marcar concluído)
- `/scoreapp/app/planos` — Mensal R$ 9,70 / Semestral R$ 49,70 (checkout externo — botão placeholder para Asaas depois)

Admin (dentro do `/admin` atual, nova aba "Score Comercial"):
- Lista de usuários Score, filtros, tags de temperatura, detalhes, exportação.

### 2. Banco de dados (Lovable Cloud)

Novas tabelas no schema `public` (todas com RLS + GRANTs; usuário só vê o próprio, admin vê tudo via `has_role`):

- `score_profiles` — 1:1 com `auth.users`. Campos: full_name, email, phone, profession, experience_level, lead_origin, accepted_terms_at, segment, plan (`free|mensal|semestral`), plan_started_at, plan_expires_at, last_seen_at.
- `score_goals` — meta_mensal_valor, ticket_medio, meta_vendas, ligacoes_dia, whatsapps_dia, apresentacoes_semana, propostas_semana, segmento, effective_from.
- `score_daily_logs` — user_id, date (unique por user+date), ligacoes, whatsapps, prospeccoes, contatos_efetivos, reunioes_agendadas, apresentacoes, propostas, vendas, valor_vendido, observacoes.
- `score_content_modules` — categoria, slug, título, descrição, video_url, material_url, sort_order, published. Gerenciado pelo admin.
- `score_content_progress` — user_id, module_id, completed_at.
- `score_badges` — user_id, badge_key, earned_at (único).
- `score_upsell_interests` — user_id, context (ex.: "análise individual do funil"), created_at.

Trigger simples para popular `score_profiles` no signup via `handle_new_user` existente (adaptar/estender).

### 3. Cálculos (client-side em `src/lib/scoreapp/`)

- `computeConversions(logs)` — prospecções→contatos, contatos→reuniões, reuniões→apresentações, apresentações→propostas, propostas→vendas, vendas/prospecções, ticket médio, valor/atividade.
- `computeDiagnostics(logs, goals)` — retorna array de insights por gargalo (regras do briefing).
- `computeScore(logs, goals)` — 0–100 ponderando consistência (dias preenchidos/dias corridos), cumprimento de metas diárias, evolução semanal, conversão, volume, resultado. Retorna faixa: Iniciante / Em construção / Em evolução / Alta performance / Elite.
- `computeBadges(logs)` — verifica e concede badges (primeiro registro, 7/30 dias consistência, primeira venda, 100/500/1000 ligações, meta semanal, meta mensal).
- `computeTemperature(profile, logs, goals)` — frio / ativação / engajado / quente-mentoria (regras do briefing).

Recalcado no load do dashboard e após cada registro; badges gravados no banco quando conquistados.

### 4. UI (mobile first, mesma linguagem visual)

- Reuso de tokens `index.css` (grafite, laranja acento, off-white), tipografia Libre Baskerville + Inter + IBM Plex Mono para KPIs.
- Componentes shadcn já existentes (Card, Button, Input, Tabs, Dialog, Progress, Badge).
- Novo `src/components/scoreapp/ScoreLayout.tsx` com header próprio + bottom nav mobile (Dashboard, Registrar, Conteúdos, Perfil).
- Dashboard em cards: Meta (progress ring), KPIs do mês, Funil de conversão, Score (número grande + faixa + barra), Diagnóstico (lista), Badges, Evolução semanal (gráfico simples com Recharts já disponível).
- Formulário do dia: campos numéricos grandes, teclado numérico, submit único.

### 5. Painel admin

Nova aba "Score" em `src/pages/Admin.tsx`:
- KPIs topo: total usuários, ativos (log nos últimos 7d), inativos, top preenchedores, top score, baixo score.
- Tabela: nome, contato, segmento, origem, plano, cadastro, último acesso, score, temperatura (badge colorido), botão "Ver detalhes".
- Detalhe do usuário: perfil, metas, últimos logs, score, diagnóstico atual, botão "Virar mentorado" (reusa `InviteMenteeDialog`).
- Gerenciamento dos módulos de conteúdo (CRUD simples).

### 6. Pagamento

Botões nos planos disparam a mesma edge function `asaas-create-checkout` (novo parâmetro `product: "scoreapp_mensal" | "scoreapp_semestral"` com valores 9,70 e 49,70). Sem cobrança implementada agora além do checkout — resto fica placeholder para ativar depois.

### 7. Entrega em fases

1. Migração DB (tabelas + RLS + GRANTs + trigger de profile).
2. Auth/rotas + cadastro + onboarding.
3. Registro diário + dashboard + cálculos + score + diagnóstico + badges.
4. Área de conteúdos + progresso.
5. Aba admin Score + tags de temperatura + CRUD de módulos.
6. Planos + botão "Quero análise individual" (grava em `score_upsell_interests`).

### Pontos que preciso confirmar antes de codar

1. **Login separado ou compartilhado?** O login do Score usa a mesma conta Supabase do portal de mentorados (um usuário pode ser as duas coisas), ou é um cadastro totalmente isolado? Recomendo compartilhado: mesmo `auth.users`, papel novo `scoreapp_user` em `user_roles`, e a pessoa cai no `/scoreapp/app` quando entra por lá.
2. **Conteúdos iniciais**: começo com os 13 módulos listados só com título/descrição (sem vídeo) para você preencher depois no admin, ok?
3. **Checkout**: ativo o botão pagando via Asaas agora (usando a função existente) ou deixo só o CTA gravando interesse e a gente liga depois?
