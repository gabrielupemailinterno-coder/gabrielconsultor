
# Bot conversacional no WhatsApp com editor de fluxograma

Transforma o `whatsapp-inbound` de "parser único" em **motor de fluxo com estado**. A pessoa pode dizer "quero registrar do dia 12/03" (ou "ontem", "anteontem", "hoje") e o bot conduz uma conversa sequencial, pergunta a pergunta, salvando no `score_daily_logs` da data escolhida. Você edita todo o fluxo num canvas visual (React Flow) na aba admin.

## O que muda para o usuário final

```
Usuário: quero registrar de ontem
Bot:     Beleza! Vou registrar seu dia 05/07. Quantas ligações você fez?
Usuário: 25
Bot:     E WhatsApps enviados?
Usuário: 40
Bot:     Reuniões realizadas?
...
Bot:     Registrado ✅ Score do dia 05/07: 72/100 (Bom). Streak: 4 dias 🔥
```

Ou, no meio do fluxo, se colar o formato rotulado completo (`Ligações: 25\nWhatsApps: 40...`), o bot detecta, salva tudo de uma vez e vai direto pro resumo final.

Comandos globais: `cancelar` / `sair` aborta a sessão. Sem timeout — retoma na próxima mensagem enquanto não completar/cancelar.

## Datas aceitas

- **Relativas:** `hoje`, `ontem`, `anteontem`
- **Numéricas:** `12/03`, `12/03/2026`, `12-03` (ano default = atual, se resultar em futuro assume ano anterior)
- **Validação:** máximo 7 dias atrás. Fora disso, bot responde "Só consigo registrar até 7 dias atrás. Qual outra data?"

## Editor visual no admin (nova aba "Fluxo do Bot")

Canvas React Flow com drag-and-drop. Tipos de nó:

| Tipo | O que faz | Config |
|---|---|---|
| **Gatilho** | Frase(s) que iniciam o fluxo. Ex: "registrar", "quero registrar" | Lista de regex |
| **Mensagem** | Envia texto puro (aceita `{{nome}}`, `{{data}}`, `{{campo.X}}`) | Texto |
| **Pergunta** | Envia texto, aguarda resposta, salva em variável de sessão + valida (número, data, texto livre) | Texto, nome da variável, validação, mensagem de erro |
| **Condição** | Ramifica: `if variavel.vendas > 0 → A, else → B` | Expressão simples |
| **Ação** | Efeitos colaterais: `salvar_log`, `zerar_penalidade`, `enviar_score_do_dia` | Tipo + params |
| **Fim** | Encerra sessão, opcionalmente envia mensagem final | Texto opcional |

Recursos do canvas:
- Zoom, pan, minimap.
- Duplo clique no nó abre painel lateral com config.
- Arestas com label (para condições: "sim"/"não").
- Botão "Testar no meu WhatsApp" que simula o fluxo enviando pro seu número.
- Versionamento simples: cada save cria snapshot, "Reverter para versão anterior".
- Toggle **Ativo/Rascunho** por fluxo (só o ativo responde no WhatsApp).

Fluxos vêm com 2 templates pré-populados (você pode editar/desativar):
1. **Registro de hoje** — gatilhos `["registrar", "score de hoje"]`, pergunta os 9 campos em sequência.
2. **Registro de data específica** — gatilho `"registrar do dia"`, pergunta a data primeiro, valida, depois os campos.

## Detalhes técnicos

### Banco de dados (migration)

