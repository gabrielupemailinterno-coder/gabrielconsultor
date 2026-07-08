import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy } from "lucide-react";
import { sendBotConversaLead } from "@/lib/botconversa";
import { getPartnerRef } from "@/lib/partnerRef";

export default function ScoreSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    postal_code: "",
    address: "",
    address_number: "",
    address_complement: "",
    province: "",
    city: "",
    state: "",
    profession: "",
    experience_level: "iniciante",
    lead_origin: "instagram",
    segment: "",
    accepted_terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accepted_terms) {
      setError("Aceite os termos para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    const partnerCode = getPartnerRef();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/scoreapp/app`,
        data: {
          source: "scoreapp",
          full_name: form.full_name,
          phone: form.phone,
          cpf: form.cpf,
          postal_code: form.postal_code,
          address: form.address,
          address_number: form.address_number,
          address_complement: form.address_complement,
          province: form.province,
          city: form.city,
          state: form.state,
          profession: form.profession,
          experience_level: form.experience_level,
          lead_origin: form.lead_origin,
          segment: form.segment,
          partner_code: partnerCode,
          accepted_terms: true,
        },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    void sendBotConversaLead(form.full_name, form.phone);
    navigate("/scoreapp/onboarding", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="text-primary" />
          <span className="font-serif text-xl">Score Comercial</span>
        </div>
        <form onSubmit={submit} className="bg-card border border-border rounded-lg p-8 space-y-3">
          <h1 className="font-serif text-2xl mb-2">Criar conta</h1>
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
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="Senha (mín. 6)"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="Telefone / WhatsApp"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            required
            value={form.cpf}
            onChange={(e) => set("cpf", e.target.value)}
            placeholder="CPF"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={form.postal_code}
              onChange={(e) => set("postal_code", e.target.value)}
              placeholder="CEP"
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
            <input
              required
              value={form.address_number}
              onChange={(e) => set("address_number", e.target.value)}
              placeholder="Número"
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
          </div>
          <input
            required
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Endereço"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <input
            value={form.address_complement}
            onChange={(e) => set("address_complement", e.target.value)}
            placeholder="Complemento (opcional)"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={form.province}
              onChange={(e) => set("province", e.target.value)}
              placeholder="Bairro"
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Cidade"
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
          </div>
          <input
            required
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            maxLength={2}
            placeholder="UF"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              value={form.profession}
              onChange={(e) => set("profession", e.target.value)}
              placeholder="Profissão / segmento"
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            />
            <select
              value={form.experience_level}
              onChange={(e) => set("experience_level", e.target.value)}
              className="bg-input border border-border rounded-md px-4 py-3 text-sm"
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          <select
            value={form.lead_origin}
            onChange={(e) => set("lead_origin", e.target.value)}
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-sm"
          >
            <option value="instagram">Vim pelo Instagram</option>
            <option value="anuncio">Vim por anúncio</option>
            <option value="indicacao">Indicação</option>
            <option value="outro">Outro</option>
          </select>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={form.accepted_terms}
              onChange={(e) => set("accepted_terms", e.target.checked)}
              className="mt-1"
            />
            <span>Aceito os termos de uso e a política de privacidade.</span>
          </label>
          <button
            disabled={loading}
            className="w-full bg-primary text-primary-foreground uppercase tracking-wide text-sm py-3 rounded-md flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Criar conta"}
          </button>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/scoreapp/login" className="text-primary">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
