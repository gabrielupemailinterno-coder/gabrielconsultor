import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
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
  Check,
  Briefcase,
  Compass,
  Star,
} from "lucide-react";
import LeadFormDialog from "@/components/LeadFormDialog";
import gabrielPhoto from "@/assets/gabriel.jpg";
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
  const { locale, formatPrice } = useLocale();
  const c = indexCopy[locale];
  useAnalytics("/");

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

  const openForm = () => { trackClick("cta", "open_lead_form"); setFormOpen(true); };
  const openCalendar = () => { trackClick("cta", "open_calendar"); window.open(CALENDAR_URL, "_blank", "noopener,noreferrer"); };

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
      <LeadFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

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
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-medium tracking-wide uppercase px-4 py-1.5 rounded-full mb-8"
          >
            <Trophy size={14} strokeWidth={2} />
            {c.badge}
          </motion.div>
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("cta", "open_whatsapp_hero")}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <MessageCircle size={16} />
              {c.ctaWhatsapp}
            </a>
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
                    onClick={openForm}
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
                    {formatPrice(197)}
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
                  src={gabrielPhoto}
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
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("cta", "open_whatsapp_closing")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              {c.ctaContact}
            </a>
            <button
              onClick={openCalendar}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Calendar size={16} />
              {c.ctaOpenCalendar}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container max-w-5xl flex flex-col items-center gap-6">
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
          </div>
          <p className="text-center text-muted-foreground text-xs tracking-wide">
            © {new Date().getFullYear()} {c.footerTagline}
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
