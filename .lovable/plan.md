# Migração WhatsApp: GPT Maker → BotConversa (/scoreapp)

Escopo restrito ao Score Comercial. Nada do dashboard, planos, pagamentos ou cálculo de score é alterado além do necessário para trocar o canal de WhatsApp.

## Estratégia de remoção do GPT Maker

Muitas edge functions e componentes do projeto principal (fora do /scoreapp) ainda usam GPT Maker para campanhas de prospecção comercial do Gabriel (`campaigns`, `send-message`, `whatsapp-inbound`, `gpt-maker-*`, admin de WhatsApp em `/admin`). Essas funcionalidades **não pertencem ao Score Comercial** e removê-las quebraria o módulo de campanhas do admin.

Proposta: **desativar GPT Maker apenas no fluxo do Score Comercial**, não no projeto inteiro. Especificamente:

- Parar de chamar `whatsapp-inbound` / GPT Maker a partir de qualquer código do Score (`whatsapp-daily-checkin`, `whatsapp-inactivity-alerts`, `whatsapp-weekly-report`, `score_whatsapp_messages`).
- Rotear todo WhatsApp do Score via BotConversa.
- Deixar as funções `gpt-maker-*` e `whatsapp-inbound` intactas, pois servem ao módulo de campanhas (que não faz parte do Score).
- Admin do Score ganha aba BotConversa; admin de campanhas antigo continua igual.

Se você quiser remover GPT Maker do projeto inteiro (incluindo campanhas), me diga — é uma segunda fase maior.

## O que será construído

### Backend (edge functions Supabase)
1. **`_shared/botconversa.ts`** — cliente centralizado: `createOrUpdateSubscriber`, `sendTextMessage`, `startFlow`, `setCustomField`, `addTag`, `removeTag`, `getSubscriberByPhone`. Wrappers de alto nível: `sendDailyCheckin`, `sendScoreDiagnosis`, `sendTalkToGabrielFlow`, `sendAssistantFlow`, `syncScoreUser`.
2. **`botconversa-sync-user`** — POST `{user_id}`. Autenticado (JWT do usuário ou admin). Sync + tags + custom fields.
3. **`botconversa-start-onboarding`** — POST `{user_id}`. Sync + startFlow(onboarding). Log.
4. **`botconversa-send-checkin`** — POST `{user_id}`. Valida assinatura + WhatsApp + startFlow(checkin). Log.
5. **`botconversa-webhook`** — endpoint público, protegido por `BOTCONVERSA_WEBHOOK_SECRET` (header `x-webhook-secret` ou query `?secret=`). Roteia por `?event=`:
   - `daily-score` → grava em `score_daily_logs`, recalcula score, retorna diagnóstico.
   - `talk-to-gabriel` → insere em `score_upsell_requests` (origem `botconversa_whatsapp`).
   - `assistant-intent` → grava interação em `score_feedback_interactions`, retorna resposta padrão por intent.
   - Identificação do usuário: telefone (E.164) → email → `botconversa_pending_webhooks`.

### Banco de dados (novas tabelas)
- `botconversa_integration_logs` (id, user_id, phone, direction, event_type, payload jsonb, response jsonb, status, error_message, created_at)
- `botconversa_pending_webhooks` (id, phone, email, payload jsonb, reason, status, created_at, resolved_at)
- Adicionar em `score_profiles`: `botconversa_subscriber_id text`, `daily_checkin_time time default '18:00'`, `whatsapp_opt_in boolean default true`.
- GRANTs + RLS: logs/pendentes só admin lê; profiles usa policies existentes.

### Secrets
- `BOTCONVERSA_API_KEY` (via add_secret — você fornece)
- `BOTCONVERSA_WEBHOOK_SECRET` (generate_secret — 32 chars)
- `BOTCONVERSA_ONBOARDING_FLOW_ID`, `BOTCONVERSA_DAILY_CHECKIN_FLOW_ID`, `BOTCONVERSA_TALK_TO_GABRIEL_FLOW_ID`, `BOTCONVERSA_ASSISTANT_FLOW_ID`, `BOTCONVERSA_DEFAULT_FLOW_ID` (set_secret vazios inicialmente; você preenche os IDs depois de criar os fluxos no BotConversa).
- Base URL fixa no código: `https://backend.botconversa.com.br/api/v1/webhook`.

### Frontend (/scoreapp)
- **PerfilTab** → nova seção "WhatsApp": número, status, seletor de horário (`08:00 / 12:00 / 18:00 / 20:00`), botão "Receber check-in agora", botão "Atualizar meu WhatsApp".
- **Admin (`ScoreAdmin` ou nova aba)** → "Integração BotConversa": lista de usuários sincronizados, últimos logs, webhooks pendentes, botão sincronizar/enviar onboarding/enviar check-in/marcar resolvido.

### Pós-compra (asaas-webhook / cora-webhook)
Após ativar assinatura, chamar `syncScoreUser` + `startFlow(onboarding)` via BotConversa. Não bloquear pagamento se falhar (log em `botconversa_integration_logs`).

### Remoção de referências GPT Maker no Score
- `whatsapp-daily-checkin`, `whatsapp-inactivity-alerts`, `whatsapp-weekly-report`: trocar chamadas GPT Maker por BotConversa (se referenciarem usuários do Score).
- Nenhuma UI do Score menciona GPT Maker hoje (verificar e limpar se houver).

## Detalhes técnicos importantes

- **Documentação BotConversa**: vou consultar `https://backend.botconversa.com.br/swagger/` durante implementação para nomes exatos dos endpoints (`/subscriber/`, `/subscriber/{id}/tags/`, `/subscriber/{id}/send_flow/{flow_id}/`, `/subscriber/{id}/send_message/`, `/subscriber/{id}/custom_fields/`). Auth header: `API-KEY: <key>`.
- **Telefone**: normalização E.164 sem `+` para o BotConversa (padrão da API), reusando `src/lib/phone.ts`.
- **Idempotência**: `createOrUpdateSubscriber` faz GET-by-phone antes de POST; armazena `botconversa_subscriber_id` em `score_profiles`.
- **Logs estruturados** em `botconversa_integration_logs` a cada envio/recebimento.
- **Segurança**: webhook rejeita sem secret; endpoints internos exigem JWT válido; admin actions exigem role `admin`.
- **Scheduler**: fica para depois — hoje só disparo manual e endpoint pronto para cron futuro.

## Perguntas antes de codar

1. **Confirma que devo manter GPT Maker vivo para o módulo de campanhas do admin principal** e desligar só do Score? Ou você quer que eu remova GPT Maker do projeto inteiro (afeta `WhatsAppCampaignsTab`, `send-message`, `whatsapp-inbound`, `gpt-maker-*`, `bot-flow-*`)?
2. **API Key do BotConversa** — você já tem? Vou pedir via `add_secret` quando começar.
3. **Flow IDs** — posso deixar os secrets vazios e você preenche depois? Ou você já tem os IDs prontos?

Assim que responder, começo pelo cliente `botconversa.ts` + migration + secrets + webhook, depois endpoints e UI.
