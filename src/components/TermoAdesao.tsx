import jsPDF from "jspdf";

export const TERMO_ADESAO_VERSION = "v2-2026-06";

export type TermoData = {
  name?: string | null;
  cpf?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  province?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  email?: string | null;
  installments?: number;
  installmentValue?: number;
  totalValue?: number;
  accessMode?: "full" | "trial_then_paid" | "friend_promo";
  acceptedAt?: string | null;
};

const brl = (v?: number) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "R$ [valor]";

const fallback = (v?: string | null, ph = "[a preencher]") => (v && v.trim() ? v : ph);

const formatEndereco = (d: TermoData) => {
  const linha1 = [d.address, d.address_number].filter(Boolean).join(", ");
  const linha2 = [d.address_complement].filter(Boolean).join("");
  const linha3 = [d.province, d.city && `${d.city}${d.state ? "/" + d.state : ""}`].filter(Boolean).join(" — ");
  const cep = d.postal_code ? `CEP ${d.postal_code}` : "";
  const partes = [linha1, linha2, linha3, cep].filter(Boolean);
  return partes.length ? partes.join(", ") : "[endereço completo a preencher]";
};

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const formatDataExtenso = (iso?: string | null) => {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};

export function buildTermoSections(d: TermoData) {
  const inst = d.installments ?? 3;
  const valor = d.installmentValue ?? 187;
  const total = d.totalValue ?? valor * inst;
  const modalidadeNota =
    d.accessMode === "friend_promo"
      ? "Modalidade Promoção Amigo: 1ª mensalidade cortesia e 15% de desconto nas duas mensalidades subsequentes."
      : d.accessMode === "trial_then_paid"
      ? "Modalidade 3 encontros iniciais de avaliação: a primeira mensalidade é isenta; cobrança das duas mensalidades seguintes."
      : "Modalidade acesso completo: cobrança das três mensalidades.";

  return [
    {
      title: "TERMO DE ADESÃO E CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MENTORIA",
      body: "Pelo presente instrumento particular, as Partes abaixo qualificadas:",
    },
    {
      body:
        `CONTRATANTE (MENTORADO): ${fallback(d.name, "[Nome Completo do Mentorado]")}, inscrito(a) no CPF sob o nº ${fallback(d.cpf, "[000.000.000-00]")}, ` +
        `residente e domiciliado(a) em ${formatEndereco(d)}, com e-mail ${fallback(d.email, "[e-mail]")}, doravante denominado simplesmente como CONTRATANTE ou MENTORADO.`,
    },
    {
      body:
        "CONTRATADA (MENTOR): 66.956.549 GABRIEL LINCOLN VIEIRA PASSOS, Empresário Individual, inscrito no CNPJ/ME sob o nº 66.956.549/0001-62, com sede na Rua Valentim Passos, nº 25, Casa, Bairro Colônia do Marçal, no município de São João del Rei – MG, CEP 36.302-673, com endereço eletrônico cadastrado como gabrielvieira.pl@gmail.com, doravante denominado simplesmente como CONTRATADO ou MENTOR.",
    },
    {
      body: "Têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições dispostas a seguir:",
    },
    { heading: "CLÁUSULA PRIMEIRA – DO OBJETO" },
    { body: "1.1. O presente instrumento tem por objeto a prestação de serviços de mentoria profissional e consultoria de negócios pelo MENTOR em favor do MENTORADO, com foco em desenvolvimento estratégico, estruturação de processos e aceleração comercial." },
    { body: "1.2. O programa de mentoria — Mentoria Comercial 1:1 — compreende 06 (seis) encontros online ao vivo, individuais, distribuídos ao longo de 3 (três) meses, acesso ao Portal do Mentorado com cronograma, repositório de materiais, tarefas e métricas, e suporte assíncrono no período do programa." },
    { body: "1.3. Os serviços serão prestados de forma remota, utilizando-se de ferramentas de videoconferência de escolha do MENTOR." },

    { heading: "CLÁUSULA SEGUNDA – DA INEXISTÊNCIA DE GARANTIA DE RESULTADO DE MERCADO" },
    { body: "2.1. O MENTORADO declara-se ciente de que as orientações, metodologias e análises fornecidas pelo MENTOR constituem uma atividade de meio, e não de resultado." },
    { body: "2.2. O MENTOR não garante qualquer ganho financeiro decorrente da mentoria, nível de faturamento, captação de clientes ou sucesso comercial absoluto, uma vez que a implementação das estratégias e o sucesso do negócio dependem exclusivamente da execução, capacidade operacional e dedicação do próprio MENTORADO, bem como de variáveis imprevisíveis de mercado." },

    { heading: "CLÁUSULA TERCEIRA – DOS VALORES E FORMA DE PAGAMENTO" },
    { body: `3.1. Como contraprestação pelos serviços contratados, o MENTORADO pagará ao MENTOR a quantia total de ${brl(total)}, divididos em ${inst} (${inst === 2 ? "duas" : inst === 3 ? "três" : inst}) mensalidades de ${brl(valor)}.` },
    { body: `3.2. ${modalidadeNota}` },
    { body: "3.3. O pagamento é processado de forma recorrente (assinatura mensal) por meio da plataforma Asaas, podendo o MENTORADO optar entre PIX, boleto bancário ou cartão de crédito disponibilizados no checkout." },
    { body: "3.4. O atraso no pagamento de qualquer parcela ensejará a aplicação de multa moratória de 2% (dois por cento) sobre o valor devido, acrescido de juros de 1% (um por cento) ao mês e correção monetária, além do direito do MENTOR de suspender imediatamente o acesso do MENTORADO ao Portal do Mentorado, aos encontros e materiais até a integral regularização, bem como o envio de notificações de cobrança por e-mail, WhatsApp, SMS e demais canais legalmente permitidos." },

    { heading: "CLÁUSULA QUARTA – DA PROPRIEDADE INTELECTUAL E DIREITOS AUTORAIS" },
    { body: "4.1. Todos os materiais didáticos, slides, planilhas de gestão, apostilas, vídeos, áudios e metodologias disponibilizados durante a mentoria são de propriedade exclusiva do MENTOR, protegidos pela Lei de Direitos Autorais (Lei nº 9.610/98)." },
    { body: "4.2. É expressamente proibido ao MENTORADO copiar, reproduzir, plagiar, distribuir, comercializar, ratear, ceder a terceiros ou disponibilizar publicamente qualquer material ou gravação da mentoria, sob pena de rescisão imediata do contrato, perda do acesso e aplicação de multa punitiva equivalente a 10 (dez) vezes o valor total deste contrato, sem prejuízo de perdas e danos apurados judicialmente." },

    { heading: "CLÁUSULA QUINTA – DO DIREITO DE IMAGEM E REGISTRO AUDIOVISUAL" },
    { body: "5.1. O MENTORADO autoriza, de forma expressa, gratuita e por prazo indeterminado, que o MENTOR realize a gravação em áudio e vídeo de todas as sessões coletivas ou individuais de mentoria." },
    { body: "5.2. Fica autorizada a utilização de trechos das gravações, depoimentos textuais, capturas de tela e cases de sucesso pelo MENTOR para fins exclusivamente didáticos (em outras turmas de alunos) ou de publicidade legítima de seus serviços em redes sociais, sites ou eventos, em conformidade com as atividades autorizadas da empresa." },

    { heading: "CLÁUSULA SEXTA – DA CONFIDENCIALIDADE" },
    { body: "6.1. As Partes obrigam-se a manter total e absoluto sigilo sobre quaisquer dados operacionais, segredos de negócio, estratégias financeiras, faturamentos, ideias internas ou informações pessoais compartilhadas pela outra parte no decorrer da mentoria, não podendo revelá-las a terceiros sob nenhuma hipótese." },

    { heading: "CLÁUSULA SÉTIMA – DO DIREITO DE ARREPENDIMENTO E RESCISÃO" },
    { body: "7.1. Em observância ao Código de Defesa do Consumidor, o MENTORADO poderá exercer o seu direito de arrependimento no prazo de até 7 (sete) dias corridos a contar da data de assinatura ou pagamento deste termo, hipótese em que receberá o reembolso integral dos valores pagos." },
    { body: "7.2. Passado o prazo de arrependimento de 7 dias, caso o MENTORADO solicite o cancelamento imotivado da mentoria, aplicar-se-ão as seguintes regras: (a) será retido o valor proporcional às sessões de mentoria já disponibilizadas ou realizadas; (b) sobre o saldo restante a ser reembolsado, se houver, será aplicada multa rescisória de 20% (vinte por cento) a título de custos operacionais e reserva de vaga na agenda do MENTOR." },

    { heading: "CLÁUSULA OITAVA – DAS DISPOSIÇÕES GERAIS E FORO" },
    { body: "8.1. O presente contrato vincula as Partes e seus sucessores a qualquer título. A tolerância de qualquer das partes quanto ao descumprimento de obrigações não importará em novação ou renúncia de direitos." },
    { body: "8.2. Para dirimir quaisquer dúvidas ou controvérsias oriundas do presente instrumento, as partes elegem de comum acordo o Foro da Comarca de São João del Rei/MG, com renúncia expressa a qualquer outro por mais privilegiado que seja." },

    { body: "Por estarem assim justas e contratadas, as partes aceitam os termos do presente contrato mediante assinatura eletrônica ou confirmação de clique de adesão no ato da compra." },
    { body: `São João del Rei – MG, ${formatDataExtenso(d.acceptedAt)}.` },
    { body: "CONTRATADO: 66.956.549 GABRIEL LINCOLN VIEIRA PASSOS — CNPJ 66.956.549/0001-62" },
    { body: `CONTRATANTE: ${fallback(d.name, "[Nome do Mentorado]")} — CPF ${fallback(d.cpf, "[000.000.000-00]")}` },
    d.acceptedAt
      ? { body: `Aceite eletrônico registrado em ${new Date(d.acceptedAt).toLocaleString("pt-BR")} — versão ${TERMO_ADESAO_VERSION}.` }
      : { body: `Versão do termo: ${TERMO_ADESAO_VERSION}.` },
  ];
}

