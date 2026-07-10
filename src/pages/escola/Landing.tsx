import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import { GraduationCap, ArrowRight, Check, BookOpen, Target, Zap } from "lucide-react";

const features = [
  { i: BookOpen, t: "Conteúdos práticos", d: "Artigos curtos e diretos sobre prospecção, SPIN, objeções e fechamento." },
  { i: Target, t: "Aplicável ao dia a dia", d: "Cada post traz um desafio pra você executar na próxima semana." },
  { i: Zap, t: "Novo conteúdo toda semana", d: "Você recebe no WhatsApp quando um novo material for publicado." },
];

const beneficios = [
  "Acesso imediato a todos os artigos",
  "Notificação por WhatsApp de novos conteúdos",
  "Desafios semanais respondidos pelo Gabriel",
  "Sem cartão, sem cobrança — 100% grátis",
];

export default function EscolaLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Escola de Vendedores Grátis | Gabriel Vieira</title>
        <meta name="description" content="Conteúdos práticos e gratuitos sobre vendas consultivas, prospecção, SPIN e fechamento. Cadastre-se e receba novos materiais no WhatsApp." />
        <link rel="canonical" href="/escola" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Escola de Vendedores Grátis | Gabriel Vieira" />
        <meta property="og:description" content="Conteúdos práticos e gratuitos sobre vendas consultivas." />
        <meta property="og:url" content="/escola" />
      </Helmet>

      <SiteHeader />

      <section className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-[10px] uppercase tracking-widest mb-6">
          Produto gratuito
        </span>
        <h1 className="font-serif text-4xl md:text-6xl mb-6 leading-[1.05]">
          Escola de Vendedores.<br />
          <span className="text-primary">Grátis, prático, aplicável.</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Artigos curtos, direto ao ponto, sobre o que funciona em vendas consultivas.
          Cadastre-se com nome, email e telefone — acesso imediato.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to="/escola/cadastro"
            className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm uppercase tracking-wide flex items-center gap-2 hover:opacity-90 transition"
          >
            Acessar grátis <ArrowRight size={16} />
          </Link>
          <Link to="/escola/login" className="text-sm text-muted-foreground hover:text-foreground px-4 py-4">
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.i;
            return (
              <div key={i} className="p-6 bg-background/60 border border-border rounded-lg">
                <Icon className="text-primary mb-3" size={22} />
                <h3 className="font-serif text-lg mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-10">O que você recebe</h2>
        <ul className="space-y-3">
          {beneficios.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm">
              <Check className="text-primary shrink-0 mt-0.5" size={16} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 text-center">
          <Link
            to="/escola/cadastro"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm uppercase tracking-wide"
          >
            <GraduationCap size={16} /> Acessar agora — é grátis
          </Link>
        </div>
      </section>
    </div>
  );
}
