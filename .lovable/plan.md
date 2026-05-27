# Internacionalização automática (PT/EN + BRL/USD)

## O que vai acontecer

1. Visitante do Brasil → vê tudo em PT, preços em R$ (igual hoje).
2. Visitante de outro país → vê tudo em **inglês** automaticamente, preço em **USD** (R$ ÷ 5).
3. Botão `PT | EN` no header pra forçar manualmente.
4. Preferência salva em localStorage.

## Como vou construir

**1. Detecção de país/idioma**
- Usa `navigator.language` (ex: `pt-BR`, `en-US`, `es-ES`).
- Se começar com `pt` → PT/BRL. Senão → EN/USD.
- (Mais robusto que IP, gratuito, instantâneo.)

**2. Tradução para inglês via Lovable AI (uma vez, agora)**
- Extraio todas as strings dos arquivos `Index.tsx`, `MentoriaProfissional.tsx`, `LeadFormDialog.tsx`, `NotFound.tsx`, `index.html` (meta tags).
- Mando pra IA traduzir mantendo tom profissional/comercial.
- Salvo em `src/locales/en.json`.
- PT fica em `src/locales/pt.json` (extraído do código atual).

**3. Sistema i18n leve**
- `src/contexts/LocaleContext.tsx` — provider com `locale`, `t(key)`, `currency`, `formatPrice()`.
- `formatPrice(197)` → `"R$ 197"` em PT, `"USD 39"` em EN (divide por 5, arredonda).
- Toggle `<LanguageSwitcher />` no header.

**4. Substituição nos componentes**
- Trocar strings hardcoded por `t("hero.title")`, etc.
- Preço `R$ 197/mês` vira `{formatPrice(197)}/{t("month")}`.
- Meta tags do `<head>` continuam em PT (SEO Brasil), mas adicionado `<html lang>` dinâmico via React.

**5. SEO**
- `hreflang` tags pra Google entender as 2 versões.
- Para SEO real em inglês (Google indexar versão EN), o ideal seria rota `/en/...`, mas isso é um upgrade futuro — por agora a troca client-side resolve a experiência do visitante.

## Limitações honestas

- **SEO em inglês**: como a troca é client-side, o Google não indexa a versão EN como página separada. Pra ranquear no Google.com em inglês, precisaria rota `/en` (próximo passo, se quiser depois).
- **Conteúdo dinâmico (formulário, toasts)**: também traduzido.
- **Cotação USD fixa em 5,00**: se o dólar mudar muito, você me chama e eu atualizo a constante (1 linha).

## Arquivos que vou criar/editar

Criar:
- `src/contexts/LocaleContext.tsx`
- `src/locales/pt.json`
- `src/locales/en.json`
- `src/components/LanguageSwitcher.tsx`
- `src/lib/i18n.ts` (helpers)

Editar:
- `src/App.tsx` (wrap com LocaleProvider)
- `src/pages/Index.tsx`
- `src/pages/MentoriaProfissional.tsx`
- `src/pages/NotFound.tsx`
- `src/components/LeadFormDialog.tsx`

Quer que eu siga?
