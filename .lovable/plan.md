
# Plano: Portal do Parceiro / Afiliado

## 1. Modelo de dados (migrations novas, sem alterar `partners` existente)

### 1.1 Vincular parceiro a um usuário (login do portal)
Adicionar coluna `user_id uuid` (nullable, FK lógica para `auth.users.id`, UNIQUE) em `partners`. Permite que um parceiro autentique-se e o portal saiba qual `partner_id` mostrar. Nullable porque muitos parceiros hoje são só cadastro interno.

Nova role em `app_role`: `'partner'`. Atribuída via `user_roles` quando o admin conecta um `partners.user_id`. **Não dá acesso ao `/admin`** (guard atual usa `has_role(uid,'admin')`).

### 1.2 Comissão configurável por parceiro
Em `partners`: `commission_rate numeric(5,2) NOT NULL DEFAULT 70.00` (percentual). Permite override futuro sem mudar código.

### 1.3 Novas tabelas

**`partner_links`** — links de divulgação que o parceiro cria/copia.
- `id`, `partner_id` (FK partners), `slug text UNIQUE` (ex.: código curto), `label text` (ex.: "Instagram bio"), `destination text` (rota interna: `/`, `/mentoria-profissional`, `/scoreapp`, etc.), `utm_source/medium/campaign text`, `active bool`, `created_at`, `updated_at`.
- URL pública final: `https://gabrielconsultor.com/r/{slug}` ou querystring `?ref={partner_code}` (ver §3).

**`partner_attributions`** — cliques rastreados.
- `id`, `partner_id`, `link_id` (nullable), `partner_code`, `destination`, `session_id`, `ip_hash`, `user_agent`, `referrer`, `created_at`.

**`partner_conversions`** — leads/compras atribuídos.
- `id`, `partner_id`, `partner_code`, `kind text CHECK IN ('lead','purchase')`, `source_table text` (`leads`/`mentees`/`score_profiles`), `source_id uuid`, `amount_cents int` (null p/ lead), `commission_cents int` (calculado no insert = `amount_cents * commission_rate / 100`), `commission_status text DEFAULT 'pending'` (`pending`|`approved`|`paid`|`canceled`), `notes`, `created_at`, `updated_at`.
- UNIQUE `(source_table, source_id)` para idempotência.

**Atribuição em tabelas existentes** — colunas nullable, sem quebrar dados:
- `leads.partner_id uuid`, `leads.partner_code text`
- `mentees.partner_id uuid`, `mentees.partner_code text`
- `score_profiles.partner_id uuid`, `score_profiles.partner_code text`

### 1.4 RLS
- `partners`: manter policy admin. Adicionar policy `SELECT` para o próprio parceiro (`user_id = auth.uid()`).
- `partner_links`: admin ALL; parceiro `SELECT/INSERT/UPDATE` onde `partner_id = (select id from partners where user_id = auth.uid())`.
- `partner_attributions`: admin ALL; parceiro SELECT do próprio. INSERT via edge function (service role) — nunca do cliente, para evitar fraude de clique.
- `partner_conversions`: admin ALL (incl. update de `commission_status`); parceiro SELECT do próprio.
- GRANTs padrão para `authenticated` + `service_role` em todas as novas tabelas.

## 2. Portal do parceiro (`/parceiro`)

Rotas novas em `src/pages/parceiro/`:
- `/parceiro/login` — Supabase auth email/senha (magic link opcional). Após login: se `user_roles.role = 'partner'` e `partners.user_id = uid`, entra; senão erro.
- `/parceiro` (dashboard):
  - KPIs: cliques 7d/30d, leads atribuídos, vendas atribuídas, comissão acumulada (pending/approved/paid).
  - Lista de **meus links** com botão Copiar, editar label/destino, criar novo, ativar/desativar.
  - Tabela de conversões recentes (kind, valor, comissão, status) — somente leitura.
  - Dados do parceiro (nome, email, taxa de comissão) — leitura.
- Layout próprio (não reaproveita AdminLayout). Guard: se `!partner role` → redirect `/parceiro/login`. Se tentar `/admin` → guard admin atual já bloqueia (parceiro não tem role admin).

Componentes reutilizáveis: `KpiCard`, `QuickAction` já existem.

## 3. Rastreio (clique → lead → compra)

