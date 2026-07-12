import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import {
  Trophy, TrendingUp, Target, LineChart, Check, Zap, BarChart3,
  Calendar, ArrowRight, Star, Clock, ShieldCheck,
} from "lucide-react";

const features = [
  { i: Target, t: "Meta clara", d: "Defina sua meta mensal, semanal e diária. O app calcula quanto você precisa por dia para bater." },
  { i: Clock, t: "Registro em 2 minutos", d: "Preencha ligações, WhatsApps, reuniões, propostas e vendas do dia em segundos." },
  { i: BarChart3, t: "Taxas de conversão", d: "Prospecção → contato → reunião → proposta → venda. Automático." },
  { i: Trophy, t: "Score de 0 a 100", d: "Diagnóstico automático de onde está seu gargalo — e o que fazer agora." },
  { i: LineChart, t: "Evolução no tempo", d: "Gráficos semanais e mensais. Veja o que melhorou e o que travou." },
  { i: Zap, t: "Conteúdos de vendas", d: "Módulos curtos de SPIN, objeções, fechamento e prospecção — direto ao ponto." },
];

const steps = [
  { n: "01", t: "Defina sua meta", d: "Meta mensal, ticket médio e atividades-chave. Setup em 3 minutos." },
  { n: "02", t: "Registre o dia", d: "2 minutos por dia. O app cuida do resto: conversões, ritmo, projeção." },
  { n: "03", t: "Aja no gargalo", d: "Score aponta onde perder menos tempo. Você foca no que muda o número." },
];

const faqs = [
  { q: "Preciso instalar algo?", a: "Não. Funciona no navegador do celular e do computador. Abre e usa." },
  { q: "Serve para qual tipo de vendedor?", a: "Consultores, corretores, SDRs, closers, autônomos e times pequenos que vendem consultivamente." },
  { q: "Posso cancelar?", a: "Sim, quando quiser. Cobrança recorrente via PIX, sem fidelidade." },
  { q: "Como é o pagamento?", a: "PIX. Assinatura mensal de R$ 9,70 ou semestral R$ 49,70 (equivale a R$ 8,28/mês)." },
];

