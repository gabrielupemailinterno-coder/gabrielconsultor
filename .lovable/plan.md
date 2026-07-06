Objetivo: substituir o checkout Asaas atual do Score Comercial por pagamento via PIX com a API do banco CORA, usando autenticação mTLS OAuth2 (Client ID + certificado + private key).

Escopo confirmado com você:
- Linguagem: TypeScript — edge functions em Deno no backend, React + TypeScript no frontend.
- Banco/integração: CORA (Integração Direta), ambiente de produção.
- Credenciais: Client ID `int-5UfRX2n2yKczZXbv4vefg7`, certificado `.pem` e private key `.key` disponíveis.
- Planos: Mensal R$ 9,70 (PIX recorrente/automático) e Semestral R$ 49,70 (PIX único).
- Dados pessoais: CPF, CEP, endereço e número serão pedidos no cadastro do Score Comercial.
- Pós-pagamento: redirecionar o usuário para `/scoreapp/app` após confirmação.

Etapas de implementação

1. Banco de dados
- Alterar `public.score_profiles` para adicionar:
  - Dados pessoais: `cpf`, `postal_code`, `address`, `address_number`, `address_complement`, `province`, `city`, `state`.
  - Pagamento CORA: `cora_customer_id`, `cora_subscription_id`, `cora_invoice_id`, `cora_status`, `cora_due_date`, `cora_emv`, `cora_qr_code_url`, `cora_paid_at`, `cora_paid_amount`, `plan_status`, `payment_status`.
- Atualizar a função `handle_new_scoreapp_user()` para popular os novos campos a partir dos metadados de cadastro.

2. Backend — edge functions (Deno/TypeScript)
- `supabase/functions/cora-pix-checkout/index.ts`
  - Autenticação mTLS OAuth2 com CORA (`Deno.createHttpClient` + cert/key + Client ID).
  - Endpoint de token: `https://matls-clients.api.cora.com.br/token`.
  - API de cobrança: `POST https://api.cora.com.br/v2/invoices/` com `payment_forms: ["PIX"]`.
  - Para plano mensal, criar recorrência via API de subscriptions da CORA.
  - Persistir `cora_invoice_id`, `cora_subscription_id`, `cora_emv`, `cora_qr_code_url` e status no `score_profiles`.
- `supabase/functions/cora-webhook/index.ts`
  - Receber notificações da CORA (`invoice.paid` e outros eventos de invoice).
  - Atualizar `score_profiles`: `plan_status='active'`, `payment_status='paid'`, `plan_started_at`, `plan_expires_at`, `cora_paid_at`, `cora_paid_amount`.
  - Registrar webhook no CORA via API de endpoints se necessário.

3. Frontend — React/TypeScript
- `src/pages/scoreapp/Signup.tsx`
  - Adicionar campos de CPF, CEP, endereço, número, complemento, bairro, cidade e UF.
  - Enviar os dados nos metadados do signup para a trigger preencher `score_profiles`.
- `src/pages/scoreapp/Onboarding.tsx` (metas)
  - Manter fluxo atual; após concluir, direcionar para dashboard.
- `src/pages/scoreapp/Planos.tsx`
  - Substituir botões placeholder por chamada à edge function `cora-pix-checkout`.
  - Adicionar estados de loading e erro.
- `src/pages/scoreapp/CheckoutPix.tsx` (novo)
  - Exibir QR Code, cópia e cola (EMV) e valor.
  - Iniciar polling curto para detectar pagamento ou usar webhook.
  - Redirecionar para `/scoreapp/app` quando `plan_status` virar `active`.
- Atualizar tipos em `src/lib/scoreapp/types.ts` e hook `src/hooks/useScoreData.ts` para refletir os novos campos.

4. Credenciais e configuração
- Armazenar como secrets de runtime:
  - `CORA_CLIENT_ID`
  - `CORA_CERT_PEM` (conteúdo do certificado em PEM)
  - `CORA_PRIVATE_KEY` (conteúdo da chave privada em PEM)
  - `CORA_WEBHOOK_SECRET` (para validar/identificar webhooks da CORA, se disponível)
- Definir URLs de produção:
  - Token: `https://matls-clients.api.cora.com.br/token`
  - API: `https://api.cora.com.br`

5. Testes e validação
- Testar edge function de checkout com chamada autenticada.
- Simular/validar webhook de pagamento (`invoice.paid`).
- Verificar redirecionamento pós-pagamento e liberação do plano pago no dashboard.
- Revisar políticas de RLS para garantir que os novos campos continuem protegidos.

Arquivos que serão criados/editados
- Criados: `supabase/functions/cora-pix-checkout/index.ts`, `supabase/functions/cora-webhook/index.ts`, `src/pages/scoreapp/CheckoutPix.tsx`.
- Editados: `supabase/migrations/...` (nova migration), `src/pages/scoreapp/Signup.tsx`, `src/pages/scoreapp/Planos.tsx`, `src/lib/scoreapp/types.ts`, `src/hooks/useScoreData.ts`, `src/App.tsx` (rotas), `src/integrations/supabase/types.ts` (auto-regenerado após migration).

Nota importante sobre a CORA
A modalidade Integração Direta da CORA exige autenticação mTLS com certificado + private key, além do Client ID. Como você confirmou que possui esses arquivos, a implementação usará `Deno.createHttpClient({ cert, key })` para as chamadas autenticadas.