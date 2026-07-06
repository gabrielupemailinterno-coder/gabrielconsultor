
## Objetivo

Garantir que **só o nosso fluxo** (edge function `whatsapp-inbound`) responda mensagens do WhatsApp. O agente da GPT Maker fica desligado — não precisa treinamento nenhum, não vai gerar resposta de IA, não vai duplicar mensagem.

## Como funciona depois do plano

1. Mensagem chega no WhatsApp conectado ao canal GPT Maker.
2. GPT Maker dispara `onNewMessage` → nosso `whatsapp-inbound`.
3. Nosso motor de fluxo casa o gatilho, faz as perguntas, salva o score, responde via `sendWhatsApp` (que usa o mesmo canal GPT Maker pra mandar de volta).
4. O agente da GPT Maker **não participa** da conversa — nem responde por conta própria, nem consome créditos de IA.

## O que muda no código

### 1. Nova edge function `gpt-maker-agent-toggle`
- `GET`: retorna se o agente está ativo (`GET /v2/agent/{agentId}` → campo `isActive`).
- `POST { active: false }`: chama `POST /v2/agent/{agentId}/inactive` (rota "Inativar agente" da GPT Maker).
- `POST { active: true }`: chama `POST /v2/agent/{agentId}/active` (caso queira reativar depois).
- Autenticação: só admin (mesma checagem que já usamos em `gpt-maker-webhook-setup`).

### 2. Card no painel `WhatsAppSettingsTab.tsx`
Novo bloco **"Estado do agente"** logo abaixo do card "Webhook de entrada":

- Mostra status atual: `Ativo` / `Inativo`.
- Botão **"Desligar agente"** (destaque destrutivo) — chama a função acima com `active: false`.
- Botão **"Reativar"** aparece só se estiver inativo.
- Texto curto explicando: *"Com o agente desligado, apenas o fluxo do bot responde. Recomendado."*

### 3. Documentação inline
Um aviso no topo da aba deixando claro que essa integração é "webhook-driven", não "agent-driven" — o usuário não precisa treinar nada na GPT Maker.

## Passo a passo depois do plano estar aplicado

1. Em Admin → WhatsApp → Configurações:
   - **Configurar webhook automaticamente** (já feito).
   - **Desligar agente** (novo botão).
2. Enviar `"quero registrar de ontem"` do seu WhatsApp.
3. Só o nosso fluxo responde, sem duplicação.

## O que fica de fora deste plano

- Modo "fallback conversacional" (agente responde perguntas soltas fora do fluxo) — não é necessário agora.
- Modo "silenciar durante fluxo" via API `start-human` / `stop-human` — mais complexo e desnecessário se o agente já fica inativo.
- Treinamento do agente na GPT Maker — **não precisa** neste modelo. Pode deixar o agente vazio.

## Detalhes técnicos

Endpoints GPT Maker usados:
- `GET  https://api.gptmaker.ai/v2/agent/{agentId}` — status.
- `POST https://api.gptmaker.ai/v2/agent/{agentId}/inactive` — desligar.
- `POST https://api.gptmaker.ai/v2/agent/{agentId}/active` — religar.

Todos usam `Authorization: Bearer $GPT_MAKER_API_TOKEN` (secret já existente).

`agent_id` já está salvo em `public.settings.agent_id` (mesmo campo usado pelo `gpt-maker-webhook-setup`).