### 3.1 Captura do `partner_code`
- Middleware client-side em `App.tsx` (ou hook em Layout público): ao carregar qualquer rota, ler `?ref=CODE` do querystring. Se presente:
  - Salvar em `localStorage.partner_ref = { code, ts }` (TTL 30 dias).
  - Salvar cookie `partner_ref` (para SSR/edge).
  - Chamar edge function `track-partner-click` (fire-and-forget) que valida o code em `partners` e insere `partner_attributions`.
- Rota curta `/r/:slug` (React route): resolve `slug` via edge function → grava clique → `window.location.replace(destination + '?ref=CODE')`.

### 3.2 Propagação para lead/compra
- Ao enviar lead (`useLeadCapture`, `sendBotConversaLead`, forms do `/scoreapp`, checkout Asaas): incluir `partner_code` do localStorage no payload.
- Backend (edge functions e triggers de insert em `leads`/`mentees`/`score_profiles`): resolver `partner_code → partner_id` e preencher colunas. Trigger `AFTER INSERT` em cada tabela cria linha em `partner_conversions` (kind='lead' ou 'purchase' conforme tabela/valor).
- `provision_mentee` já é SECURITY DEFINER: adicionar params `_partner_code`, gravar em `mentees`, e inserir `partner_conversions` kind='purchase' com `amount_cents` do plano.

## 4. Comissão (sem pagamento automático)

- Cálculo no insert de `partner_conversions.commission_cents` = `amount_cents * partners.commission_rate / 100` (default 70%). Feito por trigger `BEFORE INSERT` para garantir consistência.
- Status inicial `pending`. Admin altera manualmente para `approved` (após período de reembolso) → `paid` (quando pagar off-platform).
- Nada de gateway/split agora. Apenas relatório: total `pending`, `approved`, `paid` por parceiro, exportável em CSV do admin.

## 5. Integração com `/admin` (PartnersAdmin)

Adicionar abas dentro de `PartnersAdmin.tsx`:
- **Parceiros** (existente).
- **Testes** (existente).
- **Links** — todos os `partner_links` com filtro por parceiro.
- **Conversões** — tabela de `partner_conversions` com filtro parceiro/status/período, ação "aprovar"/"marcar como pago", exportar CSV.
- No card resumo do parceiro: cliques 30d, conversões, comissão pendente, botão "Vincular usuário" (input email → cria/associa `auth.users` + `user_roles.partner` + `partners.user_id`).

Reaproveitar `KpiCard` e agrupamento visual do cockpit atual.

## 6. Isolamento de acesso

- Guard atual do `/admin` verifica `has_role(uid,'admin')`. Nova role `'partner'` **não** concede admin — nenhum código muda em `Admin.tsx`.
- Portal `/parceiro` tem guard próprio exigindo role `partner`. Admin também pode entrar (útil para suporte), mas não parceiro no admin.
- RLS garante que mesmo com token válido, parceiro só lê linhas próprias.
- Edge functions de vinculação (criar usuário parceiro, alterar `commission_status`) exigem `has_role(admin)`.

## 7. Detalhes técnicos

- Migrations: 1 migration para colunas em `partners`/`leads`/`mentees`/`score_profiles` + role `partner`; outra para as 3 novas tabelas com GRANTs, RLS, triggers de comissão e `updated_at`.
- Edge functions novas: `track-partner-click`, `resolve-partner-link` (para `/r/:slug`), `create-partner-user` (admin), `update-conversion-status` (admin).
- Alterar `provision_mentee` assinatura com `_partner_code` default null (retrocompatível).
- Rota `/r/:slug` no `App.tsx`.
- Novos componentes em `src/components/partner/` e páginas em `src/pages/parceiro/`.

## 8. Fora de escopo desta fase
- Pagamento automático da comissão (split Asaas/Cora).
- Multi-nível/sub-afiliados.
- Materiais de marketing (banners/vídeos) — pode virar tabela `partner_assets` depois.
- Antifraude avançado (dedupe de clique por device fingerprint além de ip_hash+ua).

## Premissas a confirmar
1. Comissão 70% incide sobre valor bruto da compra do plano de mentoria; leads do Score não geram comissão (só tracking). OK?
2. Janela de atribuição: 30 dias no localStorage — confirma?
3. Formato do link: preferir `/r/{slug}` curto ou `?ref={code}` na URL atual? Plano suporta os dois.
4. Login do parceiro: email/senha padrão; magic link só se pedir.