export function downloadTermoPdf(d: TermoData, filename = "termo-de-adesao-mentoria.pdf") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 18;
  const marginY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - marginX * 2;
  let y = marginY;

  const ensureSpace = (h: number) => {
    if (y + h > pageHeight - marginY) {
      doc.addPage();
      y = marginY;
    }
  };

  buildTermoSections(d).forEach((section, idx) => {
    if (section.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const lines = doc.splitTextToSize(section.title, usableWidth);
      ensureSpace(lines.length * 6 + 4);
      doc.text(lines, pageWidth / 2, y, { align: "center" });
      y += lines.length * 6 + 4;
    }
    if (section.heading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      const lines = doc.splitTextToSize(section.heading, usableWidth);
      ensureSpace(lines.length * 5 + 3);
      y += 2;
      doc.text(lines, marginX, y);
      y += lines.length * 5 + 2;
    }
    if (section.body) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(section.body, usableWidth);
      ensureSpace(lines.length * 4.6 + 2);
      doc.text(lines, marginX, y, { align: "justify", maxWidth: usableWidth });
      y += lines.length * 4.6 + 2;
    }
    if (idx === 0) y += 1;
  });

  doc.save(filename);
}

export default function TermoAdesao({ data }: { data?: TermoData }) {
  const sections = buildTermoSections(data ?? {});
  return (
    <div className="text-xs text-foreground/90 leading-relaxed space-y-2 max-h-72 overflow-y-auto border border-border rounded-md p-3 bg-muted/30">
      {sections.map((s, i) => (
        <div key={i}>
          {s.title && <p className="font-semibold text-[11px] uppercase tracking-wider text-center">{s.title}</p>}
          {s.heading && <p className="font-semibold mt-2">{s.heading}</p>}
          {s.body && <p className="text-justify">{s.body}</p>}
        </div>
      ))}
    </div>
  );
}
