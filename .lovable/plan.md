## Objetivo

Criar uma aba **"Integrações"** completa no painel admin (`/admin`) para gerenciar de forma robusta:

1. **Webhooks de saída (outbound)** — dispara eventos do app pra sistemas externos (BotConversa, Make, n8n, Zapier, CRMs, etc).
2. **Endpoints de entrada (inbound)** — URLs únicas do próprio app pra receber POSTs de sistemas externos.
3. **Chaves de API** — tokens gerados pra terceiros consumirem uma API REST do app.
4. **Logs de entregas** — histórico de disparos, retentativas, resposta HTTP.

Nada de webhook ativo hoje é alterado — a aba passa a ser a fonte de configuração, com fallback nos valores atuais.

---

## Arquitetura

### Tabelas novas (Lovable Cloud)

**`integration_events`** — catálogo de todos os eventos do sistema (seed fixo, admin-read).
- `key` (único, ex: `lead.contato`, `score.daily_checkin`, `mentee.meeting_completed`)
- `label`, `category` (`lead` | `score` | `mentee` | `botconversa` | `custom`)
- `sample_payload` jsonb, `description`

**`integration_webhooks`** — webhooks de saída configurados pelo admin.
- `id`, `name`, `url`, `enabled`, `secret` (opcional, p/ assinatura HMAC)
- `event_keys` text[] (quais eventos assinam esse webhook — N pra N)
- `headers` jsonb (headers customizados)
- `retry_policy` jsonb (`max_attempts`, `backoff_seconds`)
- `timeout_ms`, `created_at`, `updated_at`

**`integration_deliveries`** — log de cada disparo.
- `id`, `webhook_id`, `event_key`, `payload` jsonb
- `attempt`, `status` (`pending`|`success`|`failed`|`retrying`)
- `response_status`, `response_body`, `error`, `duration_ms`
- `created_at`, `next_retry_at`

**`integration_inbound_endpoints`** — URLs de entrada.
- `id`, `slug` (único, compõe a URL pública), `name`, `enabled`
- `secret` (verificação de header `X-Webhook-Secret` ou HMAC)
- `target` (`lead` | `score_event` | `raw_log`) — o que fazer com o payload
- `last_received_at`, `total_received`

**`integration_api_keys`** — chaves p/ terceiros consumirem a API.
- `id`, `name`, `key_prefix` (visível), `key_hash` (bcrypt/sha256, valor cheio só mostrado 1x)
- `scopes` text[] (`leads:read`, `leads:write`, `score:read`, etc)
- `enabled`, `last_used_at`, `expires_at`, `created_at`

Todas: RLS admin-only via `has_role`, GRANTs pra `authenticated` + `service_role`.

### Edge Functions novas

- **`integrations-dispatch`** — chamada quando um evento ocorre. Busca webhooks assinantes ativos, monta payload `{ event, occurred_at, data }`, assina com HMAC-SHA256 (`X-Lovable-Signature`), faz POST paralelo, grava `integration_deliveries`, agenda retry via `pg_cron` se falhar.
- **`integrations-inbound/[slug]`** — recebe POST externo, valida `secret`/HMAC, roteia por `target` (cria lead, log, etc), responde 200.
- **`integrations-api/*`** — API REST pública autenticada por `Authorization: Bearer <api_key>`. Endpoints iniciais: `GET /leads`, `POST /leads`, `GET /score/profiles`, `GET /score/daily-logs`. Valida scopes.

### Helper interno

`src/lib/integrations.ts` → `emitEvent(key, data)` que invoca `integrations-dispatch`. Chamado (sem quebrar nada) nos pontos onde já existe envio pra BotConversa — o webhook do BotConversa vira **um dos assinantes** do evento, não o único caminho.

---

## UI: aba "Integrações" no `/admin`

Novo componente `src/components/admin/IntegrationsAdmin.tsx` com sub-abas:

### 1. Webhooks de Saída
- Lista de webhooks (nome, URL, eventos assinados, status, última entrega)
- Botão **Novo webhook**: form com URL, seleção multi de eventos (do catálogo), headers, secret (gerar/copiar), timeout, política de retry
- Ações: **Editar**, **Testar** (envia sample_payload real), **Ver logs**, **Desativar**, **Excluir**
- Painel de logs por webhook: tabela de deliveries com status, código HTTP, response body, botão **Reenviar**

