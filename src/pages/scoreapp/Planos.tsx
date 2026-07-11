import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getPartnerRef } from "@/lib/partnerRef";
import {
  Trophy, Check, Loader2, Lock, ShieldCheck, ArrowRight, Gift, Timer,
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

const BONUS_DURATION_MS = 10 * 60 * 1000;
const BONUS_KEY = "score_bonus_deadline";

export default function ScoreCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<PlanKey>("semestral");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [needsData, setNeedsData] = useState(false);
  const [terms, setTerms] = useState(false);
  const [terms, setTerms] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [deadline] = useState<number>(() => {
    if (typeof window === "undefined") return Date.now() + BONUS_DURATION_MS;
    const stored = Number(localStorage.getItem(BONUS_KEY));
    if (stored && stored > Date.now()) return stored;
    const fresh = Date.now() + BONUS_DURATION_MS;
    localStorage.setItem(BONUS_KEY, String(fresh));
    return fresh;
  });
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingMs = Math.max(0, deadline - now);
  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");
  const bonusActive = remainingMs > 0;

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
      setProfile(data ?? null);
      const init: Record<string, string> = {};
      ADDRESS_FIELDS.forEach(([k]) => (init[k] = (data as any)?.[k] ?? ""));
      setForm(init);
      const missing = ADDRESS_FIELDS.filter(([, , req]) => req).some(
        ([k]) => !(data as any)?.[k],
      );
      setNeedsData(missing);
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
    payload.user_id = session.user.id;
    payload.email = session.user.email ?? profile?.email ?? "";
    const { error } = await supabase
      .from("score_profiles")
      .upsert(payload, { onConflict: "user_id" });
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Checkout · Score Comercial</title>
        <meta name="description" content="Assine o Score Comercial via PIX e libere o acesso automaticamente após a confirmação do pagamento." />
        <meta name="robots" content="noindex" />
      </Helmet>

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

      {/* Banner bônus com contagem regressiva */}
      {bonusActive && (
        <div className="bg-primary/10 border-b border-primary/30">
          <div className="max-w-6xl mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Gift size={16} className="text-primary shrink-0" />
              <span>
                <strong>Fechando o plano semestral nos próximos 10 min</strong> você ganha{" "}
                <strong>1h de consultoria de funil</strong> com Gabriel.
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-lg text-primary">
              <Timer size={16} /> {mm}:{ss}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-[1fr_360px] gap-10">
        {/* COLUNA PRINCIPAL */}
        <div className="space-y-8">


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
