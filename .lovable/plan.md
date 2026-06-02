## Objetivo

1. Disponibilizar o PDF **SPIN Selling – Alcançando Excelência em Vendas** no Repositório do portal, acessível a todos os mentorados.
2. Reescrever o conteúdo dos 7 encontros (Onboarding + 6 sessões) seguindo a lógica SPIN.
3. Permitir que o admin (você) anexe materiais extras a um mentorado específico, quando necessário.

## 1. PDF do livro como material global

- Subir o arquivo `Spin-Selling-Alcancando-Excelencia-Em-Vendas-2.pdf` via **Lovable Assets** (CDN), gerando `src/assets/spin-selling.pdf.asset.json`.
- Inserir uma linha em `meeting_resources` referenciando esse PDF para **cada encontro de cada mentorado** (kind `pdf`, título "Livro-base: SPIN Selling"), para aparecer no Repositório desde o Onboarding e permanecer disponível ao longo da mentoria.
- Backfill via tool de inserção para mentorados já existentes; o `provision_mentee` passa a criar essa linha automaticamente para novos mentorados.

## 2. Cronograma e materiais alinhados a SPIN

Atualizar `meeting_templates`, `homework_templates` e seedar `meeting_resources` (descrições/links de capítulos do livro) com a seguinte estrutura:

| # | Encontro | Foco SPIN | Materiais |
|---|----------|-----------|-----------|
| 1 | Onboarding (40 min) | Diagnóstico inicial + setup | Livro completo + leitura sugerida cap. 1 (Comportamento de quem vende) |
| 2 | Situação | Perguntas de **Situação** – mapeamento de contexto do cliente | Cap. 2–3, template de roteiro de descoberta |
| 3 | Problema | Perguntas de **Problema** – identificação de dores reais | Cap. 4, checklist de dores por segmento |
| 4 | Implicação | Perguntas de **Implicação** – ampliação da consequência | Cap. 5, exemplos por vertical |
| 5 | Necessidade de Solução | Perguntas de **Need-payoff** – cliente verbaliza o ganho | Cap. 6, roteiro de fechamento consultivo |
| 6 | Demonstração de Capacidade | Benefícios x Características, prevenção de objeções | Cap. 7–8, framework FAB→Benefício |
| 7 | Compromisso & Continuidade | Avanços, fechamentos e plano pós-venda | Cap. 9–10, plano de 90 dias |

Tarefas (`homework_templates`) reescritas em cima dessa lógica (1 a 2 tarefas por encontro, focadas em aplicar o capítulo correspondente em pipeline real).

## 3. Materiais extras por mentorado

- A tabela `meeting_resources` já permite vincular recurso a um `meeting_id` específico de um mentorado individual — RLS dá `ALL` para `admin`, então não precisa mudar schema.
- Adicionar uma seção **"Adicionar material"** na aba Repositório, visível **apenas para admin** (via `has_role`), com:
  - Select de mentorado
  - Select do encontro
  - Tipo (vídeo / pdf / link)
  - Título + URL (ou upload para o bucket `mentee-evidence`, reutilizado para materiais)
- Mentorado continua vendo na aba Repositório, com tag "Personalizado" para diferenciar do conteúdo padrão.

## 4. Detalhes técnicos

- **Asset**: `lovable-assets create --file /mnt/user-uploads/Spin-Selling-Alcancando-Excelencia-Em-Vendas-2.pdf --filename spin-selling.pdf > src/assets/spin-selling.pdf.asset.json`.
- **Migração** (`meeting_templates`, `homework_templates`, `provision_mentee`): substitui títulos/descrições para a estrutura SPIN; `provision_mentee` passa a inserir o PDF do livro como recurso global de cada encontro novo.
- **Insert (data)** para mentorados existentes: `UPDATE meetings SET title/description` por `sequence`, regenera `homework_tasks` (apaga as não-concluídas e recria do template) e popula `meeting_resources` faltantes com o PDF + capítulos.
- **Frontend**:
  - `RepositorioTab.tsx`: adicionar painel admin (form de upload/link) condicionado a `has_role('admin')`; badge "Personalizado" quando o recurso pertence a apenas 1 mentorado.
  - Nenhum recurso novo precisa ser criado fora isso — `CronogramaTab` já consome o título/descrição atualizado.

## Fora do escopo (pergunto antes de fazer)

- Não vou reescrever a aba Tarefas — apenas substituir o conteúdo dos templates.
- Materiais extras por mentorado serão **manuais** (admin adiciona pela UI). Não vou criar automação de "kit por segmento" agora.
- O PDF fica como anexo único do livro; os "capítulos" referenciados nos cards serão links com `#page=` quando útil (não fatiarei o PDF em arquivos separados).