### 2. Endpoints de Entrada
- Lista com slug, URL completa (copiável), tipo de alvo, contador de recebidos, último recebimento
- Botão **Novo endpoint**: nome, slug, alvo, gerar secret
- Exibe exemplo de `curl` pronto pra colar no sistema externo

### 3. Chaves de API
- Lista com nome, prefixo, scopes, último uso, expiração
- **Gerar nova chave**: mostra o valor completo UMA vez com botão copiar e aviso
- Ações: **Revogar**, **Editar scopes**
- Aba **Documentação**: lista dos endpoints REST disponíveis, exemplos de request

### 4. Catálogo de Eventos
- Read-only. Lista todos os `integration_events` com key, categoria, sample_payload (JSON expansível).
- Serve pra você saber o que pode assinar num webhook.

### 5. Logs Globais
- Feed cronológico de todas as `integration_deliveries` (saída) + recebimentos (entrada) + chamadas API.
- Filtros: por webhook, evento, status, período.

---

## Seed inicial (eventos)

**Leads:** `lead.contato`, `lead.mentoria_1a1_vendedores`, `lead.consultoria_operacional`, `lead.mentoria_estrategica`, `lead.lead_form_dialog`

**Score:** `score.signup`, `score.onboarding_completed`, `score.daily_checkin`, `score.talk_to_gabriel`, `score.assistant_intent`, `score.weekly_diagnostic`, `score.inactive_recovery`, `score.upsell_requested`

**Mentorados:** `mentee.provisioned`, `mentee.meeting_scheduled`, `mentee.meeting_completed`, `mentee.homework_submitted`, `mentee.payment_received`, `mentee.payment_failed`

**BotConversa:** já cria 1 webhook default apontando pra URL atual (`.../catch/195152/eTId4HMCWYmw/`), assinando os eventos que hoje já disparam, **enabled=true** — comportamento idêntico ao de hoje.

---

## Segurança

- RLS admin-only em todas as tabelas de config; `integration_deliveries` também admin-only.
- API keys armazenadas como hash; valor completo só existe no momento da criação.
- Webhooks de saída assinam payload com HMAC-SHA256 usando `secret` (opcional por webhook).
- Endpoints inbound exigem `X-Webhook-Secret` ou assinatura HMAC.
- Rate limit básico por API key (contador em memória do edge function; nota clara na UI de que não é limite forte).
- Segredo global `INTEGRATIONS_DISPATCH_SECRET` gerado via `generate_secret` pra proteger chamadas internas ao dispatcher.

---

## O que NÃO muda nesta entrega

- Formulários existentes continuam chamando o helper atual — adicionamos `emitEvent()` em paralelo, sem remover `sendBotConversaLead`.
- Nenhum edge function ativo tem sua lógica alterada (só ganha 1 linha de `emitEvent`).
- `.env`, secrets do BotConversa, GPT Maker, WhatsApp — nada é tocado.

---

## Entregáveis

1. **Migrations**: 5 tabelas novas + RLS + GRANTs + seed de `integration_events` + seed do webhook default do BotConversa.
2. **Edge functions**: `integrations-dispatch`, `integrations-inbound`, `integrations-api`.
3. **Frontend**: `src/components/admin/IntegrationsAdmin.tsx` (com 5 sub-abas), adição da aba em `src/pages/Admin.tsx`.
4. **Helper**: `src/lib/integrations.ts` + integração nos pontos de emissão existentes (sem alterar comportamento atual).
5. **Cron job**: retry de deliveries falhas (roda a cada 1min via `pg_cron` chamando `integrations-dispatch` com flag `retry_pending`).

## Escopo em fases (se preferir dividir)

- **Fase 1 (MVP):** tabelas + webhooks de saída + catálogo + logs + UI das 2 sub-abas correspondentes. Já resolve o pedido central.
- **Fase 2:** endpoints de entrada.
- **Fase 3:** API keys + endpoints REST + documentação.

Me confirma se quer tudo em uma leva ou fasear (recomendo fasear pela robustez). Quando aprovar, entro em build mode.
