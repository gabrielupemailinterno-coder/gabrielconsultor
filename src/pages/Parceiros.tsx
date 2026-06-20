import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Handshake,
  LineChart,
  Quote,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import LeadFormDialog from "@/components/LeadFormDialog";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";
import acidelLogo from "@/assets/acidel-rei-logo.webp.asset.json";

const ACIDEL_URL = "https://acidelrei.com.br/";
const DESCONTO = "até 30%";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" as const },
  }),
};

const Parceiros = () => {
  const [formOpen, setFormOpen] = useState(false);
  useAnalytics("/parceiros");

  useEffect(() => {
    document.title = "Associado ACIDEL REI tem desconto | Gabriel Consultor";
  }, []);

  const openForm = (label: string) => {
    trackClick("cta", label);
    setFormOpen(true);
  };

  const goAcidel = (label: string) => {
    trackClick("cta", label);
    window.open(ACIDEL_URL, "_blank", "noopener,noreferrer");
  };

  const servicos = [
    {
      icon: Target,
      tag: "Consultoria comercial",
      title: "Consultoria de 4 semanas",
      body:
        "Diagnóstico + reestruturação do processo comercial: funil, qualificação, abordagem, follow-up e métricas. Saída com playbook implementado e time treinado.",
      bullets: [
        "Mapa do funil e gargalos atuais",
        "Scripts e cadência de prospecção",
        "Painel de indicadores comerciais",
      ],
    },
    {
      icon: TrendingUp,
      tag: "Mentoria estratégica",
      title: "Mentoria de 8 a 12 semanas",
      body:
        "Acompanhamento executivo semanal com dono e liderança. Foco em decisão, prioridade e execução do que move receita.",
      bullets: [
        "Sessões 1:1 com o dono",
        "Rituais de gestão e cadência",
        "Plano de crescimento trimestral",
      ],
    },
  ];

  const resultados = [
    { kpi: "+38%", label: "ticket médio em 90 dias" },
    { kpi: "2,4x", label: "taxa de conversão do funil" },
    { kpi: "15+", label: "empresas reestruturadas" },
  ];

  return (
    <>
      <Helmet>
        <title>Associado ACIDEL REI tem desconto | Gabriel Consultor</title>
        <meta
          name="description"
          content={`Sou associado ACIDEL REI. Associados têm ${DESCONTO} de desconto na consultoria comercial e na mentoria estratégica do Gabriel Consultor. Processo, execução e resultado.`}
        />
        <link rel="canonical" href="https://gabrielconsultor.com/parceiros" />
        <meta property="og:title" content="Associado ACIDEL REI tem desconto | Gabriel Consultor" />
        <meta
          property="og:description"
          content={`Desconto exclusivo de ${DESCONTO} para associados da ACIDEL REI na consultoria e mentoria do Gabriel Consultor.`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gabrielconsultor.com/parceiros" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Offer",
            name: "Desconto para associados ACIDEL REI",
            description: `Desconto de ${DESCONTO} na consultoria comercial e na mentoria estratégica do Gabriel Consultor para associados da ACIDEL REI.`,
            url: "https://gabrielconsultor.com/parceiros",
            seller: {
              "@type": "Person",
              name: "Gabriel Consultor",
            },
          })}
        </script>
      </Helmet>

      <SiteHeader />

      <LeadFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        successTitle="Recebi seus dados."
        successBody="Em breve te envio as condições com o desconto de associado ACIDEL REI."
      />

      <main className="bg-background text-foreground">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="container max-w-6xl relative py-20 md:py-28">
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                  <img src={acidelLogo.url} alt="ACIDEL REI" className="h-5 w-auto" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-primary">
                    Parceria oficial
                  </span>
                </div>
                <h1 className="mt-5 font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
                  Associado ACIDEL REI tem{" "}
                  <span className="text-primary">{DESCONTO} de desconto</span> na minha consultoria e mentoria.
                </h1>
                <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">
                  Sou associado da ACIDEL REI. Como reconhecimento à rede empresarial de São João del-Rei e região, ofereço uma condição exclusiva para associados que querem reestruturar o comercial e crescer com método.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => openForm("parceiros_hero_quero_desconto")}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
                  >
                    Quero meu desconto de associado <ArrowRight size={16} />
                  </button>
                  <a
                    href="#servicos"
                    onClick={() => trackClick("cta", "parceiros_hero_ver_servicos")}
                    className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-white/[0.08] transition-all"
                  >
                    Ver o que está incluso
                  </a>
                </div>
                <p className="mt-4 text-xs text-muted-foreground font-mono">
                  Válido mediante apresentação da carteirinha ou comprovante de associado.
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="relative"
              >
                <div className="relative rounded-3xl border-2 border-dashed border-primary/30 bg-white/[0.02] p-8 md:p-10 flex flex-col items-center justify-center text-center overflow-hidden min-h-[380px] shadow-[inset_0_0_40px_rgba(196,99,45,0.05)]">
                  {/* Decorative circles to look like a ticket */}
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border-r border-primary/20" />
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border-l border-primary/20" />
                  
                  <div className="w-24 h-24 rounded-2xl bg-white p-4 flex items-center justify-center mb-6 shadow-lg">
                    <img src={acidelLogo.url} alt="ACIDEL REI" className="max-h-full max-w-full object-contain" />
                  </div>
                  
                  <div className="font-mono uppercase tracking-[0.2em] text-primary text-xs font-semibold">
                    BENEFÍCIO PARCEIRO
                  </div>
                  
                  <h3 className="mt-3 font-serif text-3xl text-foreground font-semibold">
                    Até 30% OFF
                  </h3>
                  
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Exclusivo para empresários e profissionais associados à ACIDEL REI
                  </p>
                  
                  <div className="mt-8 pt-6 border-t border-white/[0.08] w-full flex flex-col items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <div>CÓDIGO: PARCERIA_ACIDEL</div>
                    <div>SÃO JOÃO DEL-REI · MG</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SOBRE / CASE */}
        <section className="border-b border-white/[0.06]">
          <div className="container max-w-6xl py-16 md:py-20">
            <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 md:gap-16 items-start">
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-primary font-mono">Quem está por trás</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl leading-tight">
                  Processo comercial é o que separa empresa que cresce de empresa que vive de sorte.
                </h2>
              </div>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
                <p>
                  Sou Gabriel, consultor e mentor de empresários que querem profissionalizar a operação comercial. Trabalho com dono, não só com vendedor. Foco em <strong className="text-foreground">processo, métrica e execução</strong> — não em teoria de palco.
                </p>
                <p>
                  Já reestruturei o comercial de mais de 15 empresas em setores como serviços, indústria, varejo e B2B técnico. O resultado vem do mesmo lugar todas as vezes: funil claro, time treinado, ritual de gestão e métrica honesta.
                </p>
              </div>
            </div>

            <div className="mt-12 grid sm:grid-cols-3 gap-4">
              {resultados.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <div className="font-mono text-4xl text-primary tracking-tight">{r.kpi}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{r.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVIÇOS */}
        <section id="servicos" className="border-b border-white/[0.06]">
          <div className="container max-w-6xl py-16 md:py-24">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-primary font-mono">O que está incluso no desconto</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">Meus produtos</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
                <Tag size={15} className="text-primary" />
                <span className="text-foreground">
                  <span className="text-primary font-mono font-semibold">{DESCONTO} OFF</span> para associados
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {servicos.map((s, i) => (
                <motion.article
                  key={s.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  custom={i}
                  className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col"
                >
                  <div className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider">
                    <BadgeCheck size={12} /> {DESCONTO} OFF
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center">
                    <s.icon size={20} />
                  </div>
                  <p className="mt-4 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{s.tag}</p>
                  <h3 className="mt-1 font-serif text-2xl">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/85">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => openForm(`parceiros_servico_${s.tag.toLowerCase().replace(/\s+/g, "_")}`)}
                    className="mt-6 inline-flex items-center gap-2 self-start border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/[0.08] transition-all"
                  >
                    Quero esse com desconto <ArrowRight size={15} />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA O DESCONTO */}
        <section className="border-b border-white/[0.06]">
          <div className="container max-w-6xl py-16 md:py-20">
            <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
              <div className="rounded-3xl border border-white/[0.08] bg-white p-8 flex flex-col items-center text-center">
                <img src={acidelLogo.url} alt="ACIDEL REI" className="max-h-32 w-auto" />
                <p className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-slate-500">
                  Associação Comercial · São João del-Rei
                </p>
                <button
                  onClick={() => goAcidel("parceiros_acidel_site")}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#C4632D] hover:underline"
                >
                  acidelrei.com.br <ExternalLink size={14} />
                </button>
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-primary font-mono">Como funciona</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">Três passos para garantir o desconto</h2>
                <ol className="mt-8 space-y-5">
                  {[
                    {
                      n: "01",
                      t: "Confirme que você é associado",
                      d: "Carteirinha, e-mail institucional ou comprovante da ACIDEL REI.",
                    },
                    {
                      n: "02",
                      t: "Conversa de diagnóstico",
                      d: "Entendo o momento da sua empresa e indico consultoria ou mentoria — sem empurrar pacote.",
                    },
                    {
                      n: "03",
                      t: "Proposta com {DESCONTO} já aplicado",
                      d: "Você recebe a proposta com o desconto de associado já no valor final. Sem letra miúda.",
                    },
                  ].map((p) => (
                    <li key={p.n} className="flex gap-4">
                      <div className="font-mono text-primary text-sm pt-1 shrink-0">{p.n}</div>
                      <div>
                        <div className="font-serif text-lg">{p.t.replace("{DESCONTO}", DESCONTO)}</div>
                        <p className="text-sm text-muted-foreground mt-1">{p.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* PROVA SOCIAL */}
        <section className="border-b border-white/[0.06]">
          <div className="container max-w-4xl py-16 md:py-20">
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 md:p-12 relative">
              <Quote size={36} className="text-primary/40" />
              <blockquote className="mt-4 font-serif text-2xl md:text-3xl leading-snug">
                "Em três meses o comercial virou outra empresa. Parou de depender de mim para cada negociação. Hoje tenho funil, métrica e previsibilidade."
              </blockquote>
              <div className="mt-6 flex items-center gap-3 text-sm">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary inline-flex items-center justify-center font-mono">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-medium">Empresário do setor de serviços</div>
                  <div className="text-muted-foreground text-xs font-mono uppercase tracking-wider">
                    Mentoria estratégica · 12 semanas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.18),transparent_60%)]" />
          <div className="container max-w-4xl relative py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary">
              <Sparkles size={13} /> Exclusivo associados ACIDEL REI
            </div>
            <h2 className="mt-5 font-serif text-3xl md:text-5xl tracking-tight">
              É associado? Então é seu por <span className="text-primary">{DESCONTO} a menos</span>.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Deixe seu contato. Te chamo para uma conversa de diagnóstico e te mando a proposta com o desconto já aplicado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => openForm("parceiros_cta_final")}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-6 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
              >
                Quero meu desconto <ArrowRight size={16} />
              </button>
              <button
                onClick={() => goAcidel("parceiros_cta_acidel")}
                className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-6 py-3.5 rounded-full hover:bg-white/[0.08] transition-all"
              >
                Conheça a ACIDEL REI <ExternalLink size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Parceiros;
