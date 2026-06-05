
# Migração completa pro Zoho

Vamos trocar a infra atual (Lovable Emails + `noreply.gabrielconsultor.com`) por três produtos Zoho: **Zoho Mail (SMTP + API)** e **Zoho Campaigns**. Cada um resolve uma parte.

## Arquitetura final

```text
┌──────────────────────┐      ┌─────────────────────────────┐
│  Supabase Auth       │─SMTP─▶ Zoho Mail (smtp.zoho.com)   │  ← convite, recuperação, magic link
└──────────────────────┘      └─────────────────────────────┘
┌──────────────────────┐      ┌─────────────────────────────┐
│ Edge Function:       │─API──▶ Zoho Mail REST API (OAuth)  │  ← e-mail 1-a-1 do admin pra mentorado/lead
│ send-zoho-email      │      │  + leitura de inbox          │  ← histórico no portal
└──────────────────────┘      └─────────────────────────────┘
┌──────────────────────┐      ┌─────────────────────────────┐
│ Admin → Campanhas    │─API──▶ Zoho Campaigns API          │  ← 20 newsletters + agendamento
└──────────────────────┘      └─────────────────────────────┘
```

## O que será feito

### 1. Desligar Lovable Emails
- Desativar via `toggle_project_emails` (vai parar de cobrar envio Lovable).
- Te aviso os **NS records exatos** pra você remover no DNS de `gabrielconsultor.com` (Lovable não remove sozinho).
- Tabelas `email_send_log`/`email_send_state`/queues ficam (histórico antigo). Edge functions `auth-email-hook` e `process-email-queue` são removidas.

### 2. Configurar Zoho Mail no DNS
- Você precisa ter conta **Zoho Mail** com `gabrielconsultor.com` verificado lá (MX + SPF + DKIM apontando pro Zoho).
- Gerar **senha de app** em `accounts.zoho.com` (pro SMTP) e criar um **Self Client OAuth** em `api-console.zoho.com` (pro API + Campaigns).

### 3. Auth emails via SMTP do Zoho
- Configurar **Custom SMTP** no Supabase Auth apontando pra `smtp.zoho.com:465`, usuário `contato@gabrielconsultor.com`, senha de app.
- Reaproveitar os 6 templates React Email já feitos (signup, recovery, invite, magic-link, email-change, reauthentication) — eles continuam servindo, só muda o transporte.

### 4. E-mail transacional 1-a-1 (admin → mentorado/lead)
- Edge function `send-zoho-email` que chama **Zoho Mail API** (`/mail/v1/accounts/{id}/messages`) com token OAuth.
- Botão "Enviar e-mail" já existente no admin passa a chamar essa função.
- Refresh token armazenado em `secrets` (`ZOHO_REFRESH_TOKEN`, `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_ACCOUNT_ID`).

### 5. Leitura de inbox no portal
- Nova aba no admin do mentorado/lead: **"Conversas por e-mail"**.
- Edge function `zoho-inbox-fetch` busca mensagens filtradas pelo e-mail da pessoa via `/mail/v1/accounts/{id}/messages/search?searchKey=from:{email}`.
- Cache em tabela `email_threads` (atualizado on-demand, sem polling).

### 6. Newsletter via Zoho Campaigns
- Edge function `zoho-campaigns-sync` sincroniza leads/mentorados com listas no Campaigns (`/api/v1.1/addlistsubscribersinbulk`).
- Tela nova **"Campanhas"** no admin:
  - lista as 20 newsletters pré-criadas
  - cria/atualiza campanha no Zoho (`/api/v1.1/createCampaign`)
  - dispara ou agenda envio (`/api/v1.1/sendcampaign` com `schedule_time`)
- Os 20 e-mails de newsletter (mix nutrição + engajamento, alinhados à linha técnica/executiva) são gerados como JSON de template + HTML inline e enviados pro Campaigns na 1ª sincronização.

## Tarefas técnicas

```text
1.  Desativar Lovable Emails + remover edge functions de e-mail
2.  Adicionar secrets: ZOHO_SMTP_PASSWORD, ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN, ZOHO_ACCOUNT_ID, ZOHO_CAMPAIGNS_REFRESH_TOKEN
3.  Configurar SMTP do Supabase Auth (via configure_auth)
4.  Migrar 6 templates auth pra HTML compilado (já estão prontos, só renderizar)
5.  Criar edge function: send-zoho-email
6.  Criar edge function: zoho-inbox-fetch
7.  Criar edge function: zoho-campaigns-sync
8.  Criar edge function: zoho-campaigns-send (com agendamento)
9.  Criar tabelas: email_threads, email_campaigns, campaign_recipients
10. UI admin: aba "Conversas por e-mail" no detalhe do mentorado/lead
11. UI admin: página "Campanhas" com lista, editor, agendamento
12. Seed dos 20 templates de newsletter
13. Atualizar botão "Enviar e-mail" existente pra usar send-zoho-email
```

## O que você precisa fazer (manual)

Antes de eu começar:

1. **Conta Zoho Mail ativa** com `gabrielconsultor.com` verificado (plano Mail Lite serve, $1/mês).
2. **DNS**: substituir registros atuais por MX/SPF/DKIM do Zoho (eu te passo os valores depois que confirmar).
3. **Senha de app SMTP**: gerar em `accounts.zoho.com → Security → App Passwords`.
4. **Self Client OAuth** (Mail + Campaigns):
   - `api-console.zoho.com` → Add Client → Self Client
   - Scopes: `ZohoMail.messages.ALL`, `ZohoMail.accounts.READ`, `ZohoCampaigns.campaign.ALL`, `ZohoCampaigns.contact.ALL`
   - Gerar refresh token (não expira)

Quando tiver isso pronto, eu peço os secrets e começo a implementação na ordem da lista acima.

## Limitações que você precisa saber

- **Zoho Campaigns plano grátis** = 6.000 e-mails/mês pra até 2.000 contatos. Acima disso é pago.
- **Zoho Mail API** tem rate limit de 50 req/min por usuário — ok pra uso transacional, ruim pra blast.
- **Leitura de inbox** só vê e-mails da conta `contato@gabrielconsultor.com`. Se você responde do celular, sincroniza; mas se outra pessoa mandar/receber por outra conta, não aparece.
- **Agendamento de campanha** é nativo do Zoho Campaigns (não precisa cron no Supabase).
- Migrar SMTP **invalida sessões de e-mail-confirm pendentes** — quem clicar em link antigo de convite vai precisar pedir novo.
