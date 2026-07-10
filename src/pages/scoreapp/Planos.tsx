import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPartnerRef } from "@/lib/partnerRef";
import {
  Trophy, Check, Loader2, Lock, ShieldCheck, ArrowRight,
  Target, BarChart3, Clock, Zap, ChevronDown,
} from "lucide-react";

// -------- Planos (mesmos preços da edge fn cora-pix-checkout) --------
type PlanKey = "mensal" | "semestral";

const PLANS: Record<PlanKey, {
  key: PlanKey; nome: string; preco: string; periodo: string;
  amountCents: number; equivalente?: string; badge?: string;
  cta: string; beneficios: string[];
}> = {
  mensal: {
    key: "mensal",
    nome: "Mensal",
    preco: "R$ 9,70",
    periodo: "por mês",
    amountCents: 970,
    cta: "Assinar Score Comercial por R$ 9,70/mês",
    beneficios: [
      "Acesso completo ao Score Comercial",
      "Metas comerciais diárias",
      "Acompanhamento de prospecções, ligações e apresentações",
      "Follow-ups e conversões registradas",
      "Identificação de gargalos e recomendações práticas",
      "Conteúdos comerciais e lembretes de rotina",
    ],
  },
  semestral: {
    key: "semestral",
    nome: "Semestral",
    preco: "R$ 49,70",
    periodo: "por 6 meses",
    equivalente: "Equivale a aproximadamente R$ 8,28/mês",
    badge: "Melhor custo-benefício",
    amountCents: 4970,
    cta: "Garantir 6 meses por R$ 49,70",
    beneficios: [
      "Tudo do plano mensal",
      "6 meses de acesso completo",
      "Economia em relação ao mensal",
      "1 reunião individual de 60 min com Gabriel Vieira",
      "Acesso à comunidade",
      "Diagnóstico individual da rotina e dos indicadores",
    ],
  },
};

const ADDRESS_FIELDS: Array<[string, string, boolean]> = [
  ["cpf", "CPF", true],
  ["postal_code", "CEP", true],
  ["address", "Endereço", true],
  ["address_number", "Número", true],
  ["address_complement", "Complemento", false],
  ["province", "Bairro", true],
  ["city", "Cidade", true],
  ["state", "UF", true],
];

const FAQS = [
  {
    q: "O Score Comercial serve para qualquer tipo de vendedor?",
    a: "Sim. Foi desenhado para vendedores consultivos, corretores, representantes, SDRs, BDRs e autônomos — qualquer profissional que trabalhe com meta e precise controlar sua rotina.",
  },
  {
    q: "Preciso saber usar CRM?",
    a: "Não. O Score Comercial funciona por conta própria. Se você já usa um CRM, ele complementa; se não usa, você registra as atividades direto no Score em poucos minutos por dia.",
  },
  {
    q: "Posso usar pelo celular?",
    a: "Sim. Funciona no navegador do celular e do computador, sem instalar aplicativo.",
  },
  {
    q: "O plano é renovado automaticamente?",
    a: "O plano mensal é uma cobrança PIX recorrente que gera nova fatura a cada 30 dias. O plano semestral é uma cobrança única de R$ 49,70 e não renova automaticamente — você é avisado antes do fim para decidir se continua.",
  },
  {
    q: "Quando recebo o acesso?",
    a: "Assim que o PIX é confirmado pelo banco (normalmente segundos), o acesso é liberado automaticamente e você é redirecionado para o Score Comercial.",
  },
  {
    q: "Como funciona a reunião do plano semestral?",
    a: "Após a confirmação do pagamento você recebe as orientações por e-mail e WhatsApp para agendar sua reunião individual de 60 minutos com Gabriel Vieira.",
  },
];

