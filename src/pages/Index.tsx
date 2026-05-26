import { useState } from "react";
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
} from "lucide-react";
import LeadFormDialog from "@/components/LeadFormDialog";
import gabrielPhoto from "@/assets/gabriel.jpg";

const CALENDAR_URL = "https://calendar.app.google/1GgJUz3DD3KuznGMA";
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

const painPoints = [
  { icon: Target, title: "Falta de Leads Qualificados", desc: "Pipeline vazio e dependência de indicações para gerar novas oportunidades." },
  { icon: TrendingDown, title: "Baixa Taxa de Conversão", desc: "Propostas enviadas que não se transformam em contratos fechados." },
  { icon: Workflow, title: "Ausência de Processos", desc: "Vendas sem método, sem funil definido e sem previsibilidade de receita." },
  { icon: Users, title: "Time sem Ritmo", desc: "Equipe comercial desmotivada, sem metas claras e sem rotina de execução." },
];

const services = [
  {
    icon: Workflow,
    title: "Estruturação Comercial",
    desc: "Desenho de funil inbound/outbound, playbooks, cadências e SLA entre marketing, pré-vendas e vendas.",
  },
  {
    icon: Database,
    title: "Auditoria de CRM",
    desc: "Diagnóstico técnico do seu CRM, limpeza de pipeline, automações e padronização de dados para decisões reais.",
  },
  {
    icon: Sparkles,
    title: "Painéis e MVPs com IA",
    desc: "Dashboards de receita e MVPs com Inteligência Artificial para acelerar operações sem depender de TI.",
  },
  {
    icon: GraduationCap,
    title: "Mentoria Comercial",
    desc: "Acompanhamento contínuo do líder e do time comercial, com revisão de KPIs e ajustes de rota a cada ciclo.",
  },
];

const Index = () => {
  const [formOpen, setFormOpen] = useState(false);

  const openForm = () => setFormOpen(true);
  const openCalendar = () => window.open(CALENDAR_URL, "_blank", "noopener,noreferrer");

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <LeadFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      {/* Hero */}
      <section className="section-padding flex items-center justify-center min-h-[92vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-transparent to-transparent pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--primary)) 1px, transparent 1px)",
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
            Criador Platinum Lovable
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-primary tracking-[0.25em] uppercase text-xs font-sans font-medium mb-6"
          >
            Gabriel · Sales Ops & MVPs com IA
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl lg:text-[3.4rem] leading-[1.1] font-bold mb-6"
          >
            Pare de perder vendas com{" "}
            <span className="text-primary">processos que só funcionam no papel.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Consultoria em Sales Operations, processos comerciais e MVPs com IA
            para diretores e fundadores que precisam de execução rápida,
            previsível e baseada em dados.
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
              Agendar Diagnóstico
            </button>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              Receber Proposta
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
                className="card-hover bg-card border border-border rounded-lg p-6"
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
              Serviços
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              Soluções diretas ao ponto
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Da estratégia ao painel rodando. Sem burocracia, sem consultoria
              de teoria.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
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
                  <s.icon className="text-primary" size={22} strokeWidth={1.75} />
                </div>
                <h3 className="font-serif text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                  {s.desc}
                </p>
              </motion.div>
            ))}
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
                  src={gabrielPhoto}
                  alt="Gabriel Vieira, consultor em Sales Ops e MVPs com IA"
                  loading="lazy"
                  className="relative w-full h-full object-cover rounded-full border-2 border-primary/40 shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.4)]"
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
                Quem é Gabriel
              </span>
              <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-5">
                Estratégia, execução e tecnologia no mesmo lugar.
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Sou consultor focado em{" "}
                  <strong className="text-foreground">Sales Operations</strong>,
                  estruturação de processos comerciais e aplicação de{" "}
                  <strong className="text-foreground">Inteligência Artificial</strong>{" "}
                  para acelerar a operação de empresas B2B.
                </p>
                <p>
                  Atuo lado a lado com diretores comerciais e fundadores
                  desenhando funis, auditando CRM, construindo painéis de{" "}
                  <strong className="text-foreground">métricas</strong> e
                  entregando MVPs prontos para operar — sem depender de filas
                  internas de TI.
                </p>
                <p>
                  Meu compromisso é simples: processo claro, dado limpo e
                  execução previsível.
                </p>
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
              "Eu forneço o mapa e a bússola; seu time domina o território.
              Consultoria focada em processos, não apenas em teoria."
            </p>
            <footer className="mt-4 text-primary text-sm font-sans tracking-wide">
              — Gabriel
            </footer>
          </motion.blockquote>
        </div>
      </section>

      <div className="gold-divider" />

      {/* Scheduling */}
      <section id="agenda" className="section-padding">
        <div className="container max-w-2xl text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <span className="text-primary text-xs tracking-[0.25em] uppercase font-medium">
              Agenda Aberta
            </span>
            <h2 className="font-serif text-2xl md:text-4xl mt-3 mb-4">
              Escolha um horário e vamos conversar.
            </h2>
            <p className="text-muted-foreground mb-10">
              Uma conversa de 30 minutos, sem compromisso, para entender seu
              cenário e mapear próximos passos.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="bg-card border border-primary/30 rounded-2xl p-10 md:p-12"
          >
            <Calendar
              className="mx-auto text-primary mb-6"
              size={40}
              strokeWidth={1.5}
            />
            <h3 className="font-serif text-xl mb-3">Agendamento online</h3>
            <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
              Acesse minha agenda pública do Google Calendar e selecione o
              melhor momento.
            </p>
            <button
              onClick={openCalendar}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <Calendar size={16} />
              Abrir Agenda
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container max-w-5xl flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn de Gabriel Vieira"
              className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Linkedin size={16} />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Gabriel Vieira"
              className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Instagram size={16} />
            </a>
            <a
              href={GOOGLE_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Perfil do Google de Gabriel Vieira"
              className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <MapPin size={16} />
            </a>
          </div>
          <p className="text-center text-muted-foreground text-xs tracking-wide">
            © {new Date().getFullYear()} Gabriel Vieira · Consultoria em Sales Ops & MVPs com IA
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
