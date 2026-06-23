# Simulador de Receita | Vendedores UP

Observação: não consigo criar um projeto Lovable novo a partir daqui. Vou criar a página como uma **rota isolada** neste projeto (`/simulador-up`), sem link no menu nem dependência do site do Gabriel Consultor. Fica 100% autônoma — você acessa direto pela URL e pode compartilhar no WhatsApp. Se preferir um projeto separado de verdade, me avise que te passo o passo pra duplicar.

Sem formulário de lead com persistência — o form final é só visual (mostra "Recebemos seu interesse" ao enviar), conforme você indicou.

## O que vou construir

Arquivo único: `src/pages/SimuladorUP.tsx`, registrado em `src/App.tsx` como `/simulador-up`. Sem tocar em nada do site atual.

### Seções (single page, scroll)

1. **Hero** — Título "Simule sua receita como vendedor UP", subtítulo, CTA "Começar simulação" (scroll suave até o simulador).
2. **Explicativo** — Texto curto + 2 cards lado a lado: "Lead Marketing 2%–3%" e "Captação Própria 3%–4%".
3. **Simulador** — Form reativo:
   - Select de Produto (Veneza R$350k, Montrezor R$850k, Park Europa R$210k, Park Alterosas R$210k com badge "Lançamento")
   - Radio de Origem (Lead Marketing / Captação Própria)
   - Input numérico de Quantidade (mín. 1, validado)
   - Cálculo atualiza em tempo real (`useMemo`)
4. **Resultado** — Card grande com produto, valor médio, origem, qtd, comissão min/max por venda, receita total min/max, e o texto de impacto.
5. **Comparativo** — Tabela responsiva com os 4 produtos × faixas Marketing/Captação (vira lista de cards no mobile).
6. **CTA final** — "Quero fazer parte do time UP" abre Dialog com campos Nome, WhatsApp (máscara BR), Cidade, 2 radios Sim/Não, textarea de experiência. Submit mostra toast de confirmação (sem backend).
7. **Aviso legal** — Texto pequeno, muted, rodapé da página.

### Regras de cálculo

```text
valor = preço médio do produto
qtd   = max(1, input)
se origem = Marketing:  min = valor * 0.02, max = valor * 0.03
se origem = Captação:   min = valor * 0.03, max = valor * 0.04
receita_min = min * qtd
receita_max = max * qtd
```

Formatação: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

### Design

- Visual moderno comercial premium, dark-friendly mas otimizado pra mobile (WhatsApp).
- Paleta independente do site Gabriel (não usa os tokens grafite/laranja) — proponho:
  - Base: branco off (#FAFAF7) com seções escuras (#0B1220) alternadas
  - Acento: verde-dinheiro premium (#0E9F6E) + dourado sutil (#C9A227) pros números grandes
  - Tipografia: **Sora** (títulos, peso 700) + **Inter** (texto) via `@fontsource`
- Números de comissão grandes (text-5xl/6xl), animação sutil de count-up ao recalcular.
- Cards com borda fina, sombra suave, hover discreto.
- Layout mobile-first: tudo em coluna, simulador sticky-friendly, tabela vira cards empilhados <768px.

### Detalhes técnicos

- Componentes shadcn já presentes: `Card`, `Button`, `Input`, `Label`, `Select`, `RadioGroup`, `Dialog`, `Textarea`, `Badge`, `Table`, `toast`.
- Tokens novos isolados via classes utility na própria página (sem poluir `index.css` global) — uso `style={{}}` ou Tailwind arbitrary values pros 2-3 acentos específicos da UP, mantendo o resto do app intacto.
- Fontes: `bun add @fontsource/sora @fontsource/inter`, import só dentro da página via `main.tsx`.
- SEO: `<title>` e `meta description` setados via efeito na rota, H1 único, viewport responsivo (já global).
- Sem chamadas a Supabase, sem secrets, sem edge functions.

### Arquivos

- **Novo:** `src/pages/SimuladorUP.tsx`
- **Editar:** `src/App.tsx` (1 rota nova)
- **Editar:** `src/main.tsx` (2 imports de fonte)
- **Editar:** `package.json` via `bun add`

Confirma que posso seguir?
