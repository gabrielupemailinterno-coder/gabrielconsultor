## 1. Botão flutuante do WhatsApp

Novo componente `src/components/WhatsAppFloatButton.tsx`:
- FAB fixo `bottom-6 right-6`, círculo verde (#25D366), ícone WhatsApp (lucide `MessageCircle` ou SVG).
- Link `https://wa.me/5532920005961?text=Olá%20Gabriel...` em nova aba.
- Tooltip "Fale comigo no WhatsApp" no hover.
- Animação sutil de pulse.
- Acessível (`aria-label`, foco visível).

Montagem em `src/App.tsx`: renderizar uma vez no nível do app, condicional — esconder quando rota começar com `/admin`. Aparece em site público + portal do mentorado.

## 2. Integração GPT Maker (Disparador)

### 2.1 Secret
Pedirei `GPT_MAKER_API_TOKEN` via `add_secret` quando você confirmar — antes disso, te oriento onde gerar no painel GPT Maker.

### 2.2 Migration (banco)
Criar exatamente as tabelas da doc, com RLS + GRANTs:
- `settings` (1 linha por user_id: channel_id, agent_id, optout_text, delay_seconds, batch_limit)
- `campaigns` (name, message, status, kind, destination_type, group_id, contadores, add_optout)
- `campaign_steps` (sequência agendada — index parcial em `scheduled_at WHERE status='pending'`)
- `contacts` (phone_e164, name, empresa, status, error_message)
- `campaign_logs` (auditoria)
- `blocklist` e `optouts` (LGPD)
- Trigger `update_updated_at_column` nas 4 principais.
- Habilitar `pg_cron` e `pg_net`.

Políticas: todas escopadas por `auth.uid() = user_id` (admin acessa porque ele é o user_id dono das campanhas). Sem grant para `anon`.

### 2.3 Edge Functions (4)
Copiadas da sua doc, em `supabase/functions/<name>/index.ts`:
1. **`send-message`** — envia 1 msg para 1 contato (valida JWT do usuário admin).
2. **`dispatch-scheduled`** — cron worker, processa steps pendentes (sem JWT, service-role).
3. **`gpt-maker-discover`** — lista workspaces/channels/agents (autenticada).
4. **`gpt-maker-chats`** — lista chats/grupos com filtro.

CORS padrão Lovable em todas. Substituições de variáveis `{{nome}}`, `{{telefone}}`, `{{empresa}}`.

### 2.4 Cron job
Após deploy + você me passar OK, executo via `supabase--insert` o `cron.schedule('dispatch-scheduled-every-minute', '* * * * *', ...)` apontando para a edge function do projeto.

### 2.5 UI no Admin
Nova aba **"WhatsApp"** dentro de `src/pages/Admin.tsx` com sub-páginas/tabs:

**a) Configurações** (`SettingsTab`)
- Form: `channel_id`, `agent_id`, `optout_text`, `delay_seconds`, `batch_limit`, toggle `add_to_agent_context`.
- Botão "Descobrir IDs" → chama `gpt-maker-discover`, mostra dropdown de channels/agents disponíveis para selecionar.
- Salva em `public.settings`.

**b) Campanhas** (`CampaignsTab`)
- Lista de campanhas (status, total, enviados, erros, ações pausar/cancelar).
- Botão "Nova campanha" → dialog com:
  - Nome, tipo de destino (lista de contatos | grupo).
  - Se lista: textarea para colar telefones (1 por linha, formato livre — normaliza para E.164 +55) com nome/empresa opcional via CSV simples `+5511...,Nome,Empresa`.
  - Se grupo: input do `chatId` (com helper "Buscar grupos" chamando `gpt-maker-chats`).
  - Editor da mensagem (com chips das variáveis disponíveis).
  - Toggle "Adicionar opt-out".
  - Modo: **Envio único** (cria campanha + dispara `send-message` imediato para cada contato) ou **Sequência agendada** (adicionar N passos com data/hora).
- Detalhe da campanha: lista de contatos com status + logs em tempo real (Realtime).

**c) Sequências (passos)**
- Integrada ao detalhe da campanha: tabela de `campaign_steps` com `scheduled_at`, mensagem, status. Pode adicionar/remover passos pending.

**d) Logs/Histórico** (`LogsTab`)
- Tabela paginada de `campaign_logs` filtrável por campanha/status.

**e) Blocklist & Opt-outs** (`ComplianceTab`)
- CRUD simples de telefones bloqueados e visualização de opt-outs.

### 2.6 Onboarding automático de mentorado (bônus, opcional — confirmo antes)
**Não incluído nesta entrega** — você pediu "completo: UI admin para criar campanhas". O fluxo automático ao criar mentorado fica para próxima iteração, se quiser.

## 3. Detalhes técnicos

- **Normalização de telefone**: helper `normalizeBR(phone)` aplica `+55` se faltar, remove caracteres não numéricos antes.
- **Realtime**: assinar `campaigns`, `contacts`, `campaign_logs` filtrado por `user_id` para feedback ao vivo.
- **Validação**: bloquear envio se `settings.channel_id` vazio (alerta na UI).
- **Verificação LGPD**: antes de inserir contatos, fazer LEFT JOIN com `blocklist`/`optouts` e marcar/pular automaticamente.
- **Estilo**: seguir paleta oficial já no projeto (grafite/laranja), shadcn `Card`/`Tabs`/`Dialog`/`Table`.

## 4. Ordem de execução

```text
1. add_secret GPT_MAKER_API_TOKEN
2. Migration (tabelas + RLS + triggers + extensions)
3. Botão flutuante WhatsApp + montagem no App
4. 4 edge functions
5. UI admin (Settings → Campaigns → Detail → Logs → Compliance)
6. Cron schedule (via supabase--insert após você me dar OK)
7. Teste: descobrir IDs, configurar settings, enviar 1 mensagem real
```

## 5. Fora de escopo

- Webhook de respostas (capturar "SAIR" automaticamente) — pode ser próxima fase.
- Onboarding automático ao criar mentorado.
- Templates pré-prontos de sequência.
- Métricas/dashboards de engajamento.