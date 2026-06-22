## O que mudar

Hoje o portal do mentorado tem um botão "Agendar reunião" que abre um modal pedindo data/hora e dispara a edge function `schedule-meeting` (que cria evento no Calendar + Meet).

Você quer que o agendamento aconteça **direto na sua página pública do Google Agenda** (https://calendar.app.google/ZAXUC21NXxJqNAuDA), onde o mentorado escolhe um horário livre na sua agenda real.

## Mudanças

### 1. Portal do mentorado — `src/components/portal/CronogramaTab.tsx`
- Trocar o botão "Agendar reunião" por **"Agendar no Google Agenda"** que abre `https://calendar.app.google/ZAXUC21NXxJqNAuDA` em nova aba.
- Remover o modal de data/hora e a chamada à edge function `schedule-meeting` no fluxo do mentorado.
- Remover o botão "Enviar agenda no Drive" que adicionei por engano na resposta anterior.
- Manter "Entrar no Meet" e "Marcar concluído" quando o encontro já estiver agendado.

### 2. Confirmar o agendamento no portal
Como o agendamento agora acontece fora do app, o mentorado precisa de uma forma de "avisar" que marcou — senão o card fica eternamente como "Disponível" e ninguém vê data/Meet.

Proponho: depois de clicar em "Agendar no Google Agenda", aparece um segundo botão **"Já agendei — confirmar data"** que abre um pequeno modal pedindo data/hora + link do Meet (colado do convite que o Google manda). Isso grava em `meetings.scheduled_at` e `meet_link` e marca como `scheduled`.

### 3. Admin
No `MenteesAdmin`, manter como está — você já vê `scheduled_at` e `meet_link` no painel quando o mentorado confirmar.

### 4. Limpeza
- A edge function `schedule-meeting` deixa de ser chamada pelo mentorado. Posso mantê-la deployada (caso queira usar no admin no futuro) ou removê-la. Sugiro **manter** por enquanto.
- A edge function `meeting-to-drive` que criei na resposta anterior pode ser **removida** (não era o que você queria).

## Pergunta antes de implementar

O fluxo "Já agendei — confirmar data" (item 2) faz sentido? Ou você prefere:
- **(a)** Só o botão de link, sem confirmação no portal (você atualiza manualmente como admin), ou
- **(b)** O botão + o modal de confirmação (proposta acima), ou
- **(c)** Outra coisa?