```sql
-- Fluxos editáveis no admin
CREATE TABLE public.bot_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  triggers jsonb NOT NULL DEFAULT '[]',        -- ["registrar", "quero registrar"]
  graph jsonb NOT NULL,                        -- { nodes: [...], edges: [...] } no formato React Flow
  is_active boolean NOT NULL DEFAULT false,
  priority int NOT NULL DEFAULT 0,             -- ordem de match quando > 1 fluxo bate
  version int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Histórico de versões
CREATE TABLE public.bot_flow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.bot_flows(id) ON DELETE CASCADE,
  version int NOT NULL,
  graph jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

-- Estado da conversa por telefone
CREATE TABLE public.bot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  user_id uuid,
  flow_id uuid REFERENCES public.bot_flows(id) ON DELETE SET NULL,
  current_node_id text,
  variables jsonb NOT NULL DEFAULT '{}',       -- { data: "2026-07-05", ligacoes: 25, ... }
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

Grants + RLS: só admin lê/edita `bot_flows` e versões; `bot_sessions` acessível só via service_role (edge functions).

### Motor de fluxo (`supabase/functions/_shared/bot-engine.ts`)

Função `runFlow({ session, userMessage, context })` que:
1. Lê `current_node_id` da sessão.
2. Se resposta = comando global (`cancelar`), encerra.
3. Se nó atual é "Pergunta", tenta o fallback rotulado (parser existente) antes de aceitar single-field.
4. Valida input conforme tipo (numero, data, texto).
5. Executa ação do nó atual → pega próximo nó pela aresta correspondente.
6. Se próximo é "Mensagem" ou "Pergunta", envia texto (com interpolação).
7. Se "Ação", executa (ex: `upsert score_daily_logs` na data de `variables.data`).
8. Retorna próximas mensagens a enviar.

### Refactor `whatsapp-inbound/index.ts`

- Log inbound (como hoje).
- Localiza perfil.
- Busca `bot_sessions` pelo telefone. Se existir → continua fluxo.
- Se não existir → tenta casar `triggers` de fluxos ativos (por prioridade). Match → cria sessão + roda primeiro nó.
- Se nenhum trigger casar → mantém comportamento atual (parser one-shot) como fallback pra retrocompatibilidade.
- Envia respostas via `sendWhatsApp` + loga em `score_whatsapp_messages` com `kind: "bot_step"`.

### Parser de data (novo helper `_shared/date-parser.ts`)

Função `parseUserDate(text): { date: string, ok: boolean, reason?: string }`:
- Regex para relativas (`hoje|ontem|anteontem`) + `dd/mm(/aaaa)?` + `dd-mm(-aaaa)?`.
- Assume BRT.
- Rejeita datas > 7 dias no passado ou no futuro.

### Frontend — nova aba admin

Arquivos:
- `src/components/admin/BotFlowsAdmin.tsx` — lista de fluxos, botões "Novo", "Editar", "Ativar", "Duplicar", "Excluir", "Testar".
- `src/components/admin/BotFlowEditor.tsx` — canvas React Flow, painel lateral de config do nó selecionado, barra superior com Salvar / Publicar / Reverter versão.
- `src/components/admin/BotFlowNode.tsx` — componentes visuais por tipo de nó (cores + ícones distintos).
- `src/components/admin/BotFlowSidebar.tsx` — form dinâmico conforme tipo do nó.

Instala `reactflow` (`bun add reactflow`).

Integração em `src/pages/Admin.tsx`: adiciona aba "Fluxo do Bot" ao lado da "Ritual WhatsApp".

### Seed dos 2 fluxos padrão

Migration insere via `INSERT` os dois templates prontos (registro de hoje + registro de data específica), com `is_active = true` para o primeiro.

## Ordem de implementação

1. Migration (`bot_flows`, `bot_flow_versions`, `bot_sessions`) + grants + RLS + seed dos 2 fluxos.
2. `bun add reactflow`.
3. Helpers `_shared/bot-engine.ts` + `_shared/date-parser.ts`.
4. Refactor `whatsapp-inbound/index.ts` para usar o motor (mantém fallback do parser atual).
5. UI admin: `BotFlowsAdmin` + `BotFlowEditor` + nós customizados + botão de teste.
6. Endpoint `bot-flow-test` (nova edge function): dispara execução simulada pro número do admin.
7. Testes ponta-a-ponta via `curl_edge_functions`: "quero registrar de ontem" → fluxo completo → linha em `score_daily_logs` com data D-1.

## O que fica de fora (posso adicionar se pedir)

- Botões interativos nativos do WhatsApp (depende de template HSM aprovado).
- Fluxos com envio agendado a partir de nó (hoje só os crons já existentes disparam).
- A/B testing entre versões de fluxo.
- Analytics por nó (taxa de abandono em cada pergunta).

