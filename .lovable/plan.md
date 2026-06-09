# Senha própria + novo e-mail "Agende seu primeiro horário"

## 1. Mentorado define a própria senha

**Novo card "Segurança" em `src/components/portal/PerfilTab.tsx`:**
- Campo "Nova senha" (mín. 8) + "Confirmar senha"
- Botão **Salvar nova senha** → `supabase.auth.updateUser({ password })` (cliente autenticado, sem edge function)
- Ao salvar com sucesso: marca `mentees.password_changed_at = now()` e mostra toast

**Banner de primeiro acesso no `PortalDashboard`:**
Se `password_changed_at` for `null`, exibe aviso laranja no topo:
> "Primeiro acesso? Defina uma senha pessoal na aba Perfil → Segurança."
Some assim que a senha é trocada.

**Migration:** adicionar coluna `password_changed_at timestamptz` em `public.mentees`.

---

## 2. Novo e-mail: "Agende seu primeiro horário"

**Novo template:** `supabase/functions/_shared/app-email-templates/schedule-first-meeting.tsx`
- Mesma identidade visual dos outros (Libre Baskerville, acento #C4632D, off-white)
- Conteúdo: parabeniza o acesso, explica que as 2 primeiras reuniões já estão liberadas, CTA **"Agendar minha 1ª reunião"** que leva para `/mentorados` (aba Cronograma)
- Props: `fullName`, `portalUrl`

**Registrar no `send-app-email/index.ts`** (mesmo padrão dos outros templates).

**Quando disparar (2 gatilhos):**
1. **Logo após o `welcome-mentee`**, no `asaas-webhook` e no `admin-invite-mentee` — enviados em sequência (boas-vindas com a senha, e logo o "agende seu 1º horário"). Assim a pessoa já recebe o convite pra marcar.
2. **Lembrete:** se passados 3 dias do `started_at` o mentorado ainda não agendou nenhuma reunião (`meetings` com `scheduled_at IS NULL`), reenviar uma vez. Implementação simples: nova edge function `remind-first-schedule` + cron diário no `supabase/config.toml`.

> Posso começar só pelo gatilho #1 (no momento do convite/pagamento) e deixar o lembrete pra depois, se preferir. Me diga se quer os dois agora ou só o primeiro.

---

## E-mails do fluxo do mentorado (situação atual + após esta mudança)

**Automáticos hoje:**
| Quando | Template |
|---|---|
| Pagamento confirmado / convite admin | `welcome-mentee` (senha temporária) |
| Mentorado agenda reunião | `meeting-scheduled` |

**Novos automáticos (esta entrega):**
| Quando | Template |
|---|---|
| Logo após `welcome-mentee` | `schedule-first-meeting` (novo) |
| +3 dias sem agendar (opcional, se aprovar) | `schedule-first-meeting` (reenvio) |

**Manuais (admin aciona pelo painel):** `meeting-available`, `activity-available`, `blog-insight`, `prospecting`.

Nenhum outro e-mail é disparado depois do primeiro acesso — nem confirmação de troca de senha (posso adicionar se quiser).

---

## Arquivos afetados
- `supabase/migrations/...` — coluna `password_changed_at`
- `src/components/portal/PerfilTab.tsx` — card Segurança
- `src/pages/portal/PortalDashboard.tsx` — banner
- `supabase/functions/_shared/app-email-templates/schedule-first-meeting.tsx` (novo)
- `supabase/functions/send-app-email/index.ts` — registrar template
- `supabase/functions/asaas-webhook/index.ts` — enviar 2º e-mail
- `supabase/functions/admin-invite-mentee/index.ts` — enviar 2º e-mail
- (opcional) `supabase/functions/remind-first-schedule/index.ts` + cron no `config.toml`
