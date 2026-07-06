## Objetivo

Fechar o ciclo do WhatsApp: garantir que a GPT Maker entregue todas as mensagens ao nosso webhook e que o fluxo local continue a conversa até o fim, com botões no admin para configurar e testar sem depender de ajustes manuais toda hora.

## O que muda no admin (WhatsApp → Configurações)

1. **Novo botão "Configurar tudo automaticamente"**
   - Reativa o agente na GPT Maker.
   - Reconfigura o webhook `onNewMessage` para apontar para a função correta, preservando outros webhooks já existentes.
   - Mostra o resultado na tela: agente ativo (sim/não), webhook conectado (sim/não), URL configurada.

2. **Novo botão "Diagnosticar"**
   - Verifica e mostra em uma lista de checks:
     - `agent_id` salvo,
     - `channel_id` salvo,
     - agente ativo na GPT Maker,
     - webhook `onNewMessage` apontando para o endereço certo,
     - se chegou alguma mensagem no webhook nas últimas 24h.
   - Cada item aparece verde (ok) ou vermelho (com o que fazer).

3. **Novo botão "Testar fluxo agora"**
   - Simula uma mensagem `registrar` chegando no webhook usando seu telefone/e-mail cadastrado.
   - Mostra na tela: qual fluxo casou, qual foi a primeira resposta, se a sessão ficou aberta.
   - Não precisa mandar zap de verdade.

4. **Bloco "Prompt de silêncio"**
   - Caixa com o texto pronto do prompt de silêncio e um botão "Copiar".
   - Instrução curta: cole no treinamento do agente na GPT Maker.

5. **Remover o checkbox "Modo somente webhook"**
   - Ele confundia porque desligava o agente e travava as mensagens seguintes.
   - No lugar, um aviso curto explicando: agente fica ativo, o silêncio é feito pelo prompt.

## O que muda no backend

1. **Webhook `whatsapp-inbound` mais tolerante**
   - Aceita mais formatos de payload que a GPT Maker envia (texto, telefone e e-mail em campos aninhados).
   - Se o payload não bater com nenhum formato, registra o motivo em `score_whatsapp_messages` para diagnóstico.

2. **Continuação de sessão mais robusta**
   - Se existir sessão ativa para o telefone, sempre continua o fluxo em vez de tentar casar gatilho de novo.
   - Se a sessão apontar para fluxo apagado/inativo, limpa a sessão e responde pedindo para começar de novo.

3. **Nova função de teste `bot-flow-selftest`**
   - Recebe um telefone/e-mail e uma mensagem e roda o mesmo caminho do webhook real.
   - Retorna passo a passo para o admin.

4. **Ajuste em `gpt-maker-webhook-setup` e `gpt-maker-agent-toggle`**
   - Ao acionar "Configurar tudo automaticamente", executa os dois em sequência e devolve status consolidado.

## O que continua sendo manual (só você consegue fazer)

- Colar o prompt de silêncio no treinamento do agente na GPT Maker.
- Deixar o agente ATIVO na GPT Maker.

Tudo o resto passa a ser botão no admin.

## Como você vai usar depois

1. Cola o prompt de silêncio no agente na GPT Maker.
2. No admin, clica em **Configurar tudo automaticamente**.
3. Clica em **Diagnosticar** — precisa aparecer tudo verde.
4. Clica em **Testar fluxo agora** — precisa mostrar o fluxo iniciando.
5. Manda `registrar` no seu WhatsApp real para confirmar.

## Resultado esperado

- Primeira mensagem chega no webhook.
- Mensagens seguintes também chegam.
- Fluxo local conduz a conversa até o fim.
- Agente da GPT Maker fica calado por causa do prompt.
- Quando algo quebrar de novo, o botão **Diagnosticar** aponta exatamente onde está o problema, sem precisar me chamar pra investigar do zero.