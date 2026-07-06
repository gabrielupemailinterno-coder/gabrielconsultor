import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const planos = [
  { key: "mensal", nome: "Mensal", preco: "R$ 9,70", periodo: "/mês", destaque: false },
  { key: "semestral", nome: "Semestral", preco: "R$ 49,70", periodo: "por 6 meses", destaque: true },
];

const requiredFields: Array<[string, string]> = [
  ["cpf", "CPF"],
  ["postal_code", "CEP"],
  ["address", "Endereço"],
  ["address_number", "Número"],
  ["address_complement", "Complemento (opcional)"],
  ["province", "Bairro"],
  ["city", "Cidade"],
  ["state", "UF"],
];

export default function ScorePlanos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [needsData, setNeedsData] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      const { data } = await supabase.from("score_profiles").select("*").eq("user_id", sess.session.user.id).maybeSingle();
      if (data) {
        setProfile(data);
        const init: Record<string, string> = {};
        requiredFields.forEach(([k]) => (init[k] = (data as any)[k] ?? ""));
        setForm(init);
        const missing = ["cpf","postal_code","address","address_number","province","city","state"].some((k) => !(data as any)[k]);
        setNeedsData(missing);
      }
    })();
  }, []);

  const saveProfile = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return false;
    const payload: any = {};
    requiredFields.forEach(([k]) => (payload[k] = form[k]?.trim() || null));
    const { error } = await supabase.from("score_profiles").update(payload).eq("user_id", sess.session.user.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return false;
    }
    setNeedsData(false);
    return true;
  };

  const subscribe = async (planKey: string) => {
    setLoading(planKey);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        toast({ title: "Faça login", description: "Entre na sua conta para assinar." });
        navigate("/scoreapp/login");
        return;
      }
      if (needsData) {
        const missing = ["cpf","postal_code","address","address_number","province","city","state"].filter((k) => !form[k]?.trim());
        if (missing.length) {
          toast({ title: "Complete seus dados", description: "Preencha os campos obrigatórios para continuar.", variant: "destructive" });
          return;
        }
        const ok = await saveProfile();
        if (!ok) return;
      }
      const { data, error } = await supabase.functions.invoke("cora-pix-checkout", {
        body: { plan_key: planKey, terms_accepted: true },
      });
      if (error || data?.error) {
        toast({
          title: "Erro no checkout",
          description: data?.error || error?.message || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      navigate(`/scoreapp/checkout-pix?invoice=${data.invoiceId}`);
    } catch (err: any) {
      toast({ title: "Erro no checkout", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/scoreapp/app" className="flex items-center gap-2"><Trophy className="text-primary" size={20} /><span className="font-serif text-lg">Score Comercial</span></Link>
          <Link to="/scoreapp/app" className="text-sm text-muted-foreground">Voltar</Link>
        </div>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-serif text-4xl mb-3">Planos</h1>
        <p className="text-muted-foreground mb-10">Ferramenta simples, preço acessível.</p>

        {profile && needsData && (
          <div className="bg-card border border-primary/40 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-serif text-xl mb-1">Complete seus dados de cobrança</h2>
            <p className="text-xs text-muted-foreground mb-4">Necessário para gerar sua cobrança PIX.</p>
            <div className="grid md:grid-cols-2 gap-3">
              {requiredFields.map(([k, label]) => (
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
                        address_complement: d.complemento || f.address_complement || "",
                      }));
                    } catch {}
                  }}
                  placeholder={label}
                  maxLength={k === "state" ? 2 : undefined}
                  className="bg-input border border-border rounded-md px-4 py-3 text-sm"
                />
              ))}
            </div>

          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {planos.map((p) => (
            <div key={p.key} className={`bg-card border rounded-lg p-8 text-left ${p.destaque ? "border-primary" : "border-border"}`}>
              {p.destaque && <span className="text-[10px] uppercase tracking-wider bg-primary text-primary-foreground px-2 py-1 rounded">Mais escolhido</span>}
              <div className="font-serif text-2xl mt-3">{p.nome}</div>
              <div className="font-mono text-4xl text-primary mt-2">{p.preco}<span className="text-sm text-muted-foreground ml-1">{p.periodo}</span></div>
              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                {["Registro diário ilimitado","Score comercial e diagnóstico","Conteúdos de vendas","Badges de progresso"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check size={14} className="text-primary" /> {f}</li>
                ))}
              </ul>
              <button
                disabled={loading !== null}
                onClick={() => subscribe(p.key)}
                className="w-full mt-8 bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center gap-2"
              >
                {loading === p.key ? <Loader2 className="animate-spin" size={16} /> : `Assinar ${p.nome}`}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
