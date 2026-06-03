## Contexto
A landing page `/mentoria-profissional` segue tema dark com paleta oficial (laranja `#C4632D` como acento primário). O usuário quer inserir um case real anônimo de uma profissional que migrou de CS para vendas de alto ticket.

## Escopo
1. **Novo componente** `src/components/CaseSection.tsx`
   - Título + subtítulo com animação `fadeUp` (framer-motion).
   - Bloco de contexto/desafio + bloco "Virada de chave" (diferencial competitivo).
   - **4 blocos de métricas financeiras** grandes e visuais:
     - Faturamento Total: R$ 76.000,00
     - Ticket Médio: R$ 12.000,00
     - Taxa de Comissão: 2%
     - Retorno Direto: R$ 1.520,00
     - Estilo: fonte mono para os números, cor `primary` (laranja) nos valores, cards com fundo `card` e borda sutil.
   - **2 cards de lições práticas** (key takeaways) com ícones relevantes do lucide-react.
   - Layout responsivo: grid 2x2 em desktop, 1 coluna em mobile.
   - Sem foto da pessoa (anonimato).

2. **Conteúdo bilíngue** em `src/locales/copy.ts`
   - Adicionar chaves do case dentro de `mentoriaCopy.pt`.
   - Adicionar versão `en` básica para manter paridade (placeholder ou tradução fiel).

3. **Inserção na página** `src/pages/MentoriaProfissional.tsx`
   - Posicionar a `<CaseSection />` **entre** a seção "Como funciona" e a seção "CTA Final".
   - Usar `<div className="gold-divider" />` antes e depois, igual às demais seções.
   - Importar o componente e as chaves de copy.

## Fora do escopo
- Sem alteração de backend.
- Sem novas dependências.
- Sem imagem/foto do mentorado (anonimato).

## Arquivos afetados
- `src/components/CaseSection.tsx` (novo)
- `src/locales/copy.ts` (adição de chaves)
- `src/pages/MentoriaProfissional.tsx` (import + inserção)

## Checklist de qualidade
- [ ] Tokens de design: `bg-card`, `border-border`, `text-primary`, `font-mono`, `font-serif`, `text-muted-foreground`.
- [ ] Animação `fadeUp` consistente com as demais seções da página.
- [ ] Responsividade mobile verificada.
- [ ] Conteúdo PT/EN presente no copy.ts.
