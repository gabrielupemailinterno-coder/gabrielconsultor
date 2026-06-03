## Plano de correção definitiva

1. **Corrigir o botão “Fazer pagamento” no Portal do Mentorado**
   - Hoje ele só leva para `/mentoria-profissional#oferta`, mas não abre o checkout automaticamente.
   - Vou trocar para um fluxo direto: clicar em “Fazer pagamento” abre o formulário de pagamento já no contexto do mentorado.
   - O formulário será pré-preenchido com nome e e-mail do mentorado quando ele estiver logado.

2. **Ajustar a regra de cobrança da Asaas por modalidade**
   - Modalidade **Acesso completo/pago**: assinatura mensal de **3 mensalidades de R$ 187,00**.
   - Modalidade **3 primeiros grátis, depois paga**: isenta a primeira mensalidade e cria assinatura de **2 mensalidades de R$ 187,00**.
   - A função de checkout vai receber o `mentee_id`, validar o mentorado no backend e decidir com segurança se `maxPayments` será `2` ou `3`.

3. **Melhorar o formulário de checkout**
   - Manter os campos obrigatórios para cadastrar cliente na Asaas: nome, e-mail, WhatsApp, CPF, CEP, número e endereço de cobrança.
   - Preencher automaticamente dados conhecidos do mentorado e permitir completar CPF/endereço.
   - Atualizar o texto do checkout para mostrar claramente quando for “2x de R$ 187,00” por isenção da primeira mensalidade.

4. **Ajustar o webhook para pagamentos de assinatura**
   - Quando a primeira cobrança confirmada chegar da Asaas, se o mentorado já existir, o webhook deverá marcar `payment_status = paid`, salvar IDs da Asaas e liberar os encontros bloqueados.
   - Se o mentorado ainda não existir, mantém o provisionamento automático atual.
   - Assim, quem começou com 3 encontros grátis será desbloqueado após pagar a primeira das 2 mensalidades.

5. **Validar a integração**
   - Testar a função de checkout com payload simulado para confirmar que retorna link de pagamento e usa 2 ou 3 mensalidades conforme a modalidade.
   - Testar o webhook em modo seguro para confirmar que o mentorado existente é atualizado e os encontros são liberados sem depender do redirecionamento do navegador.

## Detalhes técnicos

- Arquivos principais envolvidos:
  - `src/pages/portal/PortalDashboard.tsx`
  - `src/components/CheckoutDialog.tsx`
  - `supabase/functions/asaas-create-checkout/index.ts`
  - `supabase/functions/asaas-webhook/index.ts`
- Não vou mudar sua tabela de mentorados, porque os campos `access_mode` e `payment_status` já existem e suportam essa regra.