import { Link } from "react-router-dom";
import { Trophy, TrendingUp, Target, LineChart } from "lucide-react";

export default function ScoreLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Trophy className="text-primary" size={20} /><span className="font-serif text-lg">Score Comercial</span></div>
          <div className="flex gap-2 text-sm">
            <Link to="/scoreapp/login" className="px-4 py-2 text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link to="/scoreapp/cadastro" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Criar conta</Link>
          </div>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs uppercase tracking-wider mb-6">Ferramenta gratuita</span>
        <h1 className="font-serif text-4xl md:text-6xl mb-6 leading-tight">Meça a rotina.<br/>Aumente as vendas.</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Registre seu dia em menos de 2 minutos, acompanhe metas, taxas de conversão e receba um score comercial de 0 a 100 com diagnóstico automático de gargalos.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/scoreapp/cadastro" className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm uppercase tracking-wide">Começar agora</Link>
          <Link to="/scoreapp/login" className="border border-border px-8 py-4 rounded-md text-sm uppercase tracking-wide">Já tenho conta</Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-4 gap-4">
        {[
          { i: Target, t: "Meta clara", d: "Defina sua meta mensal e diária" },
          { i: LineChart, t: "Registro rápido", d: "Preencha o dia em 2 minutos" },
          { i: TrendingUp, t: "Conversões", d: "Taxas calculadas automaticamente" },
          { i: Trophy, t: "Score 0-100", d: "Diagnóstico e badges de evolução" },
        ].map((f, k) => (
          <div key={k} className="bg-card border border-border rounded-lg p-5">
            <f.i className="text-primary mb-3" size={20} />
            <div className="font-serif text-base mb-1">{f.t}</div>
            <div className="text-xs text-muted-foreground">{f.d}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