export default function ScoreCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<PlanKey>("semestral");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [needsData, setNeedsData] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [terms, setTerms] = useState(false);

  const plan = PLANS[selected];

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setSession(sess.session);
      if (!sess.session) return;
      const { data } = await supabase
        .from("score_profiles")
        .select("*")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        const init: Record<string, string> = {};
        ADDRESS_FIELDS.forEach(([k]) => (init[k] = (data as any)[k] ?? ""));
        setForm(init);
        const missing = ADDRESS_FIELDS.filter(([, , req]) => req).some(
          ([k]) => !(data as any)[k],
        );
        setNeedsData(missing);
      }
    })();
  }, []);

  const missingFieldLabels = useMemo(
    () =>
      ADDRESS_FIELDS.filter(([k, , req]) => req && !form[k]?.trim()).map(
        ([, label]) => label,
      ),
    [form],
  );

  const saveProfile = async () => {
    if (!session) return false;
    const payload: any = {};
    ADDRESS_FIELDS.forEach(([k]) => (payload[k] = form[k]?.trim() || null));
    const { error } = await supabase
      .from("score_profiles")
      .update(payload)
      .eq("user_id", session.user.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return false;
    }
    setNeedsData(false);
    return true;
  };

  const startCheckout = async () => {
    if (!session) {
      toast({ title: "Faça login", description: "Entre na sua conta para assinar." });
      navigate("/app/login?redirect=/app/planos");
      return;
    }
    if (!terms) {
      toast({
        title: "Aceite os termos",
        description: "Você precisa aceitar os Termos de Uso e Política de Privacidade.",
        variant: "destructive",
      });
      return;
    }
    if (needsData) {
      if (missingFieldLabels.length) {
        toast({
          title: "Complete seus dados",
          description: "Preencha os campos obrigatórios para gerar sua cobrança.",
          variant: "destructive",
        });
        return;
      }
      const ok = await saveProfile();
      if (!ok) return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cora-pix-checkout", {
        body: { plan_key: selected, terms_accepted: true, partner_code: getPartnerRef() },
      });
      if (error || (data as any)?.error) {
        toast({
          title: "Erro no checkout",
          description: (data as any)?.error || error?.message || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/app/checkout-pix?invoice=${(data as any).invoiceId}`);
    } catch (err: any) {
      toast({ title: "Erro no checkout", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const Stepper = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs">
      {[
        { n: 1, t: "Plano" },
        { n: 2, t: "Seus dados" },
        { n: 3, t: "Pagamento" },
      ].map((s, i, arr) => (
        <div key={s.n} className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-mono flex items-center justify-center text-[11px]">
              {s.n}
            </span>
            <span className="text-muted-foreground uppercase tracking-widest">{s.t}</span>
          </div>
          {i < arr.length - 1 && <span className="w-4 sm:w-8 h-px bg-border" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Checkout · Score Comercial</title>
        <meta name="description" content="Assine o Score Comercial e comece a acompanhar sua rotina, indicadores e gargalos de vendas hoje." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Cabeçalho simplificado */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/conhecascoreapp" className="flex items-center gap-2">
            <Trophy className="text-primary" size={20} />
            <span className="font-serif text-lg">Score Comercial</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} className="text-primary" />
            <span className="uppercase tracking-widest">Checkout seguro</span>
          </div>
        </div>
      </header>

      {/* Bloco principal */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-8 text-center">
        <h1 className="font-serif text-3xl md:text-5xl leading-tight">
          Você está a um passo de assumir o controle
          <br className="hidden sm:block" /> dos seus resultados comerciais.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Escolha seu plano, conclua sua assinatura e comece a acompanhar o que realmente constrói sua meta.
        </p>
        <div className="mt-8">
          <Stepper />
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20 grid lg:grid-cols-[1fr_360px] gap-10">
        {/* COLUNA PRINCIPAL */}
        <div className="space-y-10">
          {/* Resumo do produto */}
          <section className="bg-card border border-border rounded-lg p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
              <Trophy size={14} /> O que você começa a controlar
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { i: Target, t: "Metas diárias" },
                { i: BarChart3, t: "Volume de prospecções" },
                { i: Clock, t: "Ligações e contatos" },
                { i: Zap, t: "Apresentações e follow-ups" },
                { i: BarChart3, t: "Taxas de conversão" },
                { i: Target, t: "Gargalos por etapa" },
              ].map((x) => (
                <div key={x.t} className="flex items-center gap-2 text-muted-foreground">
                  <x.i size={14} className="text-primary shrink-0" />
                  {x.t}
                </div>
              ))}
            </div>
          </section>

          {/* Seleção do plano */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-serif text-2xl">1. Escolha seu plano</h2>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Pagamento via PIX</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(Object.values(PLANS) as (typeof PLANS)[PlanKey][]).map((p) => {
                const active = selected === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSelected(p.key)}
                    className={`text-left bg-card border rounded-lg p-6 transition ${
                      active
                        ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif text-xl">{p.nome}</span>
                      {p.badge && (
                        <span className="text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1 rounded">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-3xl text-primary">
                      {p.preco}
                      <span className="text-xs text-muted-foreground ml-2">{p.periodo}</span>
                    </div>
                    {p.equivalente && (
                      <div className="text-xs text-muted-foreground mt-1">{p.equivalente}</div>
                    )}
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {p.beneficios.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <Check size={14} className="text-primary mt-0.5 shrink-0" /> {b}
                        </li>
                      ))}
                    </ul>
                    <div
                      className={`mt-5 text-xs uppercase tracking-widest ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {active ? "Plano selecionado" : "Selecionar este plano"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Dados do comprador */}
          <section>
            <h2 className="font-serif text-2xl mb-4">2. Seus dados</h2>
            {!session ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Para assinar você precisa de uma conta. Leva menos de um minuto.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/app/cadastro?redirect=/app/planos"
                    className="bg-primary text-primary-foreground px-5 py-3 rounded-md text-sm uppercase tracking-wide inline-flex items-center gap-2"
                  >
                    Criar conta <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/app/login?redirect=/app/planos"
                    className="border border-border px-5 py-3 rounded-md text-sm uppercase tracking-wide inline-flex items-center gap-2 hover:bg-muted transition"
                  >
                    Já tenho conta
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Conta</div>
                  <div className="font-mono">{session.user.email}</div>
                  {profile?.full_name && (
                    <div className="text-muted-foreground text-xs mt-1">{profile.full_name}</div>
                  )}
                </div>

                {needsData && (
                  <div className="border-t border-border pt-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                      Dados de cobrança (obrigatórios para gerar o PIX)
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {ADDRESS_FIELDS.map(([k, label, req]) => (
                        <input
                          key={k}
                          value={form[k] ?? ""}
                          onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                          onBlur={async (e) => {
                            if (k !== "postal_code") return;
                            const cep = e.target.value.replace(/\D/g, "");
                            if (cep.length !== 8) return;
                            try {
                              const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                              const d = await r.json();
                              if (d.erro) return;
                              setForm((f) => ({
                                ...f,
                                address: d.logradouro || f.address || "",
                                province: d.bairro || f.province || "",
                                city: d.localidade || f.city || "",
                                state: d.uf || f.state || "",
                              }));
                            } catch {}
                          }}
                          placeholder={req ? `${label} *` : label}
                          maxLength={k === "state" ? 2 : undefined}
                          className="bg-input border border-border rounded-md px-4 py-3 text-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Pagamento */}
          <section>
            <h2 className="font-serif text-2xl mb-4">3. Pagamento</h2>
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 rounded-md bg-primary/15 text-primary flex items-center justify-center font-mono text-xs">
                  PIX
                </div>
                <div>
                  <div className="font-serif">Pagamento via PIX</div>
                  <div className="text-xs text-muted-foreground">
                    Confirmação automática assim que o banco processar a transferência.
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-1 accent-primary"
                />
                <span>
                  Li e concordo com os{" "}
                  <a href="/termos" className="text-primary underline underline-offset-4">Termos de Uso</a>{" "}
                  e com a{" "}
                  <a href="/privacidade" className="text-primary underline underline-offset-4">Política de Privacidade</a>.
                </span>
              </label>

              <button
                onClick={startCheckout}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Processando pagamento…
                  </>
                ) : (
                  <>
                    {plan.cta} <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={12} className="text-primary" />
                Seus dados são protegidos e o pagamento é processado em ambiente seguro.
              </div>
            </div>
          </section>

          {/* Quebra de objeção */}
          <section className="bg-card border border-border rounded-lg p-8">
            <h2 className="font-serif text-2xl mb-3">Você não precisa vender no escuro.</h2>
            <p className="text-muted-foreground text-sm mb-4">
              O Score Comercial não promete resultado sem execução. Ele mostra o que você está fazendo, onde está
              deixando oportunidades pelo caminho e quais ações precisam entrar na sua rotina.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Leva poucos minutos por dia.",
                "Funciona pelo celular ou computador.",
                "Direcionamentos baseados nos seus próprios números.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check size={14} className="text-primary mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </section>

          {/* Sobre Gabriel */}
          <section className="bg-card border border-border rounded-lg p-8">
            <div className="text-xs uppercase tracking-widest text-primary mb-2">Sobre o criador</div>
            <h2 className="font-serif text-2xl mb-3">Gabriel Vieira</h2>
            <p className="text-muted-foreground text-sm">
              Consultor e mentor comercial com atuação em processos de vendas, CRM, indicadores, gestão de funil e
              desenvolvimento de vendedores.
            </p>
            <p className="text-muted-foreground text-sm mt-3">
              O Score Comercial foi criado a partir dos indicadores e comportamentos acompanhados diariamente em
              operações comerciais reais.
            </p>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="font-serif text-2xl mb-4">Perguntas frequentes</h2>
            <div className="space-y-2">
              {FAQS.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className="bg-card border border-border rounded-lg">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                    >
                      <span className="font-serif text-base">{f.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-4 text-sm text-muted-foreground">{f.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* RESUMO LATERAL */}
        <aside className="lg:sticky lg:top-6 h-fit">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="text-xs uppercase tracking-widest text-primary mb-3">Resumo do pedido</div>
            <div className="font-serif text-lg mb-1">Score Comercial</div>
            <div className="text-sm text-muted-foreground mb-4">Plano {plan.nome}</div>
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total hoje</span>
              <span className="font-mono text-2xl text-primary">{plan.preco}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right">{plan.periodo}</div>
            {plan.equivalente && (
              <div className="text-xs text-muted-foreground mt-1 text-right">{plan.equivalente}</div>
            )}
            <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
              {plan.beneficios.slice(0, 4).map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check size={12} className="text-primary mt-0.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <button
              onClick={startCheckout}
              disabled={loading}
              className="w-full mt-6 bg-primary text-primary-foreground uppercase tracking-wide text-xs py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : "Ir para pagamento"}
            </button>
            <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-muted-foreground uppercase tracking-widest">
              <Lock size={10} /> Checkout seguro
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
