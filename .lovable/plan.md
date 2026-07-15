## Objetivo

Adicionar uma nova seção na página `/simulador-up` (`src/pages/SimuladorUP.tsx`) com uma **Calculadora de Comissão Liberada** — separada do simulador de receita já existente, mantendo a mesma identidade visual (grafite, petróleo, laranja, areia, off-white / Libre Baskerville + Inter).

## Onde entra

Nova seção `<section id="calc-comissao">` inserida logo após o bloco do simulador atual e antes das demais seções da página. O simulador de receita existente permanece intacto.

## Campos de entrada

1. **Valor do imóvel** — input com máscara de moeda BRL (reaproveita o helper `brl` e um parser de dígitos → número, no estilo de `src/lib/scoreapp/masks.ts`).
2. **Porcentagem de comissão** — input numérico com sufixo `%` (aceita decimais, ex.: `2` ou `2,5`).
3. **Porcentagem de desbloqueio** — input numérico com sufixo `%`.
4. **Valor já pago pelo cliente** — input com máscara de moeda BRL.

Todos os campos são controlados via `useState`. Cálculo em tempo real com `useMemo`.

## Lógica de cálculo

```
comissaoTotal      = valorImovel * (pctComissao / 100)
valorDesbloqueio   = valorImovel * (pctDesbloqueio / 100)
pctAtingido        = valorDesbloqueio > 0
                       ? min(valorPago / valorDesbloqueio, 1)
                       : 0
comissaoLiberada   = valorPago >= valorDesbloqueio
                       ? comissaoTotal
                       : comissaoTotal * (valorPago / valorDesbloqueio)
comissaoRestante   = comissaoTotal - comissaoLiberada
```

Guardas: se `valorDesbloqueio === 0`, tratar `pctAtingido = 0` e `comissaoLiberada = 0` para evitar divisão por zero.

Validação do exemplo: imóvel R$ 322.000, comissão 2% → total R$ 6.440; desbloqueio 20% → R$ 64.400; pago R$ 10.000 → liberada = 6.440 × (10.000 / 64.400) = **R$ 1.000** ✓.

## Card de resultado

Card único (estilo dos cards existentes: `rounded-sm border up-rule bg-white`) exibindo, em fonte tabular:

- Comissão total
- Valor necessário para desbloqueio
- Valor já pago
- Percentual atingido (barra de progresso simples usando `div` com largura proporcional em laranja sobre trilho areia)
- **Comissão liberada** (destaque em laranja, tamanho maior)
- Comissão restante

## Ações

- Botão **Limpar** — zera todos os campos.
- Botão **Copiar resultado** — usa `navigator.clipboard.writeText(...)` com um resumo em texto plano e dispara `toast.success("Resultado copiado")` (o `toast` do sonner já está importado no arquivo).

## Layout

- Grid `lg:grid-cols-5`: formulário `lg:col-span-2`, card de resultado `lg:col-span-3` (mesmo padrão do simulador acima).
- Responsivo: em mobile, empilha (form em cima, resultado embaixo).
- Header da seção com o `up-mark` laranja + título Libre Baskerville, seguindo o padrão da página.

## Detalhes técnicos

- Todo o código novo fica dentro de `src/pages/SimuladorUP.tsx`. Sem novas dependências.
- Helpers locais de máscara: parser `parseBRL(str) => number` (só dígitos ÷ 100) e formatter reaproveitando `brl` (ajustar `maximumFractionDigits: 2` para este bloco via um `brl2` local).
- Percentuais aceitos como `number` no state, exibidos com sufixo `%` e vírgula decimal em pt-BR.
- Nada muda fora dessa página.
