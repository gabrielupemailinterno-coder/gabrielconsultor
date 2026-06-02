import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Target,
  TrendingUp,
  Users,
  Headphones,
  LineChart,
  Calendar,
  Sparkles,
  Clock,
} from "lucide-react";
import QualifyingForm from "@/components/QualifyingForm";
import QuickContactDialog from "@/components/QuickContactDialog";
import SiteHeader from "@/components/SiteHeader";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";
import { useLocale } from "@/contexts/LocaleContext";
import { mentoriaCopy } from "@/locales/copy";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5532998316501&text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20a%20Mentoria%20Profissional";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const paraQuemIcons = [Target, Headphones, Users, TrendingUp];

const MentoriaProfissional = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const { locale, formatPrice } = useLocale();
  const c = mentoriaCopy[locale];
  useAnalytics("/mentoria-profissional");

  useEffect(() => {
    document.title = c.metaTitle;
  }, [c.metaTitle]);

  const openForm = () => {
    trackClick("cta", "mp_open_lead_form");
    setFormOpen(true);
  };
  const openWhatsapp = (label: string) => {
    trackClick("cta", label);
    setWaOpen(true);
  };
  const goToWhatsapp = () => {
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  };

  const pageUrl = "https://gabrielconsultor.com/mentoria-profissional";

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />
      <Helmet>
        <html lang={locale === "pt" ? "pt-BR" : "en"} />
        <title>{c.metaTitle}</title>
        <meta name="description" content={c.metaDesc} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={c.metaTitle} />
        <meta property="og:description" content={c.metaDesc} />
        <meta name="twitter:title" content={c.metaTitle} />
        <meta name="twitter:description" content={c.metaDesc} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Mentoria Profissional 1:1",
          serviceType: "Mentoring for sales and CS professionals",
          description: c.metaDesc,
          url: pageUrl,
          areaServed: locale === "pt" ? "BR" : "Worldwide",
          provider: {
            "@type": "Person",
            name: "Gabriel Vieira",
            url: "https://gabrielconsultor.com/",
          },
          offers: {
            "@type": "Offer",
            price: locale === "pt" ? "197.00" : "39.00",
            priceCurrency: locale === "pt" ? "BRL" : "USD",
            availability: "https://schema.org/InStock",
          },
        })}</script>
      </Helmet>
      <QualifyingForm open={formOpen} onClose={() => setFormOpen(false)} formType="mentoria_1a1_vendedores" />
      <QuickContactDialog
        open={waOpen}
        onClose={() => setWaOpen(false)}
        onSuccess={goToWhatsapp}
      />

      {/* Back link */}
      <div className="container max-w-5xl pt-8">
        <Link
          to="/"
          onClick={() => trackClick("link", "mp_back_home")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          {c.backHome}
        </Link>
      </div>

      {/* Hero */}
      <section className="section-padding pt-10">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 text-primary text-xs font-medium tracking-wide uppercase px-4 py-1.5 rounded-full mb-8"
          >
            <Sparkles size={14} strokeWidth={2} />
            {c.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl leading-[1.1] font-bold mb-6"
          >
            {c.heroTitleA}{" "}
            <span className="text-primary">{c.heroTitleB}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {c.heroDesc}
          </motion.p>

          {/* Price card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="inline-flex flex-col items-center bg-card border border-primary/40 rounded-2xl px-10 py-6 mb-10"
          >
            <span className="text-primary text-[10px] tracking-[0.3em] uppercase font-medium mb-2">
              {c.priceLabel}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-5xl md:text-6xl font-bold text-foreground">
                {formatPrice(197)}
              </span>
              <span className="text-muted-foreground text-sm">{c.pricePeriod}</span>
            </div>
            <span className="text-muted-foreground text-xs mt-2">
              {c.priceFootnote}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => openWhatsapp("mp_whatsapp_hero")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              {c.ctaJoin}
            </button>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Calendar size={16} />
              {c.ctaDetails}
            </button>
          </motion.div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Para quem */}
      <section className="section-padding">
        <div className="container max-w-5xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-14"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.paraQuemEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              {c.paraQuemHeading}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {c.paraQuemSub}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {c.paraQuem.map((item, i) => {
              const Icon = paraQuemIcons[i];
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
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Benefícios */}
      <section className="section-padding">
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
              {c.benefEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              {c.benefHeading}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-5">
            {c.beneficios.map((b, i) => {
              const total = c.beneficios.length;
              // Bento: distribute spans so the last row fills evenly on lg (cols=6) and md (cols=2).
              const topCount = Math.ceil(total / 2);
              const bottomCount = total - topCount;
              const isTop = i < topCount;
              const lgSpan = isTop ? Math.floor(6 / topCount) : Math.floor(6 / Math.max(bottomCount, 1));
              const lgSpanClass = `lg:col-span-${lgSpan}`;
              const mdSpanClass = !isTop && bottomCount === 1 ? "md:col-span-2" : "";
              return (
                <motion.div
                  key={b.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  className={`group relative overflow-hidden bg-gradient-to-br from-card to-card/40 border border-border/60 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 active:scale-[0.99] ${lgSpanClass} ${mdSpanClass}`}
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center">
                      <Check className="text-primary" size={18} strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-base md:text-lg leading-snug mb-1.5">{b.title}</h3>
                      <p className="text-muted-foreground text-[13px] md:text-sm leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Resultados */}
      <section className="section-padding">
        <div className="container max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.resultadosEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              {c.resultadosHeading}
            </h2>
          </motion.div>

          <ul className="space-y-4">
            {c.resultados.map((r, i) => (
              <motion.li
                key={r}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="flex gap-4 items-start bg-card border border-border rounded-lg p-5"
              >
                <LineChart className="text-primary mt-0.5 shrink-0" size={20} strokeWidth={2} />
                <p className="text-foreground/90 leading-relaxed">{r}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Como funciona */}
      <section className="section-padding">
        <div className="container max-w-4xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="text-center mb-12"
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              {c.howEyebrow}
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3">
              {c.howHeading}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {c.howSteps.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-card border border-border rounded-xl p-6"
              >
                <span className="text-primary font-serif text-3xl">{s.n}</span>
                <h3 className="font-serif text-lg mt-2 mb-2">{s.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={3}
            className="flex items-center justify-center gap-2 mt-10 text-muted-foreground text-sm"
          >
            <Clock size={16} className="text-primary" />
            {c.howFootnote}
          </motion.div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* CTA Final */}
      <section className="section-padding">
        <div className="container max-w-3xl text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="font-serif text-3xl md:text-4xl mb-6 leading-tight"
          >
            {formatPrice(197)}
            {c.pricePeriod} {c.finalHeadA}{" "}
            <span className="text-primary">{c.finalHeadB}</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10"
          >
            {c.finalDesc}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => openWhatsapp("mp_whatsapp_final")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              {c.finalCta}
            </button>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              {c.finalCtaAlt}
            </button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default MentoriaProfissional;
