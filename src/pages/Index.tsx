import { motion } from "framer-motion";
import { Target, TrendingDown, Workflow, Users } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5532998316501?text=quero%20saber%20mais%20sobre%20sua%20consultoria";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const painPoints = [
  { icon: Target, title: "Falta de Leads Qualificados", desc: "Pipeline vazio e dependência de indicações para gerar novas oportunidades." },
  { icon: TrendingDown, title: "Baixa Taxa de Conversão", desc: "Propostas enviadas que não se transformam em contratos fechados." },
  { icon: Workflow, title: "Ausência de Processos", desc: "Vendas sem método, sem funil definido e sem previsibilidade de receita." },
  { icon: Users, title: "Time sem Ritmo", desc: "Equipe comercial desmotivada, sem metas claras e sem rotina de execução." },
];

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero */}
      <section className="section-padding flex items-center justify-center min-h-[90vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent pointer-events-none" />
        <div className="container max-w-3xl text-center relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-primary tracking-[0.25em] uppercase text-xs font-sans font-medium mb-6"
          >
            Gabriel · Consultor em Processos Comerciais
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl lg:text-[3.25rem] leading-tight font-bold mb-6"
          >
            Transforme seu Setor Comercial em uma{" "}
            <span className="text-primary">Máquina de Vendas</span> Previsível.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Diagnóstico de gargalos e estruturação de funis inbound/outbound.
            <br className="hidden md:block" />
            Onde a estratégia encontra a execução.
          </motion.p>
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="inline-block bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md hover:brightness-110 transition-all duration-300"
          >
            Agendar Diagnóstico Profissional
          </motion.a>
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
            Seu comercial enfrenta esses desafios?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-muted-foreground text-center max-w-xl mx-auto mb-14"
          >
            Identifique os gargalos que estão travando o crescimento da sua receita.
          </motion.p>
          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-colors duration-300"
              >
                <item.icon className="text-primary mb-4" size={28} strokeWidth={1.5} />
                <h3 className="font-serif text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Plans */}
      <section className="section-padding">
        <div className="container max-w-5xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="font-serif text-2xl md:text-3xl text-center mb-14"
          >
            Soluções sob medida para seu momento
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Card 01 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="bg-card border border-border rounded-lg p-8 flex flex-col"
            >
              <span className="text-primary text-xs tracking-[0.2em] uppercase font-sans font-medium mb-3">Plano 01</span>
              <h3 className="font-serif text-xl md:text-2xl mb-2">Consultoria</h3>
              <p className="text-muted-foreground text-sm mb-6">Diagnóstico + Plano de Execução · 4 semanas</p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8 flex-1">
                <li className="flex gap-2"><span className="text-primary">—</span> Mapeamento completo do funil atual</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Análise de rotinas e gargalos comerciais</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Plano de ação detalhado e priorizado</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Execução conduzida pelo seu time</li>
              </ul>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-6 py-3 rounded-md hover:brightness-110 transition-all duration-300"
              >
                Solicitar Proposta
              </a>
            </motion.div>

            {/* Card 02 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="bg-card border border-primary/30 rounded-lg p-8 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] tracking-widest uppercase font-sans font-semibold px-4 py-1 rounded-bl-lg">
                Mais Popular
              </div>
              <span className="text-primary text-xs tracking-[0.2em] uppercase font-sans font-medium mb-3">Plano 02</span>
              <h3 className="font-serif text-xl md:text-2xl mb-2">Mentoria Comercial Estratégica</h3>
              <p className="text-muted-foreground text-sm mb-6">Acompanhamento contínuo · 8 a 12 semanas</p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8 flex-1">
                <li className="flex gap-2"><span className="text-primary">—</span> Sessões semanais com o líder comercial</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Encontros quinzenais com o time de vendas</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Revisão de métricas e KPIs a cada ciclo</li>
                <li className="flex gap-2"><span className="text-primary">—</span> Ajustes de rota em tempo real</li>
              </ul>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-center bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-6 py-3 rounded-md hover:brightness-110 transition-all duration-300"
              >
                Solicitar Proposta
              </a>
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
              "Eu forneço o mapa e a bússola; seu time domina o território. Consultoria focada em processos, não apenas em teoria."
            </p>
            <footer className="mt-4 text-primary text-sm font-sans tracking-wide">— Gabriel</footer>
          </motion.blockquote>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Final CTA */}
      <section className="section-padding text-center">
        <div className="container max-w-2xl">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="font-serif text-2xl md:text-3xl mb-4"
          >
            Pronto para estruturar seu comercial?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-muted-foreground mb-8"
          >
            Agende uma conversa sem compromisso e descubra como transformar seu processo de vendas.
          </motion.p>
          <motion.a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="inline-block bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md hover:brightness-110 transition-all duration-300"
          >
            Agendar Diagnóstico Profissional
          </motion.a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <p className="text-center text-muted-foreground text-xs tracking-wide">
          © {new Date().getFullYear()} Gabriel · Consultoria em Processos Comerciais
        </p>
      </footer>
    </main>
  );
};

export default Index;
