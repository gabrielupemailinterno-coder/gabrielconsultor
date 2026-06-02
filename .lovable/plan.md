## O que muda

Hoje o "modo admin" está enxertado dentro do portal do próprio mentorado (form de upload aparece dentro da aba Repositório quando você loga). Vou separar: **você gerencia tudo a partir do seu admin**, e o mentorado só **recebe** o que está liberado para o encontro atual dele.

## 1. Novo painel admin de mentorados (`/admin` → aba "Mentorados")

Adicionar uma aba "Mentorados" em `src/pages/Admin.tsx` ao lado de Leads/Blog. Layout:

```text
┌─ Mentorados ──────────────────────────────────────────┐
│ [busca por nome/email]                                │
│                                                       │
│ Lista (esquerda)         │ Detalhe (direita)          │
│ • João Silva  ▸ 3/6      │ Cronograma do mentorado    │
│ • Maria Souza ▸ 1/6      │  [encontro 1 ✓] [2 ▶] ...  │
│ • ...                    │                            │
│                          │ Tarefas do encontro X      │
│                          │  + adicionar tarefa extra  │
│                          │                            │
│                          │ Materiais do encontro X    │
│                          │  + adicionar material      │
│                          │  (URL ou upload PDF)       │
└───────────────────────────────────────────────────────┘
```

O que dá pra fazer pelo detalhe de cada mentorado:
- Ver status de cada encontro, marcar manualmente como concluído/desbloquear próximo
- Adicionar **tarefa extra** (`homework_tasks`) ligada a um encontro específico
- Adicionar **material extra** (`meeting_resources`) ligado a um encontro específico — link ou upload (bucket `mentee-evidence`)
- Remover qualquer material/tarefa que você mesmo criou

Tudo isso já é permitido pelas RLS atuais (admin tem `ALL` em meetings/resources/homework).

## 2. Liberação progressiva no portal do mentorado

Hoje a aba **Tarefas** mostra tudo de uma vez, e o **Repositório** mostra todos os materiais. Vou trancar pela mesma regra do Cronograma (`meeting.status`):

- **Tarefas**: só aparecem tarefas de encontros com status `available`, `scheduled` ou `completed`. Encontro `blocked` = tarefas escondidas.
- **Repositório**: mesmo filtro — material de encontro `blocked` não aparece (já é o caso hoje, mas vou reforçar).
- Quando o encontro fica `completed`, libera o próximo automaticamente (lógica já existe em `markCompleted`).

O livro SPIN Selling continua aparecendo em todos os encontros que já estão liberados, então o mentorado tem o livro desde o Onboarding e vai vendo materiais/tarefas extras conforme avança.

## 3. Remover o painel admin de dentro do portal

Tirar de `RepositorioTab.tsx` o formulário de "adicionar material" e o botão de deletar — o portal volta a ser **só leitura** para o mentorado. Você gerencia tudo do `/admin`.

## Detalhes técnicos

- Novo componente `src/components/admin/MenteesAdmin.tsx` com lista de mentorados (join `mentees` + `mentorship_plans` + count de meetings completed) e detalhe (meetings + homework_tasks + meeting_resources do mentorado selecionado).
- Form de adicionar material: select de encontro, tipo (pdf/video/link), título, URL **ou** upload pro bucket `mentee-evidence` (caminho `admin/{mentee_id}/{filename}`, depois insere o `publicUrl` ou um signed URL em `meeting_resources`).
- Form de adicionar tarefa extra: select de encontro + título + descrição → insert em `homework_tasks` com `mentee_id` e `meeting_id`.
- `TarefasTab.tsx`: query passa a filtrar `meeting.status != 'blocked'` (join via `meetings`).
- `RepositorioTab.tsx`: remover estado `isAdmin`, formulário, handlers de add/delete.
- Sem migração de schema necessária — só código.

## Fora do escopo

- Não vou criar templates "por segmento" automáticos — material extra continua manual via seu admin.
- Não vou mexer no fluxo de agendamento (Google Meet) nem em métricas.
