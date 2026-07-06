Plano de correção:

1. Instrumentar a entrada real da GPT Maker
- Adicionar log seguro logo após o recebimento da chamada, mostrando apenas chaves do payload e quais campos foram detectados.
- Registrar claramente quando a chamada entra autenticada mas não contém telefone/mensagem no formato esperado.
- Isso elimina o problema atual: a chamada apareceu, mas morreu antes do log principal.

2. Tornar o parser compatível com formatos mais amplos
- Aceitar mensagem em campos como `message.text`, `messages[0].text`, `event.message`, `payload.text`, `lastMessage`, `content.text`, `conversation.message` e equivalentes.
- Aceitar telefone/contato em campos como `contact.phone`, `contact.whatsapp`, `sender.phone`, `from.phone`, `customer.phone`, `chat.contactIdentifier`, `visitor.phone`, `payload.contact` e campos aninhados.
- Tratar arrays de mensagens/contatos, não só objetos simples.

3. Não bloquear a chamada quando faltar telefone, mas houver `chatId`
- Se o payload vier com `chatId` e mensagem, tentar responder pelo chat diretamente.
- Se ainda não houver telefone nem perfil, retornar um erro detalhado nos logs e salvar o payload como diagnóstico, em vez de parecer que “não funcionou”.

4. Corrigir o retorno para a GPT Maker
- Garantir resposta rápida `200` quando a chamada for recebida e registrada, mesmo se o payload vier incompleto.
- Evitar que a GPT Maker desative/retenha o webhook por receber `400/401` em payloads parcialmente diferentes.

5. Validar
- Re-publicar a função.
- Testar com payload JSON parecido com o real.
- Ler os logs novamente e confirmar que a próxima mensagem real mostra: chamada recebida, campos detectados, fluxo disparado ou motivo exato do bloqueio.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>