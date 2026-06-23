import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowDown, Minus, Plus, Target, TrendingUp } from "lucide-react";

type Origem = "marketing" | "captacao";

interface Produto {
  id: string;
  nome: string;
  valor: number;
  lancamento?: boolean;
}

const PRODUTOS: Produto[] = [
  { id: "veneza", nome: "Residencial Veneza", valor: 350_000 },
  { id: "montrezor", nome: "Montrezor", valor: 850_000 },
  { id: "park-europa", nome: "Park Europa", valor: 210_000 },
  { id: "park-alterosas", nome: "Park Alterosas", valor: 210_000, lancamento: true },
];

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const faixas = (origem: Origem) =>
  origem === "marketing" ? { min: 0.02, max: 0.03 } : { min: 0.03, max: 0.04 };

// Identidade visual oficial
const grafite = "#111418";
const petroleo = "#17242B";
const laranja = "#C4632D";
const areia = "#C8A77A";
const off = "#F4EFE8";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SimuladorUP() {
  const [produtoId, setProdutoId] = useState<string>(PRODUTOS[0].id);
  const [origem, setOrigem] = useState<Origem>("marketing");
  const [qtd, setQtd] = useState<number>(1);
  const [conversao, setConversao] = useState<number>(10); // % default
  const [semanas, setSemanas] = useState<number>(4);
  const [open, setOpen] = useState(false);

  const produto = PRODUTOS.find((p) => p.id === produtoId)!;

  const calc = useMemo(() => {
    const f = faixas(origem);
    const q = Math.max(1, qtd || 1);
    const min = produto.valor * f.min;
    const max = produto.valor * f.max;
    const conv = Math.max(1, conversao) / 100;
    const sem = Math.max(1, semanas || 1);
    const leadsTotais = Math.ceil(q / conv);
    const leadsSemana = Math.ceil(leadsTotais / sem);
    const leadsDia = Math.ceil(leadsSemana / 5);
    return {
      min,
      max,
      totalMin: min * q,
      totalMax: max * q,
      qtd: q,
      pctMin: f.min,
      pctMax: f.max,
      leadsTotais,
      leadsSemana,
      leadsDia,
      conv,
      sem,
    };
  }, [produto, origem, qtd, conversao, semanas]);

  function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Recebemos seu interesse!", {
      description: "Em breve o time UP entra em contato.",
    });
    (e.target as HTMLFormElement).reset();
    setOpen(false);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: off,
        color: grafite,
      }}
    >
      <Helmet>
        <title>Simulador de Receita | Vendedores UP</title>
        <meta
          name="description"
          content="Simule receita de comissão e descubra quantos leads você precisa prospectar por semana para bater suas metas como vendedor UP."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <style>{`
        .ff-display { font-family: 'Libre Baskerville', Georgia, serif; letter-spacing: -0.01em; }
        .num-tabular { font-variant-numeric: tabular-nums; }
        .up-bg-dark { background: ${petroleo}; }
        .up-bg-darker { background: ${grafite}; }
        .up-grad-hero {
          background:
            radial-gradient(900px 500px at 85% -10%, rgba(196,99,45,0.22), transparent 60%),
            linear-gradient(180deg, ${grafite} 0%, ${petroleo} 100%);
        }
        .up-card-dark { background: rgba(255,255,255,0.03); border: 1px solid rgba(244,239,232,0.10); }
        .up-rule { border-color: rgba(17,20,24,0.10); }
        .up-accent { color: ${laranja}; }
        .up-mark::before {
          content: ""; display: inline-block; width: 28px; height: 2px;
          background: ${laranja}; margin-right: 12px; vertical-align: middle;
        }
      `}</style>

      {/* HERO */}
      <section className="up-grad-hero" style={{ color: off }}>
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div
            className="inline-flex items-center gap-2 rounded-sm px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{
              border: `1px solid ${laranja}`,
              color: laranja,
              background: "rgba(196,99,45,0.08)",
            }}
          >
            Carreira comercial UP
          </div>
          <h1 className="ff-display mt-7 text-4xl sm:text-6xl font-bold leading-[1.08]">
            Simule sua receita
            <br />
            como vendedor <span className="up-accent">UP</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg" style={{ color: "rgba(244,239,232,0.72)" }}>
            Comissão por venda, receita total e <strong style={{ color: areia }}>quantos leads você precisa
            prospectar por semana</strong> para bater sua meta. Sem cadastro.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => scrollTo("simulador")}
              className="h-12 px-7 text-base font-semibold rounded-sm border-0"
              style={{ background: laranja, color: off }}
            >
              Começar simulação <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => scrollTo("comparativo")}
              className="h-12 px-6 text-base rounded-sm hover:bg-white/10"
              style={{ color: off }}
            >
              Ver tabela de comissões
            </Button>
          </div>
        </div>
      </section>

      {/* EXPLICATIVO */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.2em] font-semibold up-mark" style={{ color: laranja }}>
            Como funciona
          </div>
          <h2 className="ff-display mt-3 text-2xl sm:text-3xl font-bold">
            Comissão na UP varia pela origem da venda
          </h2>
          <p className="mt-3 text-base" style={{ color: "rgba(17,20,24,0.7)" }}>
            Leads vindos do Marketing entram em uma faixa de comissão. Vendas
            de captação própria e carteira pessoal entram em uma faixa
            superior — quem prospecta ganha mais.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <Card className="p-7 rounded-sm border up-rule shadow-none bg-white" style={{ color: grafite }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(17,20,24,0.5)" }}>
              Origem 1 — Marketing
            </div>
            <div className="ff-display mt-3 text-2xl font-bold" style={{ color: petroleo }}>Lead Marketing</div>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="ff-display num-tabular text-5xl font-bold" style={{ color: grafite }}>2%</span>
              <span style={{ color: "rgba(17,20,24,0.4)" }}>—</span>
              <span className="ff-display num-tabular text-5xl font-bold" style={{ color: grafite }}>3%</span>
            </div>
            <p className="mt-4 text-sm" style={{ color: "rgba(17,20,24,0.6)" }}>
              Oportunidades qualificadas entregues pelo time de Marketing.
            </p>
          </Card>

          <Card className="p-7 rounded-sm border-0 shadow-none" style={{ background: petroleo, color: off }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(244,239,232,0.5)" }}>
              Origem 2 — Você
            </div>
            <div className="ff-display mt-3 text-2xl font-bold">Captação Própria / Carteira</div>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="ff-display num-tabular text-5xl font-bold" style={{ color: laranja }}>3%</span>
              <span style={{ color: "rgba(244,239,232,0.4)" }}>—</span>
              <span className="ff-display num-tabular text-5xl font-bold" style={{ color: laranja }}>4%</span>
            </div>
            <p className="mt-4 text-sm" style={{ color: "rgba(244,239,232,0.65)" }}>
              Vendas que você origina pela sua prospecção e relacionamento.
            </p>
          </Card>
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" style={{ background: "rgba(17,20,24,0.03)", borderTop: "1px solid rgba(17,20,24,0.06)", borderBottom: "1px solid rgba(17,20,24,0.06)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.2em] font-semibold up-mark" style={{ color: laranja }}>
              Simulador
            </div>
            <h2 className="ff-display mt-3 text-2xl sm:text-3xl font-bold">
              Quanto você ganha — e quantos leads precisa abordar
            </h2>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            {/* FORM */}
            <Card className="lg:col-span-2 p-6 sm:p-7 rounded-sm border up-rule shadow-none bg-white" style={{ color: grafite }}>
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: petroleo }}>Produto</Label>
                  <Select value={produtoId} onValueChange={setProdutoId}>
                    <SelectTrigger className="mt-2 h-11 rounded-sm bg-white border-[rgba(17,20,24,0.15)] text-[#111418]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUTOS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            {p.nome} — {brl(p.valor)}
                            {p.lancamento && (
                              <Badge
                                className="ml-1 border-0 text-[10px] font-semibold rounded-sm"
                                style={{ background: areia, color: grafite }}
                              >
                                Lançamento
                              </Badge>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: petroleo }}>Origem da venda</Label>
                  <RadioGroup
                    value={origem}
                    onValueChange={(v) => setOrigem(v as Origem)}
                    className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    <label
                      htmlFor="o-mkt"
                      className="cursor-pointer rounded-sm border p-3 text-sm transition"
                      style={{
                        borderColor: origem === "marketing" ? grafite : "rgba(17,20,24,0.15)",
                        background: origem === "marketing" ? "rgba(17,20,24,0.04)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="o-mkt" value="marketing" />
                        <span className="font-semibold">Lead Marketing</span>
                      </div>
                      <div className="mt-1 pl-6 text-xs" style={{ color: "rgba(17,20,24,0.55)" }}>2% a 3%</div>
                    </label>
                    <label
                      htmlFor="o-cap"
                      className="cursor-pointer rounded-sm border p-3 text-sm transition"
                      style={{
                        borderColor: origem === "captacao" ? laranja : "rgba(17,20,24,0.15)",
                        background: origem === "captacao" ? "rgba(196,99,45,0.06)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id="o-cap" value="captacao" />
                        <span className="font-semibold">Captação Própria</span>
                      </div>
                      <div className="mt-1 pl-6 text-xs" style={{ color: "rgba(17,20,24,0.55)" }}>3% a 4%</div>
                    </label>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: petroleo }}>
                    Meta de vendas
                  </Label>
                  <div className="mt-2 flex items-stretch gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-sm"
                      onClick={() => setQtd((q) => Math.max(1, q - 1))}
                      aria-label="Diminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={qtd}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setQtd(Number.isFinite(n) && n >= 1 ? n : 1);
                      }}
                      className="h-11 text-center text-lg font-semibold num-tabular rounded-sm bg-white border-[rgba(17,20,24,0.15)] text-[#111418]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-sm"
                      onClick={() => setQtd((q) => q + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "rgba(17,20,24,0.5)" }}>
                    Quantas vendas você quer fechar.
                  </p>
                </div>

                <div className="pt-2 border-t up-rule">
                  <div className="flex items-baseline justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: petroleo }}>
                      Taxa de conversão
                    </Label>
                    <span className="num-tabular text-lg font-bold" style={{ color: laranja }}>
                      {conversao}%
                    </span>
                  </div>
                  <Slider
                    value={[conversao]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(v) => setConversao(v[0])}
                    className="mt-3"
                  />
                  <p className="mt-1.5 text-xs" style={{ color: "rgba(17,20,24,0.5)" }}>
                    Base de mercado: 10% dos leads viram venda.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider" style={{ color: petroleo }}>
                    Prazo (semanas)
                  </Label>
                  <div className="mt-2 flex items-stretch gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-sm"
                      onClick={() => setSemanas((s) => Math.max(1, s - 1))}
                      aria-label="Menos semanas"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={semanas}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        setSemanas(Number.isFinite(n) && n >= 1 ? n : 1);
                      }}
                      className="h-11 text-center text-lg font-semibold num-tabular rounded-sm bg-white border-[rgba(17,20,24,0.15)] text-[#111418]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-sm"
                      onClick={() => setSemanas((s) => s + 1)}
                      aria-label="Mais semanas"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "rgba(17,20,24,0.5)" }}>
                    Em quanto tempo quer bater a meta.
                  </p>
                </div>
              </div>
            </Card>

            {/* RESULTADO */}
            <div className="lg:col-span-3 space-y-4">
              {/* Receita */}
              <Card className="p-6 sm:p-8 rounded-sm border-0 shadow-none" style={{ background: grafite, color: off }}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "rgba(244,239,232,0.6)" }}>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: laranja }} />
                  Receita estimada
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.5)" }}>Produto</div>
                    <div className="mt-1 font-semibold flex items-center gap-1.5">
                      {produto.nome}
                      {produto.lancamento && (
                        <Badge className="border-0 text-[10px] rounded-sm" style={{ background: areia, color: grafite }}>
                          Lançamento
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.5)" }}>Valor médio</div>
                    <div className="mt-1 font-semibold num-tabular">{brl(produto.valor)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.5)" }}>Origem</div>
                    <div className="mt-1 font-semibold">
                      {origem === "marketing" ? "Marketing" : "Captação"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.5)" }}>Vendas</div>
                    <div className="mt-1 font-semibold num-tabular">{calc.qtd}</div>
                  </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="up-card-dark rounded-sm p-5">
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.55)" }}>
                      Comissão por venda
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="ff-display num-tabular text-2xl font-bold" style={{ color: "rgba(244,239,232,0.85)" }}>
                        {brl(calc.min)}
                      </span>
                      <span style={{ color: "rgba(244,239,232,0.4)" }} className="text-sm">—</span>
                      <span className="ff-display num-tabular text-2xl font-bold" style={{ color: laranja }}>
                        {brl(calc.max)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "rgba(244,239,232,0.45)" }}>
                      {(calc.pctMin * 100).toFixed(0)}% a {(calc.pctMax * 100).toFixed(0)}% sobre o valor
                    </div>
                  </div>

                  <div
                    className="rounded-sm p-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(196,99,45,0.28), rgba(200,167,122,0.18))",
                      border: `1px solid rgba(196,99,45,0.45)`,
                    }}
                  >
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "rgba(244,239,232,0.85)" }}>
                      Receita total estimada
                    </div>
                    <div className="ff-display num-tabular mt-2 text-4xl sm:text-5xl font-bold leading-none">
                      {brl(calc.totalMax)}
                    </div>
                    <div className="mt-2 text-sm num-tabular" style={{ color: "rgba(244,239,232,0.8)" }}>
                      a partir de <span className="font-semibold">{brl(calc.totalMin)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Esforço de prospecção */}
              <Card className="p-6 sm:p-8 rounded-sm border-0 shadow-none" style={{ background: petroleo, color: off }}>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "rgba(244,239,232,0.6)" }}>
                  <Target className="h-3.5 w-3.5" style={{ color: laranja }} />
                  Esforço de prospecção
                </div>
                <p className="mt-3 text-sm" style={{ color: "rgba(244,239,232,0.75)" }}>
                  Com taxa de conversão de <strong style={{ color: areia }}>{conversao}%</strong>,
                  para fechar <strong style={{ color: areia }}>{calc.qtd}</strong>{" "}
                  {calc.qtd === 1 ? "venda" : "vendas"} em{" "}
                  <strong style={{ color: areia }}>{calc.sem}</strong>{" "}
                  {calc.sem === 1 ? "semana" : "semanas"} você precisa:
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="up-card-dark rounded-sm p-5">
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.55)" }}>
                      Leads no total
                    </div>
                    <div className="ff-display num-tabular mt-2 text-3xl font-bold">
                      {calc.leadsTotais}
                    </div>
                  </div>
                  <div className="rounded-sm p-5" style={{ background: laranja, color: off }}>
                    <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "rgba(244,239,232,0.85)" }}>
                      Leads por semana
                    </div>
                    <div className="ff-display num-tabular mt-2 text-4xl font-bold leading-none">
                      {calc.leadsSemana}
                    </div>
                    <div className="mt-2 text-xs" style={{ color: "rgba(244,239,232,0.85)" }}>
                      Sua meta semanal de abordagem
                    </div>
                  </div>
                  <div className="up-card-dark rounded-sm p-5">
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(244,239,232,0.55)" }}>
                      Leads por dia útil
                    </div>
                    <div className="ff-display num-tabular mt-2 text-3xl font-bold">
                      {calc.leadsDia}
                    </div>
                    <div className="mt-1 text-[11px]" style={{ color: "rgba(244,239,232,0.5)" }}>
                      base 5 dias/semana
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-relaxed" style={{ color: "rgba(244,239,232,0.55)" }}>
                  Fórmula: leads = vendas ÷ taxa de conversão. Quanto melhor a
                  sua qualificação, menor o volume necessário.
                </p>
              </Card>

              <p className="text-sm leading-relaxed px-1" style={{ color: "rgba(17,20,24,0.65)" }}>
                Quanto mais você desenvolve carteira própria e gera
                oportunidades qualificadas, maior pode ser sua receita —
                e menor o número de leads que precisa abordar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section id="comparativo" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="text-[11px] uppercase tracking-[0.2em] font-semibold up-mark" style={{ color: laranja }}>
          Comparativo
        </div>
        <h2 className="ff-display mt-3 text-2xl sm:text-3xl font-bold">
          Comissão por empreendimento
        </h2>
        <p className="mt-2 text-sm sm:text-base" style={{ color: "rgba(17,20,24,0.6)" }}>
          Faixas estimadas de comissão por venda em cada produto.
        </p>

        {/* Tabela desktop */}
        <div className="mt-7 hidden md:block overflow-hidden rounded-sm border up-rule">
          <table className="w-full text-sm">
            <thead style={{ background: grafite, color: off }}>
              <tr>
                <th className="text-left p-4 text-[11px] uppercase tracking-wider font-semibold">Produto</th>
                <th className="text-left p-4 text-[11px] uppercase tracking-wider font-semibold">Valor médio</th>
                <th className="text-left p-4 text-[11px] uppercase tracking-wider font-semibold">Marketing (2%–3%)</th>
                <th className="text-left p-4 text-[11px] uppercase tracking-wider font-semibold">Captação (3%–4%)</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {PRODUTOS.map((p) => (
                <tr key={p.id} className="border-t up-rule">
                  <td className="p-4 font-semibold">
                    <span className="flex items-center gap-2">
                      {p.nome}
                      {p.lancamento && (
                        <Badge className="border-0 text-[10px] rounded-sm" style={{ background: areia, color: grafite }}>
                          Lançamento
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="p-4 num-tabular" style={{ color: "rgba(17,20,24,0.8)" }}>{brl(p.valor)}</td>
                  <td className="p-4 num-tabular font-semibold">
                    {brl(p.valor * 0.02)} <span style={{ color: "rgba(17,20,24,0.4)" }}>—</span> {brl(p.valor * 0.03)}
                  </td>
                  <td className="p-4 num-tabular font-semibold" style={{ color: laranja }}>
                    {brl(p.valor * 0.03)} <span style={{ color: "rgba(17,20,24,0.4)" }}>—</span> {brl(p.valor * 0.04)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="mt-6 grid gap-3 md:hidden">
          {PRODUTOS.map((p) => (
            <Card key={p.id} className="p-4 rounded-sm border up-rule shadow-none bg-white" style={{ color: grafite }}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.nome}</div>
                {p.lancamento && (
                  <Badge className="border-0 text-[10px] rounded-sm" style={{ background: areia, color: grafite }}>
                    Lançamento
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm num-tabular" style={{ color: "rgba(17,20,24,0.55)" }}>
                Valor médio {brl(p.valor)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-sm p-3" style={{ background: "rgba(17,20,24,0.04)" }}>
                  <div style={{ color: "rgba(17,20,24,0.5)" }}>Marketing</div>
                  <div className="mt-1 font-semibold num-tabular">
                    {brl(p.valor * 0.02)} — {brl(p.valor * 0.03)}
                  </div>
                </div>
                <div className="rounded-sm p-3" style={{ background: "rgba(196,99,45,0.08)" }}>
                  <div style={{ color: "rgba(17,20,24,0.5)" }}>Captação</div>
                  <div className="mt-1 font-semibold num-tabular" style={{ color: laranja }}>
                    {brl(p.valor * 0.03)} — {brl(p.valor * 0.04)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="up-grad-hero" style={{ color: off }}>
        <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24 text-center">
          <div
            className="inline-block text-[11px] uppercase tracking-[0.2em] font-semibold mb-5"
            style={{ color: laranja }}
          >
            — Time UP
          </div>
          <h2 className="ff-display text-3xl sm:text-4xl font-bold leading-tight">
            Quer construir uma carreira comercial
            <br className="hidden sm:block" /> de <span className="up-accent">alta performance</span>?
          </h2>
          <p className="mt-5 max-w-2xl mx-auto" style={{ color: "rgba(244,239,232,0.72)" }}>
            Na UP, o vendedor não depende da sorte. Trabalha com carteira,
            processo, relacionamento, produto certo e oportunidade real de
            crescimento.
          </p>
          <div className="mt-8">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold rounded-sm border-0"
                  style={{ background: laranja, color: off }}
                >
                  Quero fazer parte do time UP
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="ff-display text-2xl">
                    Inscreva-se no time UP
                  </DialogTitle>
                  <DialogDescription>
                    Conta um pouco sobre você. Vamos retornar em breve.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLeadSubmit} className="space-y-4 mt-2">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input id="nome" required className="mt-1.5" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="wa">WhatsApp</Label>
                      <Input id="wa" required placeholder="(00) 00000-0000" className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" required className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label>Já atua com vendas?</Label>
                    <RadioGroup name="vendas" defaultValue="sim" className="mt-2 flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="sim" /> Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="nao" /> Não
                      </label>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label>Já atua no mercado imobiliário?</Label>
                    <RadioGroup name="imob" defaultValue="nao" className="mt-2 flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="sim" /> Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="nao" /> Não
                      </label>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="exp">Conte brevemente sua experiência comercial</Label>
                    <Textarea
                      id="exp"
                      rows={4}
                      className="mt-1.5"
                      placeholder="Empresas, segmentos, tempo de mercado, resultados..."
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold rounded-sm border-0"
                    style={{ background: laranja, color: off }}
                  >
                    Enviar inscrição
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* AVISO */}
      <footer className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs leading-relaxed" style={{ color: "rgba(17,20,24,0.45)" }}>
          Os valores apresentados são simulações estimadas com base nos valores
          médios dos empreendimentos, nas faixas de comissão e na taxa de
          conversão informadas. A remuneração final pode variar conforme
          regras comerciais, negociação, produto, origem da venda e política
          vigente da empresa.
        </p>
      </footer>
    </div>
  );
}
