# Plano: corrigir fluxo de mensagens do bot + guia definitivo de configuração da GPT Maker

Vou atacar em duas frentes: (1) endurecer o `whatsapp-inbound` e o envio de mensagens para que o bot **sempre responda de acordo com o fluxo desenhado no editor**, sem depender de comportamentos frágeis da GPT Maker; (2) te entregar um passo‑a‑passo do que precisa estar configurado no painel da GPT Maker para eliminar os erros recorrentes (500 do agente, mensagens seguintes que não chegam ao webhook, respostas duplicadas do agente, etc.).

## 1. Correções no código (backend / edge functions)

### 1.1 `supabase/functions/_shared/gpt-maker.ts` — envio robusto
- Trocar o endpoint atual (`/v2/channel/{channelId}/start-conversation`) por uma estratégia em 2 passos, que é a que realmente entrega em conversa já aberta:
  1. `POST /v2/channel/{channelId}/start-chat` com `{ contactIdentifier: phone }` para obter/abrir o `chatId`.
  2. `POST /v2/chat/{chatId}/send-message` com `{ message }`.
- Fallback automático para `start-conversation` se `start-chat` não existir para o plano.
- Retry com backoff exponencial (3 tentativas: 0ms, 500ms, 1500ms) em `HTTP 429/500/502/503/504`.
- Timeout de 15s por request (`AbortController`) para não travar o webhook.
- Log estruturado em `score_whatsapp_messages.error` com `status`, `attempt`, `endpoint` para diagnóstico.

### 1.2 `whatsapp-inbound/index.ts` — respostas 100% guiadas pelo fluxo
- **Idempotência**: usar `body.message?.id`/`body.data?.id` para deduplicar callbacks repetidos da GPT Maker (tabela `score_whatsapp_messages` já registra tudo — adicionar índice único parcial em `payload->>'message_id'` para janela de 5 min).
- **Ordem de resolução** (garantir que fluxo sempre vence sobre parser antigo):
  1. Cancelamento global.
  2. Sessão ativa → `continueSession`.
  3. Match de gatilho contra `bot_flows.is_active=true`.
  4. Fallback ao parser one-shot **somente** se não houver nenhum fluxo com gatilho aplicável (hoje já é assim, mas vou trancar com log claro).
- **Silenciar o agente da GPT Maker durante a sessão**: quando abrimos/continuamos uma sessão, marcar o chat como `humanTalk=true` via `POST /v2/chat/{chatId}/start-human` antes de responder. Quando o fluxo termina (`session=null`), chamar `POST /v2/chat/{chatId}/stop-human` para devolver ao agente. Isso resolve de forma definitiva o problema de o agente responder por cima do bot e o 500 do toggle global.
- **Envio sequencial com pequeno delay** (300 ms) entre mensagens do mesmo step para evitar entrega fora de ordem no WhatsApp.
- **Sanitização do telefone de saída**: usar o mesmo `phone` que a GPT Maker entregou no callback (respeitando 9º dígito) em vez de renormalizar — evita "chat não encontrado".

### 1.3 `gpt-maker-agent-toggle/index.ts` — deixar de ser fonte de erro
- Como o silenciamento agora é **por chat** (start-human/stop-human), o toggle global do agente deixa de ser necessário para o funcionamento do bot. A função vira opcional/administrativa e sempre retorna `200 { noop:true }` quando o estado já bate — o 500 upstream deixa de aparecer no fluxo do usuário.

### 1.4 `bot-flow-selftest` e `bot-flow-test`
- Passar a usar o mesmo caminho de envio (`sendWhatsApp` novo) e reportar erros reais retornados pela GPT Maker, com `chatId` incluso no diagnóstico.

## 2. Guia de configuração da GPT Maker (o que fazer no painel)

Faça exatamente isso para o agente `3F4ED951E2F73066C9F166193CE5E1BA` (Score Comercial) e para cada canal que quiser plugar:

**A. Canal (WhatsApp)**
1. Painel → Canais → abra o canal do WhatsApp.
2. Copie o `channelId` e cole em Admin → WhatsApp → Settings → Channel ID.
3. Em "Webhook de mensagens recebidas", coloque:
   `https://xhzsdnbztsnupbukmdjg.supabase.co/functions/v1/whatsapp-inbound?token=SEU_GPT_MAKER_WEBHOOK_TOKEN`
   Eventos: **onNewMessage** (obrigatório) e **onHumanTalk** (opcional).
4. Marque "Enviar payload completo" (para termos `message.id`, `chat.id`, `contact.phone`).

**B. Agente**
1. Deixe o agente **ativo** (não desative pelo toggle — a nova arquitetura silencia por chat).
2. Em "Instruções/Prompt", adicione no topo: *"Nunca responda automaticamente. As respostas são geradas por um sistema externo. Se receber uma mensagem, apenas aguarde."* — isso é um segundo cinto de segurança caso o start-human falhe.
3. Em "Ferramentas/Integrations", **desligue** qualquer auto-resposta, quick-reply e fluxos nativos da GPT Maker que estejam ligados a esse agente.
4. Em "Handoff humano": ative e configure para **não** enviar mensagem automática ao entrar/sair de humano (evita o "um atendente vai falar com você" atrapalhando o fluxo).

**C. API / Token**
1. Painel → Configurações → API → gere um token com permissões: `channel:read`, `chat:read`, `chat:write`, `chat:human`, `message:send`, `agent:read`.
2. Esse token vai em `GPT_MAKER_API_TOKEN` (já configurado).
3. Gere um token separado para o webhook e coloque em `GPT_MAKER_WEBHOOK_TOKEN` — é ele que valida o header `X-Webhook-Token`.

**D. Números / contatos**
- Cadastre o contato de teste com DDI + DDD + 9 dígitos (ex.: 5511987654321). O código já tolera as duas variantes brasileiras (com/sem 9º dígito), mas manter padrão evita duplicação de chat no painel.

**E. Verificação**
1. Admin → WhatsApp → botão "Rodar auto-teste": deve exibir `matched flow=Teste, trigger=oi tudo bem, replies=N` sem erro.
2. No WhatsApp real, envie "Oi tudo bem?" — deve receber a primeira pergunta do fluxo "Teste" em até 3s, e a sessão aparece em `bot_sessions`.
3. Se algo falhar, checar `score_whatsapp_messages` (kind = `inbound`/`bot_step`/`invalid_payload`) — os logs agora carregam status/endpoint.

## Detalhes técnicos

Arquivos que serão modificados:
- `supabase/functions/_shared/gpt-maker.ts` — novo `sendWhatsApp` em 2 passos + retry + timeout, mais helpers `startHuman(chatId)`, `stopHuman(chatId)`, `resolveChatId(channelId, phone)`.
- `supabase/functions/whatsapp-inbound/index.ts` — dedup por `message_id`, uso do `chatId` do payload quando presente, chamadas `startHuman`/`stopHuman`, envio sequencial com delay, logs mais ricos.
- `supabase/functions/gpt-maker-agent-toggle/index.ts` — simplificar para no-op tolerante (nunca propaga 500 upstream para o UI).
- `supabase/functions/bot-flow-selftest/index.ts` e `bot-flow-test/index.ts` — reportar `chatId`/`endpoint`/`status` reais.

Sem mudanças de schema. Sem mudanças de UI além de leitura dos novos campos de diagnóstico já expostos.

## Fora de escopo

- Reescrever o editor de fluxos.
- Trocar provedor (segue GPT Maker).
- Alterar RLS/policies das tabelas envolvidas.
