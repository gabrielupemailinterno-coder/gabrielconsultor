import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Clock,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TermoAdesao, { TERMO_ADESAO_VERSION, downloadTermoPdf } from "@/components/TermoAdesao";
import { getPartnerRef } from "@/lib/partnerRef";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";

type PlanRow = {
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  installments: number;
  duration_months: number;
  total_meetings: number;
};

const DEFAULT_SLUG = "mentoria-comercial-3m";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const STEPS = [
  { id: 1, label: "Oferta" },
  { id: 2, label: "Perfil profissional" },
  { id: 3, label: "Pagamento" },
];

type Onboarding = {
  cargo: string;
  empresa: string;
  segmento: string;
  produto: string;
  experiencia: string;
  canal: string;
  ticketMedio: string;
  gargalo: string;
  comentarios: string;
};

const empty: Onboarding = {
  cargo: "",
  empresa: "",
  segmento: "",
  produto: "",
  experiencia: "",
  canal: "",
  ticketMedio: "",
  gargalo: "",
  comentarios: "",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Como é o acesso após o pagamento?",
    a: "Assim que a primeira parcela é confirmada, você recebe por e-mail o link para criar sua senha e acessar a plataforma em /app/mentorados. Os dois primeiros encontros já ficam disponíveis para agendamento.",
  },
  {
    q: "Como funcionam os encontros?",
    a: "São encontros individuais por vídeo, com Gabriel Vieira, agendados diretamente pela plataforma. Você define o horário conforme sua agenda comercial.",
  },
  {
    q: "Existe garantia?",
    a: "Sim. Os primeiros 7 dias após o pagamento inicial são período de arrependimento — se decidir não continuar, o valor é reembolsado integralmente.",
  },
  {
    q: "Como é feito o pagamento?",
    a: "Cobrança recorrente mensal pelo Asaas, com cartão de crédito ou boleto. Multa de 2% e juros de 1% ao mês em caso de atraso, conforme o Termo de Adesão.",
  },
  {
    q: "E se eu não puder participar de um encontro?",
    a: "Você pode remarcar diretamente na plataforma até 12h antes. Encontros perdidos sem remarcação prévia não são repostos.",
  },
];