export default function ConhecaScoreApp() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Score Comercial | Meça sua rotina e aumente vendas</title>
        <meta name="description" content="Ferramenta simples para vendedores medirem rotina, conversões e receberem um score comercial diário. Diagnóstico automático de gargalos. A partir de R$ 8,28/mês." />
        <link rel="canonical" href="/conhecascoreapp" />
        <meta property="og:title" content="Score Comercial | Meça sua rotina e aumente vendas" />
        <meta property="og:description" content="Registre o dia em 2 minutos e receba um score comercial de 0 a 100 com diagnóstico de gargalos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/conhecascoreapp" />
        <meta name="twitter:card" content="summary_large_image" />
        {/* Meta Pixel */}
        <script>{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1622839295496776');fbq('track','PageView');`}</script>
        {/* Google Analytics (GA4) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-JM84RGKV4H"></script>
        <script>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-JM84RGKV4H');`}</script>
      </Helmet>

      {/* HEADER */}
      <SiteHeader />


      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] uppercase tracking-widest mb-6">
          Ferramenta para vendedores
        </span>
        <h1 className="font-serif text-4xl md:text-6xl mb-6 leading-[1.05]">
          Pare de vender no escuro.<br />
          <span className="text-primary">Meça a rotina. Bata a meta.</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Registre seu dia em 2 minutos. Receba um score de 0 a 100 com diagnóstico automático do
          seu gargalo. Aja no que realmente move o número.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/app/cadastro"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm uppercase tracking-wide flex items-center gap-2 hover:opacity-90 transition"
          >
            Começar agora — R$ 9,70/mês <ArrowRight size={16} />
          </Link>
          <Link to="/app/login" className="text-sm text-muted-foreground hover:text-foreground px-4 py-4">
            Já tenho conta
          </Link>
        </div>
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-primary" /> Pagamento via PIX</span>
          <span className="flex items-center gap-1"><Calendar size={14} className="text-primary" /> Cancele quando quiser</span>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl mb-4">Você sente isso?</h2>
            <p className="text-muted-foreground text-sm">
              A maioria dos vendedores não sabe dizer, com números, o que travou o mês. Sabe que
              "trabalhou muito", mas o pipeline não fecha. O problema quase nunca é esforço — é
              cegueira operacional.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Não sabe sua taxa real de reunião → proposta",
              "Registra vendas no caderno, e-mail ou lugar nenhum",
              "Descobre no dia 28 que não vai bater a meta",
              "Não tem clareza de qual atividade precisa aumentar",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2 text-muted-foreground">
                <span className="text-primary mt-1">•</span> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-primary">O que você recebe</span>
          <h2 className="font-serif text-3xl md:text-4xl mt-3">Simples de usar. Difícil de largar.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.t} className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition">
              <f.i className="text-primary mb-3" size={22} />
              <div className="font-serif text-lg mb-1">{f.t}</div>
              <div className="text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="border-y border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-primary">Como funciona</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">Três passos. Sem enrolação.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="font-mono text-5xl text-primary/30 mb-2">{s.n}</div>
                <div className="font-serif text-xl mb-2">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-primary text-primary" />)}
        </div>
        <blockquote className="font-serif text-xl md:text-2xl italic mb-4 max-w-2xl mx-auto">
          "Em 3 semanas percebi que meu problema não era prospecção — era conversão de proposta.
          Ajustei o roteiro e o mês seguinte foi o maior do ano."
        </blockquote>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Vendedor consultivo · Segmento B2B
        </div>
      </section>

      {/* PRICING */}
      <section className="border-t border-border bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-primary">Preço</span>
            <h2 className="font-serif text-3xl md:text-4xl mt-3">Menos que um almoço.</h2>
            <p className="text-muted-foreground mt-3">Ferramenta profissional, preço de app.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="font-serif text-2xl">Mensal</div>
              <div className="font-mono text-4xl text-primary mt-3">R$ 9,70<span className="text-sm text-muted-foreground ml-1">/mês</span></div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {["Registro diário ilimitado","Score comercial 0-100","Diagnóstico de gargalos","Conteúdos de vendas","Cancele quando quiser"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-primary" /> {f}</li>
                ))}
              </ul>
              <Link to="/app/cadastro" className="mt-8 block text-center bg-secondary text-secondary-foreground py-3 rounded-md text-sm uppercase tracking-wide">Assinar mensal</Link>
            </div>
            <div className="bg-card border-2 border-primary rounded-lg p-8 relative">
              <span className="absolute -top-3 left-6 text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-3 py-1 rounded">Mais escolhido · Economize 15%</span>
              <div className="font-serif text-2xl">Semestral</div>
              <div className="font-mono text-4xl text-primary mt-3">R$ 49,70<span className="text-sm text-muted-foreground ml-1">por 6 meses</span></div>
              <div className="text-xs text-muted-foreground mt-1">Equivale a R$ 8,28/mês</div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {["Tudo do mensal","Acesso completo por 6 meses","Sem renovação surpresa","Prioridade no suporte"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-primary" /> {f}</li>
                ))}
              </ul>
              <Link to="/app/cadastro" className="mt-8 block text-center bg-primary text-primary-foreground py-3 rounded-md text-sm uppercase tracking-wide">Assinar semestral</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-primary">Dúvidas</span>
          <h2 className="font-serif text-3xl md:text-4xl mt-3">Perguntas frequentes</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="bg-card border border-border rounded-lg p-5 group">
              <summary className="font-serif text-lg cursor-pointer flex items-center justify-between">
                {f.q}
                <span className="text-primary text-xl group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <TrendingUp className="text-primary mx-auto mb-4" size={32} />
          <h2 className="font-serif text-3xl md:text-4xl mb-4">Comece hoje. Meça amanhã.</h2>
          <p className="text-muted-foreground mb-8">
            Em 5 minutos você está com meta definida e pronto para o primeiro registro.
          </p>
          <Link
            to="/app/cadastro"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm uppercase tracking-wide hover:opacity-90 transition"
          >
            Criar minha conta <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-primary" />
            <span>Score Comercial</span>
          </div>
          <div className="flex gap-4">
            <Link to="/app/login" className="hover:text-foreground">Entrar</Link>
            <Link to="/app/cadastro" className="hover:text-foreground">Criar conta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
