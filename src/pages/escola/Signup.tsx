import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap } from "lucide-react";
import { normalizeBR } from "@/lib/phone";
import { sendBotConversaLead } from "@/lib/botconversa";

const schema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  accepted_terms: z.literal(true, { errorMap: () => ({ message: "Aceite os termos para continuar" }) }),
});

export default function EscolaSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    accepted_terms: false as boolean,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Verifique os campos");
      return;
    }
    const phone_normalized = normalizeBR(form.phone);
    if (!phone_normalized) {
      setError("Telefone inválido. Use DDD + número.");
      return;
    }
    setLoading(true);
    const { data, error: authErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/escola/conteudos`,
        data: {
          source: "escola",
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          phone_normalized,
          lead_origin: "escola_landing",
          accepted_terms: true,
        },
      },
    });
    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }
    // Emit event + WhatsApp lead (best-effort, non-blocking)
    void supabase.functions
      .invoke("integrations-dispatch", {
        body: {
          event: "escola.signup",
          data: {
            nome: form.full_name.trim(),
            email: form.email.trim(),
            telefone_normalizado: phone_normalized,
            data_cadastro: new Date().toISOString(),
            user_id: data.user?.id ?? null,
          },
        },
      })
      .catch(() => {});
    void sendBotConversaLead(form.full_name.trim(), form.phone.trim());
    navigate("/escola/conteudos", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Helmet>
        <title>Cadastro | Escola de Vendedores Grátis</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <GraduationCap className="text-primary" />
          <span className="font-serif text-xl">Escola de Vendedores</span>
        </div>
        <form onSubmit={submit} className="bg-card border border-border rounded-lg p-8 space-y-3">
          <h1 className="font-serif text-2xl mb-1">Criar conta grátis</h1>
          <p className="text-xs text-muted-foreground mb-4">
            Acesso imediato a todos os conteúdos.
          </p>
          <input
            required
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Nome completo"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="E-mail"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Telefone / WhatsApp (com DDD)"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Senha (mín. 6)"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.accepted_terms}
              onChange={(e) => set("accepted_terms", e.target.checked)}
              className="mt-1"
            />
            <span>Aceito receber os conteúdos por WhatsApp e a política de privacidade.</span>
          </label>
          <button
            disabled={loading}
            className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Criar conta grátis"}
          </button>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/escola/login" className="text-primary">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
