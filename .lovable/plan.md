# 4 formulários de captura + visualização no Admin

## O que será criado

### 1. Banco — uma tabela só, com tipo
Reaproveitar a tabela `leads` existente, adicionando:
- `form_type` (texto): `contato` | `mentoria_1a1_vendedores` | `consultoria_operacional` | `mentoria_estrategica`
- `answers` (JSONB): respostas específicas de cada formulário pré-qualificatório
- Campos `company_name`, `revenue`, `main_pain` continuam (usados pelos formulários longos; ficam vazios no de contato)

RLS já existente continua: qualquer um pode inserir, só admin lê. Página `/admin` já é protegida por Google Auth + role admin.

### 2. Quatro componentes de formulário (dinâmicos, multi-step)

Componente base reutilizável `QualifyingForm` com:
- Passos sequenciais com barra de progresso (estilo Apple)
- Cada pergunta em tela própria, transições suaves
- Botão voltar/avançar, validação por passo
- Último passo: contato (nome, telefone, email)
- Envia para `leads` com `form_type` e `answers`

**Formulário A — Contato rápido** (já existe parcialmente)
- Nome, telefone, email — 1 tela, envio direto

**Formulário B — Mentoria 1:1 para vendedores** (perguntas objetivas)
1. Você atua hoje como? (SDR / Closer / Hunter / Gerente comercial / Outro)
2. Tempo de experiência em vendas (menos 1 ano / 1-3 / 3-5 / 5+)
3. Ticket médio que você opera (até 5k / 5-20k / 20-100k / 100k+)
4. Quanto bate de meta hoje? (abaixo 70% / 70-100% / 100-130% / 130%+)
5. Maior gargalo hoje? (prospecção / qualificação / negociação / fechamento / follow-up)
6. Investimento mensal disponível para mentoria (até 500 / 500-1.5k / 1.5-3k / 3k+)
7. Contato (nome, telefone, email)

**Formulário C — Consultoria operacional** (B2B / empresa)
1. Cargo (CEO/sócio / Diretor / Gerente / Outro)
2. Faturamento mensal da empresa (até 100k / 100-500k / 500k-2M / 2M+)
3. Tamanho do time comercial (1-3 / 4-10 / 11-30 / 30+)
4. Canais de aquisição ativos (multi: orgânico, pago, outbound, indicação, eventos)
5. Principal dor operacional (CAC alto / conversão baixa / time sem processo / previsibilidade / qualificação de leads)
6. Quando pretende começar? (imediato / 30 dias / 60-90 dias / explorando)
7. Contato (nome, telefone, email, empresa)

**Formulário D — Mentoria estratégica** (founder/gestor)
1. Seu papel (founder / C-level / Head de marketing-growth / Outro)
2. Estágio da empresa (validando / early / scale-up / consolidada)
3. Faturamento anual (até 1M / 1-5M / 5-20M / 20M+)
4. Já tem time de marketing/growth? (sim estruturado / em formação / não)
5. Maior decisão estratégica em aberto (canal a priorizar / posicionamento / estrutura de time / pricing / expansão)
6. Horizonte de mentoria desejado (3 / 6 / 12 meses)
7. Contato (nome, telefone, email, empresa)

### 3. Gatilhos no site
- Botão "Contato rápido" no footer/header → Formulário A
- CTA da seção Mentoria 1:1 (página `MentoriaProfissional`) → Formulário B
- CTA da seção Consultoria (Index) → Formulário C
- CTA da seção Mentoria Estratégica (Index) → Formulário D
- Botão "Agendar diagnóstico" do header continua abrindo Google Calendar (não muda)

### 4. Admin
Em `/admin`, na aba "Cadastros":
- Filtros pill por tipo: Todos / Contato / Mentoria 1:1 / Consultoria / Mentoria Estratégica (contadores)
- Cada card mostra: tipo (badge colorido), data, contato, e respostas formatadas (label: resposta) quando `answers` existir
- Exportar CSV por tipo (opcional, posso adicionar)

## Detalhes técnicos

- Migration: `ALTER TABLE leads ADD COLUMN form_type text NOT NULL DEFAULT 'contato', ADD COLUMN answers jsonb`
- Schema de perguntas vive em `src/lib/qualifying-forms.ts` (array tipado) — fácil editar perguntas depois sem mexer no componente
- Validação com `zod` no passo final (telefone BR, email)
- `LeadFormDialog` atual continua funcionando (vira o Formulário A)
- Tracking via `useAnalytics` em cada submit (`form_submit_<tipo>`)

## O que NÃO muda
- Auth, RLS, estrutura do Admin, design system, header/footer.

Confirma as perguntas de cada formulário ou quer ajustar alguma antes de eu implementar?