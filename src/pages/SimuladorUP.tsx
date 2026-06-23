import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
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
import { ArrowDown, Minus, Plus, Sparkles, TrendingUp } from "lucide-react";

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

const ink = "#0B1220";
const cream = "#FAFAF7";
const green = "#0E9F6E";
const gold = "#C9A227";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function SimuladorUP() {
  const [produtoId, setProdutoId] = useState<string>(PRODUTOS[0].id);
  const [origem, setOrigem] = useState<Origem>("marketing");
  const [qtd, setQtd] = useState<number>(1);
  const [open, setOpen] = useState(false);

  const produto = PRODUTOS.find((p) => p.id === produtoId)!;

  const calc = useMemo(() => {
    const f = faixas(origem);
    const q = Math.max(1, qtd || 1);
    const min = produto.valor * f.min;
    const max = produto.valor * f.max;
    return {
      min,
      max,
      totalMin: min * q,
      totalMax: max * q,
      qtd: q,
      pctMin: f.min,
      pctMax: f.max,
    };
  }, [produto, origem, qtd]);

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
        background: cream,
        color: ink,
      }}
    >
      <Helmet>
        <title>Simulador de Receita | Vendedores UP</title>
        <meta
          name="description"
          content="Simule quanto você pode ganhar de comissão vendendo apartamentos dos empreendimentos UP. Faixas de 2% a 4% conforme origem da venda."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <style>{`
        .ff-display { font-family: 'Sora', system-ui, sans-serif; letter-spacing: -0.02em; }
        .num-tabular { font-variant-numeric: tabular-nums; }
        .up-grad-dark { background: radial-gradient(1200px 600px at 80% -10%, rgba(14,159,110,0.18), transparent 60%), linear-gradient(180deg, #0B1220 0%, #0E172A 100%); }
        .up-card-dark { background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01)); border: 1px solid rgba(255,255,255,0.08); }
        .up-glow { box-shadow: 0 30px 80px -30px rgba(14,159,110,0.45), 0 0 0 1px rgba(14,159,110,0.25) inset; }
        .up-pill { border: 1px solid rgba(14,159,110,0.35); background: rgba(14,159,110,0.08); color: #0E9F6E; }
        .up-table thead th { font-weight: 600; }
      `}</style>

      {/* HERO */}
      <section className="up-grad-dark text-white">
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="inline-flex items-center gap-2 rounded-full up-pill px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Carreira comercial UP
          </div>
          <h1 className="ff-display mt-6 text-4xl sm:text-6xl font-bold leading-[1.05]">
            Simule sua receita
            <br />
            como <span style={{ color: green }}>vendedor UP</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/70">
            Veja quanto você pode ganhar de comissão vendendo apartamentos da
            nossa carteira. Resultado em tempo real, sem cadastro.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => scrollTo("simulador")}
              className="h-12 px-7 text-base font-semibold border-0"
              style={{ background: green, color: "#fff" }}
            >
              Começar simulação <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => scrollTo("comparativo")}
              className="h-12 px-6 text-base text-white hover:bg-white/10"
            >
              Ver tabela de comissões
            </Button>
          </div>
        </div>
      </section>

      {/* EXPLICATIVO */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="ff-display text-2xl sm:text-3xl font-semibold">
            Como funciona a comissão na UP
          </h2>
          <p className="mt-3 text-base text-black/70">
            Na UP, sua comissão varia conforme a origem da oportunidade. Vendas
            de leads gerados pelo Marketing possuem uma faixa de comissão,
            enquanto vendas de captação própria ou carteira pessoal possuem uma
            faixa superior.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card className="p-6 border-black/10 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-black/50">
              Origem 1
            </div>
            <div className="ff-display mt-2 text-2xl font-semibold">
              Lead Marketing
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span
                className="ff-display num-tabular text-5xl font-bold"
                style={{ color: green }}
              >
                2%
              </span>
              <span className="text-black/40">a</span>
              <span
                className="ff-display num-tabular text-5xl font-bold"
                style={{ color: green }}
              >
                3%
              </span>
            </div>
            <p className="mt-3 text-sm text-black/60">
              Oportunidades qualificadas entregues pelo time de Marketing.
            </p>
          </Card>

          <Card className="p-6 border-black/10 shadow-sm" style={{ background: "#0B1220", color: "#fff" }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Origem 2
            </div>
            <div className="ff-display mt-2 text-2xl font-semibold">
              Captação Própria / Carteira
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span
                className="ff-display num-tabular text-5xl font-bold"
                style={{ color: gold }}
              >
                3%
              </span>
              <span className="text-white/40">a</span>
              <span
                className="ff-display num-tabular text-5xl font-bold"
                style={{ color: gold }}
              >
                4%
              </span>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Vendas que você origina pela sua própria prospecção e
              relacionamento.
            </p>
          </Card>
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" className="bg-black/[0.02] border-y border-black/5">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 grid gap-8 lg:grid-cols-5">
          {/* FORM */}
          <Card className="lg:col-span-2 p-6 sm:p-7 border-black/10 shadow-sm">
            <div className="ff-display text-xl font-semibold">
              Monte sua simulação
            </div>
            <p className="mt-1 text-sm text-black/60">
              Atualiza automaticamente ao mudar qualquer campo.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <Label className="text-sm font-medium">Produto</Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger className="mt-2 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUTOS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          {p.nome} — {brl(p.valor)}
                          {p.lancamento && (
                            <Badge
                              className="ml-1 border-0 text-[10px] font-semibold"
                              style={{ background: gold, color: "#0B1220" }}
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
                <Label className="text-sm font-medium">Origem da venda</Label>
                <RadioGroup
                  value={origem}
                  onValueChange={(v) => setOrigem(v as Origem)}
                  className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="o-mkt"
                    className={`cursor-pointer rounded-md border p-3 text-sm transition ${
                      origem === "marketing"
                        ? "border-[#0E9F6E] bg-[#0E9F6E]/5"
                        : "border-black/10 hover:border-black/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="o-mkt" value="marketing" />
                      <span className="font-medium">Lead Marketing</span>
                    </div>
                    <div className="mt-1 pl-6 text-xs text-black/55">2% a 3%</div>
                  </label>
                  <label
                    htmlFor="o-cap"
                    className={`cursor-pointer rounded-md border p-3 text-sm transition ${
                      origem === "captacao"
                        ? "border-[#C9A227] bg-[#C9A227]/10"
                        : "border-black/10 hover:border-black/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem id="o-cap" value="captacao" />
                      <span className="font-medium">Captação Própria</span>
                    </div>
                    <div className="mt-1 pl-6 text-xs text-black/55">3% a 4%</div>
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Quantidade de vendas
                </Label>
                <div className="mt-2 flex items-stretch gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
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
                    className="h-11 text-center text-lg font-semibold num-tabular"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setQtd((q) => q + 1)}
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-black/50">Mínimo 1 venda.</p>
              </div>
            </div>
          </Card>

          {/* RESULTADO */}
          <Card
            className="lg:col-span-3 p-6 sm:p-8 border-0 text-white up-glow"
            style={{ background: ink }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
              <TrendingUp className="h-3.5 w-3.5" style={{ color: green }} />
              Resultado da sua simulação
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-white/50 text-xs">Produto</div>
                <div className="mt-1 font-semibold flex items-center gap-1.5">
                  {produto.nome}
                  {produto.lancamento && (
                    <Badge
                      className="border-0 text-[10px]"
                      style={{ background: gold, color: ink }}
                    >
                      Lançamento
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Valor médio</div>
                <div className="mt-1 font-semibold num-tabular">
                  {brl(produto.valor)}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Origem</div>
                <div className="mt-1 font-semibold">
                  {origem === "marketing" ? "Lead Marketing" : "Captação Própria"}
                </div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Vendas simuladas</div>
                <div className="mt-1 font-semibold num-tabular">{calc.qtd}</div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="up-card-dark rounded-xl p-5">
                <div className="text-xs uppercase tracking-wider text-white/55">
                  Comissão por venda
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="ff-display num-tabular text-2xl font-semibold text-white/80">
                    {brl(calc.min)}
                  </span>
                  <span className="text-white/40 text-sm">a</span>
                  <span
                    className="ff-display num-tabular text-2xl font-semibold"
                    style={{ color: green }}
                  >
                    {brl(calc.max)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/45">
                  {(calc.pctMin * 100).toFixed(0)}% a{" "}
                  {(calc.pctMax * 100).toFixed(0)}% sobre o valor do imóvel
                </div>
              </div>

              <div
                className="rounded-xl p-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(14,159,110,0.25), rgba(201,162,39,0.18))",
                  border: "1px solid rgba(14,159,110,0.35)",
                }}
              >
                <div className="text-xs uppercase tracking-wider text-white/70">
                  Receita total estimada
                </div>
                <div className="mt-2 ff-display num-tabular text-4xl sm:text-5xl font-bold leading-none">
                  {brl(calc.totalMax)}
                </div>
                <div className="mt-2 text-sm text-white/75 num-tabular">
                  a partir de{" "}
                  <span className="font-semibold">{brl(calc.totalMin)}</span>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-white/65 leading-relaxed">
              Quanto mais você desenvolve carteira própria e gera oportunidades
              qualificadas, maior pode ser sua receita dentro da operação.
            </p>
          </Card>
        </div>
      </section>

      {/* COMPARATIVO */}
      <section id="comparativo" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="ff-display text-2xl sm:text-3xl font-semibold">
          Comparativo por empreendimento
        </h2>
        <p className="mt-2 text-black/60 text-sm sm:text-base">
          Faixas estimadas de comissão por venda em cada produto.
        </p>

        {/* Tabela desktop */}
        <div className="mt-6 hidden md:block overflow-hidden rounded-xl border border-black/10">
          <table className="up-table w-full text-sm">
            <thead className="bg-black/[0.04] text-black/70">
              <tr>
                <th className="text-left p-4">Produto</th>
                <th className="text-left p-4">Valor médio</th>
                <th className="text-left p-4">Lead Marketing (2%–3%)</th>
                <th className="text-left p-4">Captação Própria (3%–4%)</th>
              </tr>
            </thead>
            <tbody>
              {PRODUTOS.map((p) => (
                <tr key={p.id} className="border-t border-black/5">
                  <td className="p-4 font-medium">
                    <span className="flex items-center gap-2">
                      {p.nome}
                      {p.lancamento && (
                        <Badge
                          className="border-0 text-[10px]"
                          style={{ background: gold, color: ink }}
                        >
                          Lançamento
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="p-4 num-tabular text-black/80">
                    {brl(p.valor)}
                  </td>
                  <td className="p-4 num-tabular">
                    <span className="font-semibold" style={{ color: green }}>
                      {brl(p.valor * 0.02)} a {brl(p.valor * 0.03)}
                    </span>
                  </td>
                  <td className="p-4 num-tabular">
                    <span className="font-semibold" style={{ color: gold }}>
                      {brl(p.valor * 0.03)} a {brl(p.valor * 0.04)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards mobile */}
        <div className="mt-6 grid gap-3 md:hidden">
          {PRODUTOS.map((p) => (
            <Card key={p.id} className="p-4 border-black/10">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.nome}</div>
                {p.lancamento && (
                  <Badge
                    className="border-0 text-[10px]"
                    style={{ background: gold, color: ink }}
                  >
                    Lançamento
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-sm text-black/55 num-tabular">
                Valor médio {brl(p.valor)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-black/[0.04] p-3">
                  <div className="text-black/50">Marketing</div>
                  <div
                    className="mt-1 font-semibold num-tabular"
                    style={{ color: green }}
                  >
                    {brl(p.valor * 0.02)}
                    <span className="text-black/40"> a </span>
                    {brl(p.valor * 0.03)}
                  </div>
                </div>
                <div className="rounded-md bg-black/[0.04] p-3">
                  <div className="text-black/50">Captação</div>
                  <div
                    className="mt-1 font-semibold num-tabular"
                    style={{ color: gold }}
                  >
                    {brl(p.valor * 0.03)}
                    <span className="text-black/40"> a </span>
                    {brl(p.valor * 0.04)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="up-grad-dark text-white">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24 text-center">
          <h2 className="ff-display text-3xl sm:text-4xl font-bold leading-tight">
            Quer construir uma carreira comercial
            <br className="hidden sm:block" /> de{" "}
            <span style={{ color: green }}>alta performance</span>?
          </h2>
          <p className="mt-5 text-white/70 max-w-2xl mx-auto">
            Na UP, o vendedor não depende apenas da sorte. Ele trabalha com
            carteira, processo, relacionamento, produto certo e oportunidade
            real de crescimento.
          </p>
          <div className="mt-8">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold border-0"
                  style={{ background: green, color: "#fff" }}
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
                      <Input
                        id="wa"
                        required
                        placeholder="(00) 00000-0000"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input id="cidade" required className="mt-1.5" />
                    </div>
                  </div>
                  <div>
                    <Label>Já atua com vendas?</Label>
                    <RadioGroup
                      name="vendas"
                      defaultValue="sim"
                      className="mt-2 flex gap-4"
                    >
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
                    <RadioGroup
                      name="imob"
                      defaultValue="nao"
                      className="mt-2 flex gap-4"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="sim" /> Sim
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="nao" /> Não
                      </label>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="exp">
                      Conte brevemente sua experiência comercial
                    </Label>
                    <Textarea
                      id="exp"
                      rows={4}
                      className="mt-1.5"
                      placeholder="Empresas, segmentos, tempo de mercado, resultados..."
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold border-0"
                    style={{ background: green, color: "#fff" }}
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
        <p className="text-xs text-black/45 leading-relaxed">
          Os valores apresentados são simulações estimadas com base nos valores
          médios dos empreendimentos e nas faixas de comissão informadas. A
          remuneração final pode variar conforme regras comerciais, negociação,
          produto, origem da venda e política vigente da empresa.
        </p>
      </footer>
    </div>
  );
}
