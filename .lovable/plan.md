## Diagnóstico

Token funciona via curl externo (200 OK, retorna workspace/canal/agente) mas a edge function recebe 403. Como o secret foi atualizado mas o runtime das functions pode estar usando snapshot antigo, vou forçar redeploy + testar.

## Passos

1. **Redeploy** das 4 functions (`send-message`, `dispatch-scheduled`, `gpt-maker-discover`, `gpt-maker-chats`) para garantir releitura do `GPT_MAKER_API_TOKEN`.
2. **Testar** `gpt-maker-discover` via curl interno.
3. **Se ainda 403**: adicionar log temporário em `gpt-maker-discover` mostrando apenas `tokenLength` e `tokenPrefix` (4 primeiros chars) — sem expor o valor — para confirmar que o secret chegou no runtime e bater com o token que funcionou no curl. Redeploy + teste de novo.
4. **Se ok**: remover o log e seguir.

Sem mudanças de UI ou schema.