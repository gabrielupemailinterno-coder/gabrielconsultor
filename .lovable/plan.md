
# Ritual diário no WhatsApp (Score Comercial)

Transforma a plataforma de "dashboard passivo" em rotina: o bot puxa o registro todo dia às 18h, entende a resposta do usuário, atualiza o Score, cobra quem sumiu e manda diagnóstico semanal na segunda.

## Fluxo do usuário

```
18:00 seg-sáb  → "Bora fechar seu score de hoje?" (com botões e formato)
Usuário responde texto livre OU "Ligações: 20, Reuniões: 3..."
                ↓
      Parser entende → grava em score_daily_logs → responde com o score do dia
                ↓
10:00 diariamente → varre inatividade:
    2 dias sem registro → cutucada leve
    5 dias sem registro → mensagem forte + CTA
   10 dias sem registro → aviso de queda de Score + penalidade aplicada
                ↓
Seg 08:00 → diagnóstico semanal (atividades, conversão, gargalo, aula, CTA mentoria)
```

## Novas edge functions

1. **`whatsapp-daily-checkin`** (cron 18:00 BRT, seg–sáb)
   - Para cada `score_profiles` com `phone` e `whatsapp_opt_in=true` e sem log hoje: envia mensagem de check-in via GPT Maker (mesmo `channel_id` do admin).
   - Grava em nova tabela `score_whatsapp_messages` (direction=out, kind=checkin).

2. **`whatsapp-inbound`** (webhook público que o usuário cola no GPT Maker)
   - Recebe `{ phone, message, chatId }`.
   - Identifica `score_profiles` pelo telefone normalizado.
   - Parser tenta 3 caminhos em ordem:
     1. Regex de linhas rotuladas (`Ligações: 20`, `Reuniões: 3`, aceita variações/acento/case).
     2. Fallback: sequência de números na ordem canônica (Ligações, WhatsApps, Reuniões, Apresentações, Propostas, Vendas, Valor).
     3. Se falhar: responde pedindo o formato + link mágico para `/scoreapp/registrar`.
   - Sucesso: `upsert` em `score_daily_logs` da data de hoje (BRT), calcula `computeDayScore` e responde: *"Score de hoje: 78/100 (Bom). Streak: 5 dias 🔥"*.

3. **`whatsapp-inactivity-alerts`** (cron 10:00 BRT, diário)
   - Calcula `dias_sem_registro` por perfil. Dispara nos limites 2, 5, 10.
   - Aos 10 dias, marca `score_profiles.inactivity_penalty_days` e o cálculo do Score global aplica -X pts (visível na home).
   - Deduplica por dia via `score_whatsapp_messages` (não manda o mesmo alerta 2x no mesmo ciclo).

4. **`whatsapp-weekly-report`** (cron seg 08:00 BRT)
   - Roda por perfil ativo: agrega últimos 7 dias, calcula conversões, identifica maior gargalo (reusa `evaluateTriggers` de `src/lib/scoreapp/recommendations.ts`), monta texto e envia.

## Mudanças no schema

Migration cria:

- `score_whatsapp_messages` (id, user_id, phone, direction in|out, kind checkin|alert|weekly|inbound|reply, payload jsonb, sent_at, error). Serve de log + deduplicação.
- `score_profiles.whatsapp_opt_in boolean default true`
- `score_profiles.whatsapp_last_checkin_at timestamptz`
- `score_profiles.inactivity_penalty_days int default 0`

Grants + RLS: usuário lê só as suas mensagens; service_role escreve tudo.

## Agendamentos (pg_cron + pg_net)

Três jobs em BRT (America/Sao_Paulo, cron em UTC):
- `whatsapp-daily-checkin` → `0 21 * * 1-6` (18h BRT seg–sáb)
- `whatsapp-inactivity-alerts` → `0 13 * * *` (10h BRT)
- `whatsapp-weekly-report` → `0 11 * * 1` (8h BRT segunda)

