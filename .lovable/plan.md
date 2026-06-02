## Escopo

Combina o pedido anterior (anotações por mentorado + personalização dos encontros + sinalização no portal) **+** o bug "não adiciona mais de um material".

## 1. Fix do bug "adicionar material"

Investigação: nos logs de rede só vejo GETs em `meeting_resources` — nenhum POST foi disparado. Sinal de que o botão "Adicionar link" não chama o handler na maioria dos cenários (provável: usuário tenta adicionar via URL e o validador silencia, ou o form está cortado fora da viewport e o usuário só vê o upload).

Vou fazer:
- Reorganizar o form de material em **2 modos lado a lado**: "Link" (URL) e "Upload" (arquivo), cada um com botão próprio claro.
- Feedback de erro explícito (`toast.error` com mensagem do Postgres se houver), e log do retorno no `console.error`.
- Remover a checagem boba `if (!activeMeetingId)` que pode passar despercebida — bloquear o botão (`disabled`) com tooltip.
- Após sucesso: refazer o `loadDetail` (já fazia) **e** manter o form aberto pronto para o próximo, sem trocar de aba.

## 2. Anotações privadas do mentor (admin)

- **Nova tabela** `mentee_admin_notes (id, mentee_id unique, content text, updated_at, updated_by)` — RLS exclusiva para admin (SELECT/INSERT/UPDATE/DELETE com `has_role('admin')`). GRANTs para `authenticated` + `service_role`. **Mentorado não vê.**
- Trigger `touch_updated_at` para `updated_at`.
- UI: card "Anotações privadas" no topo do detalhe do mentorado, `Textarea` grande, auto-save com debounce 800ms, label "Salvo às HH:MM".

## 3. Personalização dos próximos encontros (admin)

- Editar título/descrição direto na tabela `meetings` (já existe, RLS admin tem `ALL` via has_role — preciso conferir; hoje há policies de UPDATE só para "Mentee updates own meetings" com OR has_role admin, ok).
- UI: dentro do detalhe do encontro selecionado, botão **"Editar conteúdo"** → troca título e descrição por inputs + textarea → Salvar/Cancelar.
- Edição liberada em qualquer status.

## 4. Sinalização no portal do mentorado

- No topo da aba **Cronograma**, banner curto:
  > "Seu cronograma é adaptado ao longo da jornada. O mentor pode ajustar conteúdo, materiais e tarefas com base na sua evolução."
- Em cada card de encontro cujo título/descrição diverge do template padrão, badge sutil **"Adaptado para você"**.
- Detecção: carregar `meeting_templates` do `plan_id` no `CronogramaTab` e comparar por `sequence`.

## Detalhes técnicos

- **Migração**: `CREATE TABLE mentee_admin_notes` + GRANTs + RLS + trigger.
- **`MenteesAdmin.tsx`**: novo card de Anotações (`AdminNotesCard`), refatorar form de materiais, adicionar modo "Editar conteúdo" no encontro.
- **`CronogramaTab.tsx`** (portal): banner + badge "Adaptado para você" (precisa carregar templates).
- Sem mudança em RLS de `meetings` ou `meeting_resources` (já cobre admin).

## Fora do escopo

- Sem histórico de versões das anotações.
- Sem reordenar/adicionar encontros novos — só editar os 7 existentes.
- Sem notificar mentorado por email quando algo for personalizado.
