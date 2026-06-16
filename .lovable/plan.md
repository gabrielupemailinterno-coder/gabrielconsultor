## Objetivo
Garantir que mentorados consigam logar com a senha enviada pelo admin e permitir que eles redefinam a senha sozinhos a partir da tela de login.

## O que será feito

1. **Tela de login do mentorado (`/mentorados/login`)**
   - Adicionar link "Esqueci minha senha".
   - Ao clicar, abrir um modo onde o mentorado digita o e-mail e recebe instruções por e-mail (`resetPasswordForEmail`) apontando para `/mentorados/redefinir-senha`.
   - Melhorar mensagem de erro: quando o login falhar por e-mail não confirmado, mostrar aviso pedindo para redefinir a senha (e disparar o e-mail automaticamente).

2. **Nova página `/mentorados/redefinir-senha`**
   - Pública (sem exigir mentorado já logado).
   - Detecta a sessão de recuperação que o Supabase cria ao clicar no link do e-mail.
   - Pede nova senha + confirmação, chama `supabase.auth.updateUser({ password })`.
   - Marca `password_changed_at` no registro do mentorado e redireciona para `/mentorados`.
   - Se o link estiver inválido/expirado, mostra mensagem e botão para pedir um novo e-mail.

3. **Edge function `admin-reset-mentee-password`**
   - Antes de gerar a nova senha, garantir `email_confirm: true` no usuário (evita o problema da Yasmin acontecer de novo com qualquer mentorada antiga não confirmada).
   - Continuar retornando a senha gerada para o admin copiar.

4. **Edge function `admin-invite-mentee`**
   - Quando o usuário já existir (caminho do `if (found)`), além de confirmar o e-mail, **redefinir a senha** para uma nova senha temporária e devolvê-la, para que o admin possa enviar credenciais válidas mesmo em reconvite. Hoje, se o usuário já existia, nenhuma senha é gerada nem enviada — o admin manda uma senha que ninguém conhece.
   - Disparar `welcome-mentee` também nesse caso (com a senha temporária).

5. **Rota nova no `App.tsx`**
   - Registrar `/mentorados/redefinir-senha` antes da rota catch-all.

## Resultado esperado
- Toda nova credencial enviada pelo admin funciona no primeiro login.
- Mentorados que perderem a senha conseguem redefinir sozinhos pelo botão na tela de login.
- O admin continua tendo o botão "Redefinir senha" no painel para gerar uma senha manualmente.

## Arquivos previstos
- `src/pages/portal/PortalLogin.tsx`
- `src/pages/portal/PortalResetPassword.tsx` (novo)
- `src/App.tsx`
- `supabase/functions/admin-reset-mentee-password/index.ts`
- `supabase/functions/admin-invite-mentee/index.ts`