Inseridos via `supabase--insert` (não migration) porque incluem o service-role bearer.

## Streak e penalidade

- Novo helper `computeStreak(userId)` em `src/lib/scoreapp/streak.ts`: conta dias consecutivos com log até hoje.
- Home (`Dashboard.tsx`) ganha bloco compacto: "🔥 Streak: N dias" + aviso quando `inactivity_penalty_days > 0`.
- `computeOverallScore` passa a subtrair `min(20, penalty_days * 2)` pts quando houver penalidade.

## Admin / configuração

- Em `src/pages/Admin.tsx` → nova aba **"WhatsApp Ritual"** com:
  - URL do webhook para colar no GPT Maker: `https://<project>.functions.supabase.co/whatsapp-inbound`
  - Toggle master (liga/desliga todos os disparos).
  - Editor dos 4 templates de mensagem (check-in, alerta 2d, alerta 5d, alerta 10d, semanal). Guardados em `settings` (jsonb `whatsapp_templates`).
  - Botão "Enviar teste para o meu número".

- Em `src/pages/scoreapp/Configuracoes.tsx` (ou perfil): toggle **"Receber check-in diário no WhatsApp"** que grava `whatsapp_opt_in`.

## Parser — regras de robustez

- Normaliza telefone com `phone_e164` (mesma função já usada em contacts).
- Aceita apelidos: `ligações|calls|call`, `whats|whatsapps|zap`, `reunião|reuniao|meeting`, `apresentação|apresentacao|pitch|demo`, `proposta|propostas|orçamento`, `venda|vendas|fechei`, `valor|faturamento|R$`.
- `Valor` aceita `R$ 12.500,00`, `12500`, `12k`.
- Se só vier número solto (ex.: "vendi 2 hoje"), pergunta 1x pelo formato completo antes de gravar.
- Idempotente: dois envios no mesmo dia fazem `upsert` (sobrescreve).

## Detalhes técnicos

- Reaproveita helper `sendToPhone` extraído para `supabase/functions/_shared/gpt-maker.ts` (usado por `send-message`, `dispatch-scheduled` e as 4 novas funções).
- `whatsapp-inbound` é público (`verify_jwt = false` em `config.toml`), mas exige header `X-Webhook-Token` = secret novo `GPT_MAKER_WEBHOOK_TOKEN` (gerado com `generate_secret`).
- Timezone: todo cálculo de "hoje" usa `America/Sao_Paulo` (helper `todayBRT()` em `src/lib/scoreapp/tz.ts` + versão Deno na função).
- Rate limit natural: crons processam em lote de 50 por execução, com delay de `settings.delay_seconds` entre envios.
- Logs de erro do GPT Maker vão para `score_whatsapp_messages.error` + `console.error` (visível em `edge_function_logs`).

## Ordem de implementação

1. Migration (`score_whatsapp_messages`, colunas em `score_profiles`, coluna `whatsapp_templates` em `settings`) + grants + RLS.
2. Helper `_shared/gpt-maker.ts` + `src/lib/scoreapp/streak.ts` + `tz.ts`.
3. Edge functions: `whatsapp-inbound` → `whatsapp-daily-checkin` → `whatsapp-inactivity-alerts` → `whatsapp-weekly-report`.
4. Cron jobs via `supabase--insert`.
5. UI: aba Admin "WhatsApp Ritual" + toggle no perfil + streak no Dashboard.
6. Teste ponta-a-ponta: botão "Enviar teste" + simulação de webhook inbound via `curl_edge_functions`.

## O que fica de fora deste plano (posso incluir se quiser)

- Botões interativos nativos do WhatsApp (GPT Maker envia texto; botões dependem de template HSM aprovado — sugiro fase 2).
- Comunidade / desafio semanal em grupo (item 8 da sua lista) — precisa decidir se é grupo único ou por turma.
- "Missão do dia" na home ao logar — fácil de acoplar depois de o streak estar rodando.
