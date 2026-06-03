import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Target,
  TrendingDown,
  Workflow,
  Users,
  Database,
  Sparkles,
  GraduationCap,
  Trophy,
  Calendar,
  ArrowRight,
  Linkedin,
  Instagram,
  MapPin,
  MessageCircle,
  Mail,
  Check,
  Briefcase,
  Compass,
  Star,
} from "lucide-react";
import LeadFormDialog from "@/components/LeadFormDialog";
import QuickContactDialog from "@/components/QuickContactDialog";
import QualifyingForm from "@/components/QualifyingForm";
import type { FormType } from "@/lib/qualifying-forms";
import SiteHeader from "@/components/SiteHeader";
import gabrielPhoto from "@/assets/gabriel-g4-hero.jpg.asset.json";
import monogramaFull from "@/assets/monograma-gv-full-tpn.png.asset.json";
import monogramaMark from "@/assets/monograma-gv-tpn.png.asset.json";
import { useLocale } from "@/contexts/LocaleContext";
import { indexCopy } from "@/locales/copy";

const CALENDAR_URL = "https://calendar.app.google/1GgJUz3DD3KuznGMA";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=5532998316501&text=Ol%C3%A1%2C%20gostaria%20de%20saber%20como%20funciona%20o%20diagn%C3%B3stico";
const LINKEDIN_URL = "https://www.linkedin.com/in/gabrielvieirapassos/";
const INSTAGRAM_URL = "https://www.instagram.com/gabrielvieira.z/";
const GOOGLE_PROFILE_URL = "https://share.google/naQLLA5qD0Xg5af5m";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const painIcons = [Target, TrendingDown, Workflow, Users];
const serviceIcons = [Workflow, Database, Sparkles, GraduationCap];
const packageIcons = [Briefcase, Compass];
const Index = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [qualifyingType, setQualifyingType] = useState<Exclude<FormType, "contato"> | null>(null);
  const { locale, formatPrice } = useLocale();
  const c = indexCopy[locale];
  useAnalytics("/");
  const [latestPosts, setLatestPosts] = useState<Array<{ id: string; title: string; slug: string; excerpt: string | null; cover_image_url: string | null; published_at: string | null }>>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,cover_image_url,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3);
      setLatestPosts(data || []);
    })();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("a, button");
      if (!t) return;
      const label = (t.getAttribute("data-track") || t.textContent || "").trim().slice(0, 120);
      const type = t.tagName.toLowerCase() === "a" ? "link" : "button";
      if (label) trackClick(type, label);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const [calendarGate, setCalendarGate] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const openForm = () => { trackClick("cta", "open_lead_form"); setCalendarGate(false); setFormOpen(true); };
  const openQualifying = (t: Exclude<FormType, "contato">) => {
    trackClick("cta", `open_form_${t}`);
    setQualifyingType(t);
  };
  const openCalendar = () => {
    trackClick("cta", "open_calendar_gate");
    setCalendarGate(true);
    setFormOpen(true);
  };
  const openWhatsapp = (label: string) => {
    trackClick("cta", label);
    setWaOpen(true);
  };
  const goToCalendar = () => {
    window.open(CALENDAR_URL, "_blank", "noopener,noreferrer");
  };
  const goToWhatsapp = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <Helmet>
        <html lang={locale === "pt" ? "pt-BR" : "en"} />
        <title>{c.metaTitle}</title>
        <meta name="description" content={c.metaDesc} />
        <link rel="canonical" href="https://gabrielconsultor.com/" />
        <meta property="og:title" content={c.metaTitle} />
        <meta property="og:description" content={c.ogDesc} />
        <meta property="og:url" content="https://gabrielconsultor.com/" />
      </Helmet>
      <LeadFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setCalendarGate(false); }}
        onSuccess={calendarGate ? goToCalendar : undefined}
        successTitle={calendarGate ? (locale === "pt" ? "Tudo certo. Abrindo a agenda…" : "All set. Opening calendar…") : undefined}
        successBody={calendarGate ? (locale === "pt" ? "Recebi seus contatos. Escolha um horário pra gente conversar." : "Got your contacts. Pick a time to talk.") : undefined}
      />
      <QuickContactDialog
        open={waOpen}
        onClose={() => setWaOpen(false)}
        onSuccess={goToWhatsapp}
      />
      {qualifyingType && (
        <QualifyingForm
          open={!!qualifyingType}
          onClose={() => setQualifyingType(null)}
          formType={qualifyingType}
        />
      )}

      <SiteHeader />





      {/* Hero */}
      <section className="section-padding flex items-center justify-center min-h-[92vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container max-w-4xl text-center relative z-10">
          <motion.img
            src={monogramaMark.url}
            alt="Gabriel Vieira — monograma GV"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="mx-auto h-48 md:h-64 w-auto mb-8"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-primary tracking-[0.25em] uppercase text-xs font-sans font-medium mb-6"
          >
            {c.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl lg:text-[3.4rem] leading-[1.1] font-bold mb-6"
          >
            {c.heroTitleA} <span className="text-primary">{c.heroTitleB}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {c.heroDesc}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={openCalendar}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <Calendar size={16} />
              {c.ctaScheduleDiag}
            </button>
            <button
              onClick={() => openWhatsapp("open_whatsapp_hero")}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <MessageCircle size={16} />
              {c.ctaWhatsapp}
            </button>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 text-foreground/80 font-sans font-medium text-sm tracking-wide uppercase px-3 py-4 hover:text-primary transition-colors"
            >
              {c.ctaProposal}
              <ArrowRight size={16} />
            </button>
          </motion.div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Pain Points */}
      <section className="section-padding">
        <div className="container max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="font-serif text-2xl md:text-3xl text-center mb-4"
          >
            {c.painHeading}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-muted-foreground text-center max-w-xl mx-auto mb-14"
          >
            {c.painSubheading}
          </motion.p>
          <div className="grid md:grid-cols-2 gap-6">
            {c.painPoints.map((item, i) => {
              const Icon = painIcons[i];
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="card-hover bg-card border border-border rounded-lg p-6"
                >
                  <Icon className="text-primary mb-4" size={28} strokeWidth={1.5} />
                  <h3 className="font-serif text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* About */}
      <section id="sobre" className="section-padding">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-[260px_1fr] gap-10 md:gap-14 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="mx-auto md:mx-0"
            >
              <div className="relative mx-auto md:mx-0 w-56 h-56 md:w-64 md:h-64">
                <div className="absolute -inset-2 rounded-full bg-primary/10 blur-2xl" />
                <img
                  src={gabrielPhoto.url}
                  alt={c.aboutPhotoAlt}
                  loading="lazy"
                  className="relative w-full h-full object-cover object-[center_15%] rounded-full border-2 border-primary/40 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.4)]"
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
            >
              <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
                {c.aboutEyebrow}
              </span>
              <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-5">{c.aboutHeading}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {c.aboutPreposicao}{" "}
                  <strong className="text-foreground">{c.aboutP1Strong1}</strong>
                  {c.aboutP1Mid}
                  <strong className="text-foreground">{c.aboutP1Strong2}</strong>
                  {c.aboutP1End}
                  <strong className="text-foreground">{c.aboutP1Brand1}</strong>,{" "}
                  <strong className="text-foreground">{c.aboutP1Brand2}</strong>{" "}
                  {locale === "pt" ? "e" : "and"}{" "}
                  <strong className="text-foreground">{c.aboutP1Brand3}</strong>
                  {c.aboutP1Tail}
                </p>
                <p>
                  {c.aboutP2Pre}
                  <strong className="text-foreground">{c.aboutP2Brand}</strong>
                  {c.aboutP2Mid}
                  <strong className="text-foreground">{c.aboutP2Strong1}</strong>
                  {c.aboutP2AndIn}
                  <strong className="text-foreground">{c.aboutP2Strong2}</strong>
                  {c.aboutP2Tail}
                </p>
                <p>{c.aboutP3}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Empresas onde atuei */}
      <section id="empresas" className="section-padding bg-secondary/30">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="max-w-3xl mb-10"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium font-mono">
              {locale === "pt" ? "Trajetória" : "Track record"}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3 mb-4 leading-tight">
              {locale === "pt" ? (
                <>Empresas onde <span className="text-primary">atuei</span></>
              ) : (
                <>Companies I've <span className="text-primary">worked with</span></>
              )}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {locale === "pt"
                ? "Indústria, agro, energia, serviços e agência. Operações de R$10MI a R$1BI — vendas complexas, ciclo longo, time grande e meta dura."
                : "Industry, agro, energy, services and agency. R$10M to R$1B operations — complex sales, long cycles, large teams and hard targets."}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { name: "Seara", sector: locale === "pt" ? "Indústria · Alimentos" : "Industry · Food" },
              { name: "Rivelli", sector: locale === "pt" ? "Indústria · Alimentos" : "Industry · Food" },
              { name: "Grupo Ascenário", sector: locale === "pt" ? "Holding · Multissetor" : "Holding · Multi-sector" },
              { name: "Cashsol", sector: locale === "pt" ? "Energia por assinatura" : "Energy subscription" },
              { name: "Praia", sector: locale === "pt" ? "Marketing & Comunicação" : "Marketing & Comms" },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                className="border border-border bg-card rounded-md p-5 flex flex-col justify-between min-h-[120px] hover:border-primary/50 transition-colors"
              >
                <div className="font-serif text-xl text-foreground leading-tight">{c.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-3">{c.sector}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Números & Cases reais */}
      <section id="numeros" className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="max-w-3xl mb-12"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium font-mono">
              {locale === "pt" ? "Números · Cases reais" : "Numbers · Real cases"}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3 mb-4 leading-tight">
              {locale === "pt" ? (
                <>Número fechado. <span className="text-primary">Processo por trás.</span></>
              ) : (
                <>Closed number. <span className="text-primary">Process behind it.</span></>
              )}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {locale === "pt"
                ? "Três operações que passaram pela minha mão. Métrica dura, contexto curto e o que destravou — pra você comparar com o seu cenário."
                : "Three operations that came across my desk. Hard metric, short context and what unlocked it — so you can benchmark against your scenario."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Case 1 — R$1MI */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="border border-border bg-card rounded-md p-7 flex flex-col"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">Case 01 · Processo comercial</div>
              <div className="font-mono text-5xl md:text-6xl text-foreground leading-none mb-2">R$ 1MI+</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-5">
                {locale === "pt" ? "em contratos · 2 meses" : "in contracts · 2 months"}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {locale === "pt"
                  ? "Reestruturei o funil em 4 etapas (cadastro, proposta, follow-up, contrato), eliminei gargalo no follow-up e padronizei a proposta. Resultado: mais de R$1MI em contratos fechados em 60 dias."
                  : "Restructured the funnel into 4 stages, removed follow-up bottleneck and standardized the proposal. Result: $200K+ closed in 60 days."}
              </p>
              <Link
                to="/blog/processo-comercial-r1-milh%C3%A3o-contratos-2-meses"
                className="text-xs font-mono uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-2"
              >
                {locale === "pt" ? "Ler o case completo" : "Read the full case"} <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>

            {/* Case 2 — LinkedIn SalesOps + CS */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={2}
              className="border border-border bg-card rounded-md p-7 flex flex-col"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">Case 02 · SalesOps + CS</div>
              <div className="font-mono text-5xl md:text-6xl text-foreground leading-none mb-2">+38%</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-5">
                {locale === "pt" ? "retenção · energia por assinatura" : "retention · energy subscription"}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {locale === "pt"
                  ? "Operação de energia por assinatura travada em churn alto. Implementei rituais de SalesOps + playbook de Customer Success, encurtei o ciclo de onboarding e padronizei a régua de saúde do cliente."
                  : "Energy subscription stuck on high churn. Implemented SalesOps rituals + CS playbook, shortened onboarding and standardized customer health scoring."}
              </p>
              <a
                href="https://www.linkedin.com/posts/gabrielvieirapassos_salesops-customersuccess-energiaporassinatura-share-7457630474077859840-WV_h/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-2"
              >
                {locale === "pt" ? "Ver post no LinkedIn" : "View LinkedIn post"} <ArrowRight className="w-3 h-3" />
              </a>
            </motion.div>

            {/* Case 3 — PDCA */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={3}
              className="border border-border bg-card rounded-md p-7 flex flex-col"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">Case 03 · Método PDCA</div>
              <div className="font-mono text-5xl md:text-6xl text-foreground leading-none mb-2">4x</div>
              <div className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-5">
                {locale === "pt" ? "velocidade de melhoria" : "improvement velocity"}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {locale === "pt"
                  ? "Apliquei PDCA (Plan, Do, Check, Act) como rotina semanal no comercial: cada gargalo virou hipótese, teste e medição. Ciclo de melhoria que era trimestral passou a entregar ganho toda semana."
                  : "Applied PDCA as a weekly sales routine: every bottleneck became a hypothesis, test and measurement. A quarterly improvement cycle became weekly gains."}
              </p>
              <a
                href="https://www.linkedin.com/feed/update/urn:li:activity:6915252126822653952/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono uppercase tracking-widest text-primary hover:underline inline-flex items-center gap-2"
              >
                {locale === "pt" ? "Ver post no LinkedIn" : "View LinkedIn post"} <ArrowRight className="w-3 h-3" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* O que é ser gestor de Growth & Marketing — conteúdo G4 */}
      <section id="formacao" className="section-padding bg-secondary/30">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="max-w-3xl mb-12"
          >
            <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-medium tracking-wide uppercase px-4 py-1.5 rounded-full mb-5">
              <Trophy size={14} strokeWidth={2} />
              {c.badge}
            </div>
            <span className="block text-primary text-xs tracking-[0.25em] uppercase font-medium font-mono">
              {locale === "pt" ? "Capacitações · Formação contínua · G4 Educação" : "Training · Continuous education · G4 Educação"}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3 mb-4 leading-tight">
              {locale === "pt" ? (
                <>O que é, na prática, ser <span className="text-primary">gestor de Growth & Marketing</span></>
              ) : (
                <>What it really means to be a <span className="text-primary">Growth & Marketing manager</span></>
              )}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {locale === "pt"
                ? "Não é rodar campanha nem postar conteúdo. É arquitetar receita: escolher canal certo, validar com experimento, qualificar a entrada e construir marca que sustenta o CAC no longo prazo. Esses são os pilares que estudo no G4 e aplico nos clientes."
                : "It's not running ads or posting content. It's architecting revenue: picking the right channel, validating with experiments, qualifying inbound and building a brand that sustains CAC long term. These are the pillars I study at G4 and apply with clients."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                tag: "01 · Estratégia de Canal",
                author: "Dener Lippert",
                title: locale === "pt" ? "Escolher onde competir" : "Choosing where to compete",
                body: locale === "pt"
                  ? "Canal certo > canal popular. Diagnóstico de fit entre ticket, ciclo de venda e maturidade do mercado antes de gastar 1 real em mídia."
                  : "Right channel > popular channel. Diagnosing fit between ticket, sales cycle and market maturity before spending a dollar on ads.",
              },
              {
                tag: "02 · Experimentação",
                author: "Gabriel Costa (Mineiro)",
                title: locale === "pt" ? "Hipótese, teste, leitura" : "Hypothesis, test, read",
                body: locale === "pt"
                  ? "Growth é método, não sorte. Backlog priorizado por ICE, ciclo curto de experimento e leitura honesta do que escalar e do que matar."
                  : "Growth is method, not luck. ICE-prioritized backlog, short experiment loops and honest reads on what to scale and what to kill.",
              },
              {
                tag: "03 · Canais de Aquisição",
                author: "Diógenes Malaquias",
                title: locale === "pt" ? "Mídia paga com governança" : "Paid media with governance",
                body: locale === "pt"
                  ? "Estrutura de conta, modelagem de bid, criativos rotacionados por hipótese e leitura do CAC por origem — não por plataforma."
                  : "Account structure, bid modeling, creatives rotated by hypothesis and CAC read by source — not by platform.",
              },
              {
                tag: "04 · Atração & Conversão",
                author: "Allan Barros",
                title: locale === "pt" ? "Funil que qualifica antes de vender" : "Funnel that qualifies before selling",
                body: locale === "pt"
                  ? "Página, formulário e nutrição desenhados pra filtrar — o time comercial só atende lead que cabe no ICP. Conversão sobe, CAC cai."
                  : "Pages, forms and nurturing designed to filter — sales only handles ICP-fit leads. Conversion rises, CAC drops.",
              },
              {
                tag: "05 · Marca & Legado",
                author: "Marcela Rezende",
                title: locale === "pt" ? "Marca que reduz custo de venda" : "Brand that lowers selling cost",
                body: locale === "pt"
                  ? "Posicionamento, narrativa e consistência transformam tráfego em demanda recorrente. Marca forte é a única alavanca que faz o CAC cair com o tempo."
                  : "Positioning, narrative and consistency turn traffic into recurring demand. Strong brand is the only lever that lowers CAC over time.",
              },
              {
                tag: "06 · Arquitetura de Receita",
                author: locale === "pt" ? "Aplicação direta" : "Direct application",
                title: locale === "pt" ? "Tudo conectado ao P&L" : "Everything tied to P&L",
                body: locale === "pt"
                  ? "Cada pilar acima vira meta, processo e indicador no comercial do cliente. Marketing não é centro de custo — é motor de receita previsível."
                  : "Every pillar above becomes a target, process and KPI in the client's sales engine. Marketing isn't a cost center — it's a predictable revenue engine.",
              },
            ].map((p, i) => (
              <motion.article
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                className="border border-border bg-card rounded-md p-6 hover:border-primary/50 transition-colors"
              >
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">{p.tag}</div>
                <h3 className="font-serif text-xl mb-2 leading-snug">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.body}</p>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70 pt-3 border-t border-border">
                  {locale === "pt" ? "Conteúdo G4 · " : "G4 content · "}{p.author}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Google Reviews */}
      <section id="avaliacoes" className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.reviewsEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              {c.reviewsHeading}
            </h2>
            <div className="flex items-center justify-center gap-3 mb-3" aria-label={c.reviewsRatingLabel}>
              <span className="font-serif text-3xl font-bold text-foreground">5,0</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="text-primary fill-primary" size={20} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-muted-foreground text-sm">{c.reviewsCount}</span>
            </div>
            <p className="text-muted-foreground text-sm">{c.reviewsSource}</p>
          </motion.div>

          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track flex gap-5 w-max">
              {[...c.reviewsList, ...c.reviewsList].map((r, i) => (
                <article
                  key={i}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col w-[320px] md:w-[360px] shrink-0"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="text-primary fill-primary" size={14} strokeWidth={1.5} />
                    ))}
                  </div>
                  <p className="text-foreground/90 text-sm leading-relaxed flex-1 mb-5 line-clamp-5">
                    "{r.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-serif font-semibold text-sm shrink-0">
                      {r.author.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{r.author}</p>
                      <p className="text-muted-foreground text-xs">{c.reviewsOn} Google</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <a
              href={GOOGLE_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("cta", "open_google_reviews")}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-3.5 rounded-md hover:bg-primary/10 transition-colors"
            >
              <MapPin size={16} />
              {c.reviewsCta}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Blockquote */}
      <section className="section-padding">
        <div className="container max-w-3xl">
          <motion.blockquote
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="border-l-2 border-primary pl-6 md:pl-10"
          >
            <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-foreground/90">
              {c.quote}
            </p>
            <footer className="mt-4 text-primary text-sm font-sans tracking-wide">
              {c.quoteBy}
            </footer>
          </motion.blockquote>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Services */}
      <section id="servicos" className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.servicesEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">{c.servicesHeading}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{c.servicesSubheading}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.services.map((s, i) => {
              const Icon = serviceIcons[i];
              return (
                <motion.div
                  key={s.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="card-hover group bg-card border border-border rounded-xl p-6 flex flex-col"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="text-primary" size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-serif text-lg mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Packages */}
      <section id="pacotes" className="section-padding">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.packagesEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">{c.packagesHeading}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{c.packagesSubheading}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {c.packages.map((p, i) => {
              const Icon = packageIcons[i];
              return (
                <motion.div
                  key={p.tag}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className="card-hover relative bg-card border border-primary/30 rounded-2xl p-8 md:p-10 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <Icon className="text-primary" size={24} strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-primary border border-primary/30 rounded-full px-3 py-1">
                      {p.duration}
                    </span>
                  </div>
                  <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
                    {p.tag}
                  </span>
                  <h3 className="font-serif text-2xl mt-3 mb-6">{p.headline}</h3>
                  <ul className="space-y-4 mb-8 flex-1">
                    {p.bullets.map((b) => (
                      <li key={b.title} className="flex gap-3">
                        <Check className="text-primary mt-0.5 shrink-0" size={18} strokeWidth={2} />
                        <div>
                          <p className="text-foreground font-medium text-sm">{b.title}</p>
                          <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      openQualifying(i === 0 ? "consultoria_operacional" : "mentoria_estrategica")
                    }
                    className="inline-flex items-center justify-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-6 py-3 rounded-md hover:bg-primary/10 transition-colors"
                  >
                    {c.packageCta}
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Mentoria Profissional */}
      <section id="mentoria-profissional" className="section-padding">
        <div className="container max-w-5xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="relative bg-card border border-primary/40 rounded-2xl p-8 md:p-12 overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="grid md:grid-cols-[1fr_auto] gap-10 items-center relative">
              <div>
                <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
                  {c.mpEyebrow}
                </span>
                <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">{c.mpHeading}</h2>
                <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">{c.mpDesc}</p>
                <ul className="grid sm:grid-cols-2 gap-3 mb-8">
                  {c.mpFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/90">
                      <Check className="text-primary shrink-0" size={16} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/mentoria-profissional"
                  onClick={() => trackClick("cta", "mp_section_cta")}
                  className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-7 py-3.5 rounded-md"
                >
                  {c.mpCta}
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="flex flex-col items-center justify-center bg-background/60 border border-primary/30 rounded-2xl px-8 py-6 md:min-w-[220px]">
                <span className="text-primary text-[10px] tracking-[0.3em] uppercase font-medium mb-2">
                  {c.mpPriceFrom}
                </span>
                <div className="flex items-baseline">
                  <span className="font-serif text-4xl md:text-5xl font-bold text-foreground">
                    {formatPrice(187)}
                  </span>
                </div>
                <span className="text-muted-foreground text-xs mt-1">{c.mpPriceSuffix}</span>
                <span className="text-[10px] tracking-wide uppercase text-primary mt-3">
                  {c.mpNoLockin}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Closing / CTA */}
      <section id="agenda" className="section-padding">
        <div className="container max-w-3xl text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.closingEyebrow}
            </span>
            <h2 className="font-serif text-3xl md:text-5xl mt-3 mb-6 leading-tight">
              {c.closingHeadingA}{" "}
              <span className="text-primary">{c.closingHeadingB}</span>
            </h2>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-4">
              {c.closingP1}
            </p>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              {c.closingP2}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => openWhatsapp("open_whatsapp_closing")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              {c.ctaContact}
            </button>
            <button
              onClick={openCalendar}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Calendar size={16} />
              {c.ctaOpenCalendar}
            </button>
            <a
              href="mailto:gabriel@gabrielconsultor.com"
              onClick={() => trackClick("cta", "open_email_closing")}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Mail size={16} />
              Email
            </a>
          </motion.div>
        </div>
      </section>
      {latestPosts.length > 0 && (
        <section className="section-padding border-t border-border">
          <div className="container max-w-5xl">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-primary text-xs font-medium tracking-widest uppercase mb-2">
                  {locale === "pt" ? "Conteúdo" : "Content"}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl">
                  {locale === "pt" ? "Últimas publicações" : "Latest posts"}
                </h2>
              </div>
              <Link to="/blog" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                {locale === "pt" ? "Ver todas" : "View all"} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {latestPosts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.slug}`}
                  className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
                >
                  {p.cover_image_url && (
                    <div className="aspect-video overflow-hidden bg-secondary">
                      <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    {p.published_at && (
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        {new Date(p.published_at).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                    <h3 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                    {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-14 border-t border-border">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="flex flex-col items-start gap-5 md:max-w-sm">
              <img
                src={monogramaFull.url}
                alt="Gabriel Consultor — Processos Comerciais | Sales Ops"
                loading="lazy"
                className="w-44 md:w-56 h-auto opacity-95"
              />
              <a
                href="mailto:gabriel@gabrielconsultor.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                gabriel@gabrielconsultor.com
              </a>
            </div>
            <div className="flex flex-col items-start md:items-end gap-5">
              <div className="flex items-center gap-3">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label={c.footerAriaWhatsapp} className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <MessageCircle size={16} />
                </a>
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label={c.footerAriaLinkedin} className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Linkedin size={16} />
                </a>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={c.footerAriaInstagram} className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Instagram size={16} />
                </a>
                <a href={GOOGLE_PROFILE_URL} target="_blank" rel="noopener noreferrer" aria-label={c.footerAriaGoogle} className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <MapPin size={16} />
                </a>
                <a href="mailto:gabriel@gabrielconsultor.com" aria-label="Email" className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Mail size={16} />
                </a>
              </div>
              <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Blog
              </Link>
            </div>
          </div>
          <p className="mt-10 pt-6 border-t border-border/60 text-muted-foreground text-xs tracking-wide">
            © {new Date().getFullYear()} {c.footerTagline}
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
