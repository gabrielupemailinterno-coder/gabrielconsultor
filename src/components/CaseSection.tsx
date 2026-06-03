import { motion } from "framer-motion";
import { TrendingUp, Target, Percent, Wallet, Lightbulb, Workflow, Quote } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { mentoriaCopy } from "@/locales/copy";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" as const },
  }),
};

const metricIcons = [TrendingUp, Target, Percent, Wallet];
const lessonIcons = [Lightbulb, Workflow];

export default function CaseSection() {
  const { locale } = useLocale();
  const c = mentoriaCopy[locale].case;

  return (
    <section className="section-padding">
      <div className="container max-w-6xl">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-primary text-xs tracking-[0.25em] uppercase font-medium">
            {c.eyebrow}
          </span>
          <h2 className="font-serif text-2xl md:text-4xl mt-3 mb-4 leading-tight">
            {c.title}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            {c.subtitle}
          </p>
        </motion.div>

        {/* Contexto + Virada */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="bg-card border border-border rounded-2xl p-6 md:p-7"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
              {c.contextEyebrow}
            </p>
            <h3 className="font-serif text-lg mb-3">{c.contextTitle}</h3>
            <p className="text-foreground/85 text-sm md:text-[15px] leading-relaxed">
              {c.contextBody}
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="relative bg-card border border-primary/40 rounded-2xl p-6 md:p-7 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3 flex items-center gap-2">
              <Quote size={12} /> {c.turningEyebrow}
            </p>
            <h3 className="font-serif text-lg mb-3">{c.turningTitle}</h3>
            <p className="text-foreground/85 text-sm md:text-[15px] leading-relaxed">
              {c.turningBody}
            </p>
          </motion.div>
        </div>

        {/* Métricas */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={2}
          className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-center mb-4"
        >
          {c.metricsEyebrow}
        </motion.p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-12">
          {c.metrics.map((m, i) => {
            const Icon = metricIcons[i];
            return (
              <motion.div
                key={m.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 3}
                className="group relative bg-gradient-to-br from-card to-card/40 border border-border rounded-2xl p-5 md:p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
                    {m.label}
                  </span>
                  <Icon className="text-primary" size={16} strokeWidth={2} />
                </div>
                <p
                  className="text-primary text-3xl md:text-4xl font-bold tracking-tight"
                  style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontFeatureSettings: "'tnum'" }}
                >
                  {m.value}
                </p>
                {m.hint && (
                  <p className="text-muted-foreground text-xs mt-2 leading-snug">{m.hint}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Lições */}
        <motion.h3
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          className="font-serif text-xl md:text-2xl text-center mb-6"
        >
          {c.lessonsTitle}
        </motion.h3>
        <div className="grid md:grid-cols-2 gap-4">
          {c.lessons.map((l, i) => {
            const Icon = lessonIcons[i];
            return (
              <motion.div
                key={l.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 1}
                className="card-hover bg-card border border-border rounded-2xl p-6 flex gap-4 items-start"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Icon className="text-primary" size={20} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-serif text-lg mb-1.5">{l.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{l.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
