import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ExternalLink, Handshake, Percent, ShieldCheck, Sparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import LeadFormDialog from "@/components/LeadFormDialog";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";
import acidelLogo from "@/assets/acidel-rei-logo.webp.asset.json";

const ACIDEL_URL = "https://acidelrei.com.br/";

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
    document.title = "Parceiros | Gabriel Consultor — Vantagens exclusivas para a rede";
  }, []);

  const openForm = () => {
    trackClick("cta", "parceiros_open_lead_form");
    setFormOpen(true);
  };

  const goAcidel = (label: string) => {
    trackClick("cta", label);
    window.open(ACIDEL_URL, "_blank", "noopener,noreferrer");
  };

  const beneficios = [
    {
      icon: Percent,
      title: "Descontos exclusivos",
      body: "Condições especiais negociadas para clientes, mentorados e parceiros da rede Gabriel Consultor.",
    },
    {
      icon: ShieldCheck,
      title: "Curadoria de marcas",
      body: "Parceiros selecionados pela qualidade do produto, atendimento e tradição no mercado em que atuam.",
    },
    {
      icon: Handshake,
      title: "Rede que gera negócio",
      body: "Conexões diretas com empresas, associações e lideranças que ampliam oportunidades comerciais.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Parceiros | Gabriel Consultor</title>
        <meta
          name="description"
          content="Conheça os parceiros oficiais do Gabriel Consultor. Descontos exclusivos e vantagens negociadas para clientes e mentorados — começando pela ACIDEL REI."
        />
        <link rel="canonical" href="https://gabrielconsultor.com/parceiros" />
        <meta property="og:title" content="Parceiros | Gabriel Consultor" />
        <meta
          property="og:description"
          content="Vantagens exclusivas com parceiros selecionados. Sou associado ACIDEL REI — descontos para a rede."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gabrielconsultor.com/parceiros" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Parceiros — Gabriel Consultor",
            url: "https://gabrielconsultor.com/parceiros",
            description:
              "Parceiros oficiais com descontos exclusivos para a rede Gabriel Consultor.",
          })}
        </script>
      </Helmet>

      <SiteHeader />

      <LeadFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        successTitle="Tudo certo."
        successBody="Recebi seus dados. Em breve te envio o acesso às vantagens dos parceiros."
      />

      <main className="bg-background text-foreground">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/[0.06]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="container max-w-6xl relative py-20 md:py-28">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
              className="max-w-3xl"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] font-medium text-primary">
                <Sparkles size={14} /> Programa de Parceiros
              </span>
              <h1 className="mt-5 font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
                Vantagens reais com quem a gente confia.
              </h1>
              <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl">
                Parceiros selecionados oferecem condições exclusivas para a rede Gabriel Consultor — clientes, mentorados e indicados. Curadoria curta, benefício direto.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={openForm}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
                >
                  Quero acessar as vantagens <ArrowRight size={16} />
                </button>
                <a
                  href="#parceiros"
                  className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-white/[0.08] transition-all"
                >
                  Ver parceiros
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="border-b border-white/[0.06]">
          <div className="container max-w-6xl py-16 md:py-20">
            <div className="grid md:grid-cols-3 gap-5">
              {beneficios.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center">
                    <b.icon size={20} />
                  </div>
                  <h3 className="mt-4 font-serif text-xl">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PARCEIROS */}
        <section id="parceiros" className="border-b border-white/[0.06]">
          <div className="container max-w-6xl py-16 md:py-24">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-primary font-mono">Parceiros oficiais</p>
                <h2 className="mt-2 font-serif text-3xl md:text-4xl">Quem está com a gente</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Lista em expansão. Novos parceiros são anunciados aqui à medida que os acordos são fechados.
              </p>
            </div>

            {/* ACIDEL REI */}
            <motion.article
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              custom={0}
              className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 md:p-12"
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
              <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center relative">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-primary">
                    <BadgeCheck size={13} /> Sou associado
                  </div>
                  <h3 className="mt-4 font-serif text-3xl md:text-4xl">ACIDEL REI</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-mono">
                    Associação Comercial, Industrial e de Serviços de Del Rei
                  </p>
                  <p className="mt-5 text-base md:text-lg text-foreground/85 leading-relaxed max-w-xl">
                    Como associado da <strong>ACIDEL REI</strong>, ofereço acesso às vantagens negociadas pela associação: <strong>descontos exclusivos</strong>, convênios com fornecedores, eventos de relacionamento e a rede empresarial da região.
                  </p>
                  <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                    {[
                      "Descontos em convênios da rede",
                      "Acesso a eventos e workshops",
                      "Networking com associados",
                      "Suporte jurídico e empresarial",
                    ].map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-muted-foreground">{it}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      onClick={() => goAcidel("parceiros_acidel_site")}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
                    >
                      Acessar acidelrei.com.br <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={openForm}
                      className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-5 py-3 rounded-full hover:bg-white/[0.08] transition-all"
                    >
                      Quero o desconto
                    </button>
                  </div>
                </div>

                <div className="relative flex justify-center">
                  <div className="aspect-square w-full max-w-[320px] rounded-2xl border border-white/[0.08] bg-white p-6 flex flex-col items-center justify-between shadow-lg overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex-1 flex items-center justify-center">
                      <img 
                        src={acidelLogo.url} 
                        alt="Logo ACIDEL REI" 
                        className="max-h-[180px] w-auto object-contain"
                      />
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      <Handshake size={14} className="text-[#C4632D]" />
                      Parceiro oficial
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Placeholder próximos */}
            <div className="mt-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Novos parceiros em breve. Quer ser um parceiro?{" "}
                <button onClick={openForm} className="text-primary hover:underline font-medium">
                  Fale com a gente
                </button>
                .
              </p>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.15),transparent_60%)]" />
          <div className="container max-w-4xl relative py-20 md:py-28 text-center">
            <h2 className="font-serif text-3xl md:text-5xl tracking-tight">
              Pegue o desconto. Use a rede.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Deixe seu contato e te envio as instruções de acesso às vantagens com os parceiros — começando pela ACIDEL REI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={openForm}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-6 py-3.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
              >
                Quero acessar agora <ArrowRight size={16} />
              </button>
              <button
                onClick={() => goAcidel("parceiros_cta_acidel")}
                className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] text-foreground text-sm font-medium px-6 py-3.5 rounded-full hover:bg-white/[0.08] transition-all"
              >
                Visitar ACIDEL REI <ExternalLink size={15} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Parceiros;
