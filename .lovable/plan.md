## Objetivo
Permitir que o mentorado envie um **link** (Google Drive, Dropbox, OneDrive, qualquer URL) como evidência da tarefa, mantendo também a opção de upload de arquivo já existente.

## Mudanças

### `src/components/portal/TarefasTab.tsx`
- Ao lado do botão "Enviar evidência" adicionar um botão "Colar link".
- Abre um Dialog (shadcn) com um Input de URL + botão Salvar.
- Validação mínima: precisa começar com `http://` ou `https://`. Aceita qualquer domínio.
- Salva a URL direto em `homework_tasks.evidence_url`.
- Quando a evidência atual for um link (`evidence_url` começa com `http`), mostrar um link "abrir" ao lado do badge "enviada"; quando for arquivo do storage, segue como hoje.
- Labels passam a indicar as duas formas: "Enviar arquivo" / "Colar link" e, se já existir, "Substituir".

### Admin
- `MenteesAdmin.tsx` já trata `^https?://` abrindo direto e cai em signed URL para path do bucket. Nada a alterar.

## Reuso da coluna
Continuo usando `homework_tasks.evidence_url` (texto livre). Distinção em runtime:
- começa com `http` → link externo (abre direto)
- caso contrário → path no bucket `mentee-evidence` (signed URL)

Sem migração de banco.

## Fora de escopo
- Não verifico se o link está com permissão pública — só um hint visual no dialog ("garanta que o link esteja acessível").
- Sem preview embutido do arquivo.
