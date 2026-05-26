import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import LeadFormDialog from "@/components/LeadFormDialog";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5532998316501&text=Ol%C3%A1%2C%20quero%20saber%20mais%20sobre%20a%20Mentoria%20Profissional%20de%20R%24197%2Fm%C3%AAs";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const paraQuem = [
  {
    icon: Target,
    title: "Vendedores e SDRs",
    desc: "Que precisam bater meta com previsibilidade e não dependem de sorte ou de leads quentes.",
  },
  {
    icon: Headphones,
    title: "Suporte e Customer Success",
    desc: "Que querem se posicionar como consultivo, reduzir churn e abrir novas oportunidades dentro da carteira.",
  },
  {
    icon: Users,
    title: "Líderes de Operação",
    desc: "Coordenadores e gestores que precisam estruturar rotina, indicadores e cobrança de time com método.",
  },
  {
    icon: TrendingUp,
    title: "Profissionais em Transição",
    desc: "Que estão saindo do operacional e querem dar o salto para cargos consultivos e estratégicos.",
  },
];

const beneficios = [
  {
    title: "Sessões mensais ao vivo",
    desc: "2 encontros por mês de 60 minutos, individuais, focados nos seus desafios reais de carreira.",
  },
  {
    title: "Plano de evolução pessoal",
    desc: "Mapeamento dos seus KPIs pessoais, metas trimestrais e ajustes de rota baseados em dados, não em achismo.",
  },
  {
    title: "Acesso direto via WhatsApp",
    desc: "Suporte assíncrono para tirar dúvidas pontuais, revisar abordagens, propostas e e-mails antes de enviar.",
  },
  {
    title: "Templates e playbooks",
    desc: "Biblioteca de cadências, scripts, modelos de proposta e checklists usados na minha consultoria executiva.",
  },
  {
    title: "Revisão de pipeline",
    desc: "Diagnóstico mensal das suas oportunidades em aberto com plano tático para acelerar o fechamento.",
  },
  {
    title: "Comunidade fechada",
    desc: "Networking com outros profissionais comerciais e de CS em evolução, com troca real de cases.",
  },
];

const resultados = [
  "Bater meta com método, parar de depender de pico de motivação",
  "Aumentar ticket médio e taxa de conversão das suas oportunidades",
  "Se tornar referência interna em organização, dados e processo",
  "Negociar promoção e aumento com argumentos concretos de performance",
  "Reduzir o tempo gasto com tarefas operacionais e ganhar foco estratégico",
];

const MentoriaProfissional = () => {
  const [formOpen, setFormOpen] = useState(false);
  useAnalytics("/mentoria-profissional");

  useEffect(() => {
    document.title = "Mentoria Profissional · Gabriel Vieira";
  }, []);

  const openForm = () => {
    trackClick("cta", "mp_open_lead_form");
    setFormOpen(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <LeadFormDialog open={formOpen} onClose={() => setFormOpen(false)} />

      {/* Back link */}
      <div className="container max-w-5xl pt-8">
        <Link
          to="/"
          onClick={() => trackClick("link", "mp_back_home")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Voltar para a página inicial
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
            Mentoria 1:1 · Mensal
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl leading-[1.1] font-bold mb-6"
          >
            Mentoria Profissional para{" "}
            <span className="text-primary">quem quer evoluir de verdade.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Acompanhamento individual mensal para profissionais da área
            comercial, suporte e customer success que querem destravar
            performance pessoal com método, dados e execução — sem palestras
            motivacionais.
          </motion.p>

          {/* Price card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="inline-flex flex-col items-center bg-card border border-primary/40 rounded-2xl px-10 py-6 mb-10"
          >
            <span className="text-primary text-[10px] tracking-[0.3em] uppercase font-medium mb-2">
              Investimento fixo
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-sm text-muted-foreground">R$</span>
              <span className="font-serif text-5xl md:text-6xl font-bold text-foreground">
                197
              </span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
            <span className="text-muted-foreground text-xs mt-2">
              Sem fidelidade · Cancele quando quiser
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("cta", "mp_whatsapp_hero")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              Quero entrar na mentoria
            </a>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              <Calendar size={16} />
              Receber detalhes
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
              Para quem é
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              Profissionais que vivem de meta, atendimento e relacionamento.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Se você atua na linha de frente do cliente — vendendo, retendo ou
              ampliando carteira — essa mentoria é para você.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {paraQuem.map((item, i) => (
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
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
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
              O que está incluso
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              Tudo que você precisa para virar a chave em 90 dias.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beneficios.map((b, i) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="card-hover bg-card border border-border rounded-xl p-6"
              >
                <Check className="text-primary mb-4" size={22} strokeWidth={2} />
                <h3 className="font-serif text-lg mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            ))}
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
              Resultados esperados
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3 mb-4">
              O que você vai colher do seu lado.
            </h2>
          </motion.div>

          <ul className="space-y-4">
            {resultados.map((r, i) => (
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
              Como funciona
            </span>
            <h2 className="font-serif text-2xl md:text-3xl mt-3">
              Simples, direto, mensurável.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Onboarding", d: "Diagnóstico inicial dos seus KPIs pessoais e desenho do seu plano de evolução." },
              { n: "02", t: "Execução guiada", d: "Sessões quinzenais + acompanhamento contínuo via WhatsApp e materiais sob demanda." },
              { n: "03", t: "Revisão de ciclo", d: "Análise mensal dos resultados, ajuste de metas e definição das próximas alavancas." },
            ].map((s, i) => (
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
            Vagas limitadas a 15 mentorados ativos por mês.
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
            R$197/mês para deixar de{" "}
            <span className="text-primary">competir no escuro.</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10"
          >
            Menos do que uma conta de celular para ter um mentor sênior te
            puxando para o próximo nível, todo mês.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={2}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick("cta", "mp_whatsapp_final")}
              className="cta-glow inline-flex items-center gap-2 bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-8 py-4 rounded-md"
            >
              <MessageCircle size={16} />
              Garantir minha vaga
            </a>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 border border-primary/40 text-foreground font-sans font-medium text-sm tracking-wide uppercase px-7 py-4 rounded-md hover:bg-primary/10 transition-colors"
            >
              Receber proposta
            </button>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default MentoriaProfissional;