export default function CheckoutMentoria() {
  const [params] = useSearchParams();
  const offerSlug = params.get("offer") || DEFAULT_SLUG;

  useAnalytics(`/checkout/mentoria?offer=${offerSlug}`);

  const [plan, setPlan] = useState<PlanRow | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 2 — profile
  const [ob, setOb] = useState<Onboarding>(empty);

  // Step 3 — billing + terms
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    postalCode: "",
    addressNumber: "",
    address: "",
    addressComplement: "",
    province: "",
    city: "",
    state: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedExec, setAcceptedExec] = useState(false);
  const [acceptedWhatsapp, setAcceptedWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setPlanLoading(true);
    supabase
      .from("mentorship_plans")
      .select("slug,name,description,price_cents,installments,duration_months,total_meetings")
      .eq("slug", offerSlug)
      .eq("active", true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) console.warn(error);
        setPlan((data as PlanRow) ?? null);
        setPlanLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [offerSlug]);

  const priceInstallment = useMemo(() => {
    if (!plan) return 0;
    return plan.price_cents / 100 / plan.installments;
  }, [plan]);
  const priceTotal = useMemo(() => (plan ? plan.price_cents / 100 : 0), [plan]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: k === "state" ? e.target.value.toUpperCase() : e.target.value }));

  const onCepBlur = async () => {
    const cep = form.postalCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const j = await r.json();
      if (!j.erro)
        setForm((s) => ({
          ...s,
          address: j.logradouro || s.address,
          province: j.bairro || s.province,
          city: j.localidade || s.city,
          state: j.uf || s.state,
        }));
    } catch {
      /* ignore */
    }
  };

  const canGoStep2 = !!plan;
  const canGoStep3 =
    ob.cargo.trim().length > 1 &&
    ob.empresa.trim().length > 1 &&
    ob.segmento.trim().length > 1 &&
    ob.experiencia.length > 0 &&
    ob.gargalo.length > 0;

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms || !acceptedExec) {
      toast.error("Aceite os termos para continuar.");
      return;
    }
    setLoading(true);
    trackClick("cta", "checkout_mentoria_submit");
    const { data, error } = await supabase.functions.invoke("asaas-create-checkout", {
      body: {
        offer_slug: plan?.slug || DEFAULT_SLUG,
        name: form.name,
        email: form.email,
        phone: form.phone,
        cpfCnpj: form.cpf.replace(/\D/g, ""),
        postalCode: form.postalCode,
        addressNumber: form.addressNumber,
        address: form.address,
        addressComplement: form.addressComplement,
        province: form.province,
        city: form.city,
        state: form.state,
        terms_accepted: true,
        terms_version: TERMO_ADESAO_VERSION,
        partner_code: getPartnerRef(),
        onboarding: {
          ...ob,
          whatsapp_optin: acceptedWhatsapp,
          submitted_at: new Date().toISOString(),
        },
      },
    });
    setLoading(false);
    const payload = data as any;
    const invoiceUrl = payload?.invoiceUrl;
    if (error || !invoiceUrl) {
      const msg = payload?.error || error?.message || "Não foi possível gerar o checkout.";
      toast.error(msg);
      return;
    }
    window.location.href = invoiceUrl;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Checkout — Mentoria Comercial Individual · Gabriel Vieira</title>
        <meta
          name="description"
          content="Mentoria Comercial Individual com Gabriel Vieira. Encontros 1:1, plano de ação sob medida e execução acompanhada. Contrate em minutos."
        />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Header minimalista */}
      <header className="border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link to="/mentoria-profissional" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} /> Ambiente seguro · Pagamento processado por Asaas
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Stepper */}
        <ol className="flex items-center gap-2 sm:gap-4 mb-8 text-xs sm:text-sm">
          {STEPS.map((s, idx) => {
            const active = step === s.id;
            const done = step > s.id;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center rounded-full h-7 w-7 border font-mono ${
                    done
                      ? "bg-primary text-primary-foreground border-primary"
                      : active
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {done ? <Check size={14} /> : s.id}
                </span>
                <span className={active || done ? "font-medium" : "text-muted-foreground"}>{s.label}</span>
                {idx < STEPS.length - 1 && <span className="mx-1 sm:mx-2 h-px w-6 sm:w-10 bg-border" />}
              </li>
            );
          })}
        </ol>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* MAIN COLUMN */}
          <div className="space-y-6">
            {/* HEADLINE */}
            <section>
              <p className="uppercase tracking-widest text-xs text-primary font-semibold">Mentoria Comercial Individual</p>
              <h1 className="text-3xl sm:text-4xl font-serif mt-1 leading-tight">
                {plan?.name || "Mentoria Comercial Individual — 3 meses"}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                Processo estruturado, encontros 1:1 e execução acompanhada — para vendedores e consultores que precisam de
                previsibilidade em pipeline, taxa de conversão e ticket médio.
              </p>
            </section>

            {planLoading && (
              <div className="rounded-lg border border-border p-6 flex items-center gap-3 text-muted-foreground">
                <Loader2 className="animate-spin" size={16} /> Carregando oferta…
              </div>
            )}

            {!planLoading && !plan && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-sm">
                Oferta <code className="font-mono">{offerSlug}</code> não encontrada ou inativa. Volte para a página da
                mentoria e tente novamente.
              </div>
            )}

            {/* STEP 1 — OFFER */}
            {step === 1 && plan && (
              <section className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                    <Sparkles size={14} /> O que está incluso
                  </div>
                  <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                    {[
                      `${plan.total_meetings} encontros 1:1 com Gabriel Vieira`,
                      `Duração de ${plan.duration_months} meses`,
                      "Plano de ação individual e acompanhamento semanal",
                      "Diagnóstico do funil e revisão de discurso",
                      "Materiais, templates e livro-base (SPIN Selling)",
                      "Canal direto com Gabriel entre encontros",
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <Check size={16} className="text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Target size={16} className="text-primary" /> Para quem é
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Vendedores B2B e consultores de venda complexa</li>
                      <li>• Profissionais liberais que vendem serviço de alto ticket</li>
                      <li>• Sócios e comerciais que assumiram meta e não têm processo claro</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-border p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Users size={16} className="text-primary" /> Não é para
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Quem procura fórmula mágica ou "hack" de vendas</li>
                      <li>• Quem não vai dedicar tempo semanal para executar o plano</li>
                      <li>• Times inteiros — este produto é 1:1, não em grupo</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck size={16} className="text-primary" /> Condição contratual
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Assinatura mensal — {plan.installments}x de <strong className="text-foreground">{brl(priceInstallment)}</strong>{" "}
                    ({brl(priceTotal)} no total). Cobrança recorrente pelo Asaas. Multa de 2% e juros de 1% ao mês em caso de
                    atraso, conforme Termo de Adesão apresentado no passo final.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    disabled={!canGoStep2}
                    onClick={() => {
                      trackClick("cta", "checkout_mentoria_step1_next");
                      setStep(2);
                    }}
                    className="h-11 px-6"
                  >
                    Continuar <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 2 — PROFILE */}
            {step === 2 && plan && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-serif">Perfil profissional</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Usado para preparar seu primeiro encontro. Leva menos de 2 minutos.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cargo">Cargo atual *</Label>
                      <Input
                        id="cargo"
                        value={ob.cargo}
                        onChange={(e) => setOb({ ...ob, cargo: e.target.value })}
                        placeholder="Ex.: Consultor comercial"
                      />
                    </div>
                    <div>
                      <Label htmlFor="empresa">Empresa *</Label>
                      <Input
                        id="empresa"
                        value={ob.empresa}
                        onChange={(e) => setOb({ ...ob, empresa: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="segmento">Segmento *</Label>
                      <Input
                        id="segmento"
                        value={ob.segmento}
                        onChange={(e) => setOb({ ...ob, segmento: e.target.value })}
                        placeholder="Ex.: SaaS, serviços jurídicos, seguros"
                      />
                    </div>
                    <div>
                      <Label htmlFor="produto">Produto/serviço vendido</Label>
                      <Input
                        id="produto"
                        value={ob.produto}
                        onChange={(e) => setOb({ ...ob, produto: e.target.value })}
                        placeholder="O que você vende"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Tempo de experiência em vendas *</Label>
                    <RadioGroup
                      className="grid sm:grid-cols-4 gap-2 mt-2"
                      value={ob.experiencia}
                      onValueChange={(v) => setOb({ ...ob, experiencia: v })}
                    >
                      {["< 1 ano", "1 a 3 anos", "3 a 7 anos", "7+ anos"].map((v) => (
                        <label
                          key={v}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                            ob.experiencia === v ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={v} />
                          {v}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Canal principal</Label>
                      <Select value={ob.canal} onValueChange={(v) => setOb({ ...ob, canal: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Prospecção ativa (outbound)", "Inbound / marketing", "Indicações", "Rede/relacionamento", "Misto"].map(
                            (v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ticket médio da venda</Label>
                      <Select value={ob.ticketMedio} onValueChange={(v) => setOb({ ...ob, ticketMedio: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Até R$ 1.000", "R$ 1.000 – R$ 5.000", "R$ 5.000 – R$ 20.000", "R$ 20.000 – R$ 100.000", "R$ 100.000+"].map(
                            (v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Principal gargalo hoje *</Label>
                    <RadioGroup
                      className="grid sm:grid-cols-2 gap-2 mt-2"
                      value={ob.gargalo}
                      onValueChange={(v) => setOb({ ...ob, gargalo: v })}
                    >
                      {[
                        "Gerar reuniões qualificadas",
                        "Converter reunião em proposta",
                        "Fechar após enviar proposta",
                        "Aumentar ticket médio",
                        "Organizar processo/pipeline",
                        "Constância / disciplina de execução",
                      ].map((v) => (
                        <label
                          key={v}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                            ob.gargalo === v ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={v} />
                          {v}
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="comentarios">Algo que Gabriel precisa saber antes do 1º encontro?</Label>
                    <Textarea
                      id="comentarios"
                      value={ob.comentarios}
                      onChange={(e) => setOb({ ...ob, comentarios: e.target.value })}
                      placeholder="Contexto, meta, prazo, situação específica…"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} className="mr-2" /> Voltar
                  </Button>
                  <Button disabled={!canGoStep3} onClick={() => setStep(3)} className="h-11 px-6">
                    Continuar <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </section>
            )}

            {/* STEP 3 — PAYMENT */}
            {step === 3 && plan && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-xl font-serif">Dados de cobrança</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Necessários para emissão da fatura e do contrato.
                  </p>
                </div>

                <form onSubmit={submitPayment} className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <Input placeholder="Nome completo" value={form.name} onChange={set("name")} required />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input type="email" placeholder="E-mail" value={form.email} onChange={set("email")} required />
                    <Input placeholder="WhatsApp (com DDD)" value={form.phone} onChange={set("phone")} required />
                  </div>
                  <Input placeholder="CPF" value={form.cpf} onChange={set("cpf")} required />

                  <div className="pt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Endereço de cobrança
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="CEP" value={form.postalCode} onChange={set("postalCode")} onBlur={onCepBlur} required />
                    <Input
                      className="col-span-2"
                      placeholder="Endereço"
                      value={form.address}
                      onChange={set("address")}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Número" value={form.addressNumber} onChange={set("addressNumber")} required />
                    <Input
                      className="col-span-2"
                      placeholder="Complemento (opcional)"
                      value={form.addressComplement}
                      onChange={set("addressComplement")}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Bairro" value={form.province} onChange={set("province")} required />
                    <Input placeholder="Cidade" value={form.city} onChange={set("city")} required />
                    <Input placeholder="UF" maxLength={2} value={form.state} onChange={set("state")} required />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <TermoAdesao
                      data={{
                        name: form.name,
                        cpf: form.cpf,
                        email: form.email,
                        address: form.address,
                        address_number: form.addressNumber,
                        address_complement: form.addressComplement,
                        province: form.province,
                        city: form.city,
                        state: form.state,
                        postal_code: form.postalCode,
                        installments: plan.installments,
                        installmentValue: priceInstallment,
                        totalValue: priceTotal,
                      }}
                    />

                    <div className="mt-3 space-y-2 text-sm">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={acceptedTerms}
                          onCheckedChange={(v) => setAcceptedTerms(v === true)}
                        />
                        <span>
                          Li e aceito o <strong>Termo de Adesão e Contrato de Prestação de Serviços de Mentoria</strong>, incluindo
                          multa de 2%, juros de 1% ao mês em caso de atraso e cobrança recorrente mensal.
                        </span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={acceptedExec}
                          onCheckedChange={(v) => setAcceptedExec(v === true)}
                        />
                        <span>
                          Entendo que os resultados dependem da minha <strong>execução prática</strong> das ações combinadas em
                          cada encontro.
                        </span>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <Checkbox
                          className="mt-0.5"
                          checked={acceptedWhatsapp}
                          onCheckedChange={(v) => setAcceptedWhatsapp(v === true)}
                        />
                        <span>
                          Autorizo receber lembretes, materiais e comunicações da mentoria pelo WhatsApp informado.
                        </span>
                      </label>
                    </div>

                    {acceptedTerms && (
                      <button
                        type="button"
                        onClick={() =>
                          downloadTermoPdf({
                            name: form.name,
                            cpf: form.cpf,
                            email: form.email,
                            address: form.address,
                            address_number: form.addressNumber,
                            address_complement: form.addressComplement,
                            province: form.province,
                            city: form.city,
                            state: form.state,
                            postal_code: form.postalCode,
                            installments: plan.installments,
                            installmentValue: priceInstallment,
                            totalValue: priceTotal,
                            acceptedAt: new Date().toISOString(),
                          })
                        }
                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <Download size={13} /> Baixar PDF do termo aceito
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                      <ArrowLeft size={16} className="mr-2" /> Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !acceptedTerms || !acceptedExec}
                      className="h-12 px-8 font-semibold"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <>
                          Ir para o pagamento <ArrowRight size={16} className="ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Você será direcionado à página segura do Asaas para concluir o pagamento. O acesso é liberado
                    automaticamente após a confirmação da primeira parcela.
                  </p>
                </form>
              </section>
            )}

            {/* Sobre Gabriel + Objeção — sempre visíveis */}
            <section className="rounded-xl border border-border p-6 mt-4">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">Sobre Gabriel Vieira</div>
              <p className="text-sm text-muted-foreground mt-2">
                Consultor comercial com mais de uma década de operação em vendas B2B e projetos de reestruturação
                comercial. Trabalha lado a lado com o mentorado — não entrega curso pronto, entrega processo e execução.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-muted/30 p-6">
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">"Estou em dúvida se vale a pena"</div>
              <p className="text-sm text-muted-foreground mt-2">
                Se você já domina prospecção, condução de reunião, negociação, follow-up e ainda tem previsibilidade no
                pipeline — provavelmente não precisa. Se algum desses pontos hoje depende de sorte ou improviso, a
                mentoria paga a si mesma em pouquíssimas vendas adicionais.
              </p>
            </section>

            {/* FAQ */}
            <section className="mt-2">
              <h2 className="text-lg font-serif mb-3">Perguntas frequentes</h2>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {FAQ.map((f, i) => (
                  <div key={i}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between text-left px-4 py-3 hover:bg-muted/40 transition"
                    >
                      <span className="text-sm font-medium">{f.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openFaq === i && <div className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</div>}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Seu pedido</div>
                <div className="mt-1 font-serif text-lg leading-tight">
                  {plan?.name || "Mentoria Comercial Individual"}
                </div>
              </div>

              {plan && (
                <>
                  <ul className="text-sm space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" /> {plan.duration_months} meses de acompanhamento
                    </li>
                    <li className="flex items-center gap-2">
                      <Users size={14} className="text-primary" /> {plan.total_meetings} encontros 1:1
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" /> 7 dias de garantia
                    </li>
                  </ul>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parcela mensal</span>
                      <span className="font-mono">{brl(priceInstallment)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Parcelas</span>
                      <span className="font-mono">{plan.installments}x</span>
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="font-mono font-bold">{brl(priceTotal)}</span>
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground flex items-start gap-2 pt-2 border-t border-border">
                <Lock size={13} className="mt-0.5 shrink-0" />
                Cobrança processada com segurança pelo Asaas. Cartão de crédito ou boleto.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
