
# Portal do Mentorado + Checkout Asaas + Google Agenda

## Visão geral do fluxo

```text
Página Mentoria → Botão "Comprar Mentoria" → Checkout Asaas (3x R$197 no cartão)
        ↓ webhook PAYMENT_CONFIRMED
Edge function: cria user no Auth + perfil de mentorado + envia e-mail com senha temporária
        ↓
Mentorado loga em /mentorados/login → Dashboard com 4 abas + agendar reuniões
        ↓ ao agendar
Edge function chama Google Calendar (sua conta) → cria evento + Meet + convida o e-mail dele
```

## 1. Banco de dados (novas tabelas)

- **mentorship_plans** (catálogo): id, name, price_cents, installments, total_meetings, duration_months
- **mentees**: user_id (FK auth.users), plan_id, full_name, email, phone, started_at, asaas_customer_id, asaas_subscription_id, status (`pending|active|completed|cancelled`)
- **meetings**: id, mentee_id, sequence (1..6), title, scheduled_at, status (`blocked|available|scheduled|completed`), google_event_id, meet_link, recording_url, notes
- **meeting_resources**: id, meeting_id, kind (`video|pdf|link`), title, url
- **homework_tasks**: id, mentee_id, meeting_id, title, description, completed, completed_at, evidence_url
- **metrics_checkpoints**: id, mentee_id, period_start, leads_inbound, leads_outbound, connection_rate, meetings_scheduled, meetings_held, sales_count, revenue_cents
- **app_role** ganha novo valor: `'mentee'`

RLS: cada mentorado só lê/edita seus próprios registros; admin (você) lê tudo. Storage bucket `mentee-evidence` privado para upload de evidências.

Trigger ao criar mentee: gera automaticamente os 6 meetings (2 por mês × 3 meses) com `status='blocked'` e as homework_tasks-padrão por encontro.

## 2. Pagamento — Asaas (produção)

Você confirmou: produção direto, parcelado em 3x de R$197 (total R$197, não recorrência).

**Secret necessária:** `ASAAS_API_KEY` (vou pedir após aprovação do plano).

**Edge functions:**
- `asaas-create-checkout` (público, chamado pela landing): recebe nome/email/telefone/CPF → cria Customer + Payment com `billingType: "CREDIT_CARD"`, `installmentCount: 3`, `installmentValue: 197.00` → retorna `invoiceUrl` para redirect.
- `asaas-webhook` (público, sem verify_jwt): recebe eventos. No `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED` da primeira parcela → cria usuário no Supabase Auth com senha temporária (16 chars), insere em `mentees` com `status='active'`, libera os 2 primeiros `meetings`, envia e-mail.

**E-mail de boas-vindas:** template transacional com `email_domain--scaffold_transactional_email` (domínio configurado previamente) — assunto, senha temporária e link `/mentorados/login`.

**Segurança webhook:** validar header `asaas-access-token` contra secret `ASAAS_WEBHOOK_TOKEN` (configurado no painel Asaas).

## 3. Google Agenda + Meet

Você confirmou: agenda do Gabriel convida o mentorado.

- Connector **Google Calendar** linkado ao projeto (vou solicitar via fluxo de conectores após aprovação).
- Edge function `schedule-meeting`: o mentorado escolhe data/hora num slot disponível → função cria evento em `calendars/primary/events` com `attendees:[{email: mentee.email}, {email: gabriel}]` e `conferenceData.createRequest` (gera Meet automático) → salva `google_event_id` e `meet_link` em `meetings`.
- Edge function `cancel-meeting`: DELETE no evento.

Slots disponíveis: configuração simples (horários comerciais que você define em uma tabela `availability_slots` — pode editar via admin depois). MVP: lista fixa 9h/14h/16h seg–sex, conflitos checados via `freebusy.query`.

## 4. Rotas e telas

```
/mentorados/login         (pública — Card centralizado, e-mail + senha)
/mentorados               (protegida — Dashboard, redireciona pra login se !session OR !has_role('mentee'))
  ├─ Header: saudação + plano ativo + ProgressBar (meetings concluídos / 6)
  └─ Tabs (shadcn): Cronograma | Tarefas | Repositório | Métricas
/mentorados/reuniao/:id   (detalhe + agendar/cancelar)
```

### Aba 1 — Cronograma e Entregas
Timeline vertical com 3 grupos (Mês 1/2/3), 2 cards por mês. Cada card: status badge colorido, título do encontro, data agendada (ou botão "Agendar" se `available`), link do Meet (se agendado), seção "Conteúdo de apoio" com lista de recursos (vídeo/PDF). Cards `blocked` aparecem desabilitados.

### Aba 2 — Tarefas de Casa
Lista agrupada por encontro. Checkbox marca concluído (atualiza `completed_at`). Botão "Enviar evidência" abre input → upload pra storage bucket → salva URL em `evidence_url`.

### Aba 3 — Repositório de Dados
Biblioteca consolidada de todos os `meeting_resources` desbloqueados, filtrável por tipo (vídeo/PDF/link).

### Aba 4 — Checkpoints de Métricas
Tabela editável (quinzenal): formulário por período, salva em `metrics_checkpoints`. Acima, 4 KPI cards (último período) + minigráfico de linha (Recharts) com evolução de Receita e Reuniões Realizadas.

## 5. Visual

Você pediu **azul escuro + coral + cinza executivo** para o portal. **Atenção:** isso diverge da paleta oficial da sua marca (Grafite/Laranja/Vinho). Vou aplicar a paleta corporativa que você pediu **apenas dentro de /mentorados** (sub-tema) para manter o portal com cara de ferramenta SaaS, mantendo o site público com a paleta da marca. Tokens novos em `index.css` num escopo `.portal-theme`:

- Azul escuro: `#0F1F3D` (background/sidebar)
- Coral: `#FF6B5B` (accent/CTA)
- Cinza executivo: `#6B7280` / `#F3F4F6`
- Tipografia: Inter (UI) + IBM Plex Mono (dados/KPIs)

Componentes shadcn (Card, Tabs, Sidebar, Progress, Table, Dialog, Checkbox) com variantes próprias.

## 6. Mock data
Seed inicial só do plano "Mentoria Comercial 1:1 — 3 Meses" e dos templates de homework_tasks por encontro (Mapeamento de Funil, Matriz ICP, Régua WhatsApp, Pitch SPIN, etc). Conta real só é criada via webhook Asaas — sem usuários fake em produção.

## 7. Ordem de entrega

1. Migração DB + role `mentee` + seed do plano e templates
2. Rotas `/mentorados/login` e `/mentorados` com guard de auth+role
3. Layout do dashboard (header, sidebar, 4 abas) com sub-tema visual
4. Cada aba conectada a dados reais (CRUD por aba)
5. Pedir `ASAAS_API_KEY` + `ASAAS_WEBHOOK_TOKEN` e implementar `asaas-create-checkout` + `asaas-webhook`
6. Setup de e-mail transacional (boas-vindas com senha temporária)
7. Botão "Comprar Mentoria" na landing redirecionando pro checkout Asaas
8. Linkar connector Google Calendar + edge functions `schedule-meeting` / `cancel-meeting`
9. QA: pagamento sandbox-of-prod (pequeno valor) + fluxo completo até agendar 1 reunião

## Pendências que vou pedir na hora de implementar
- `ASAAS_API_KEY` (produção) e `ASAAS_WEBHOOK_TOKEN`
- Confirmação do domínio de e-mail (se ainda não houver `setup_email_infra`)
- Linkar connector Google Calendar (sua conta Google)
- Seu e-mail Gabriel para entrar como attendee nas reuniões
