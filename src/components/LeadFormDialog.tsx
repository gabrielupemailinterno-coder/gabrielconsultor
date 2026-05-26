import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/useAnalytics";

const leadSchema = z.object({
  name: z.string().trim().min(1, "Preencha seu nome").max(100),
  phone: z.string().trim().min(1, "Preencha seu telefone").max(30),
  email: z.string().trim().email("Email inválido").max(255),
  companyName: z.string().trim().max(100).optional(),
  revenue: z.string().trim().max(100).optional(),
  mainPain: z.string().trim().max(1000).optional(),
});

type LeadData = z.infer<typeof leadSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onClose: () => void;
}

const LeadFormDialog = ({ open, onClose }: LeadFormDialogProps) => {
  const [form, setForm] = useState<LeadData>({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    revenue: "",
    mainPain: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadData, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleChange = (field: keyof LeadData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadData, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof LeadData;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus("loading");
    try {
      const { error } = await supabase.from("leads").insert({
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email,
        company_name: result.data.companyName || null,
        revenue: result.data.revenue || null,
        main_pain: result.data.mainPain || null,
        source: window.location.pathname,
      });
      if (error) throw error;
      trackClick("form_submit", "lead_form_submitted");
      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setForm({ name: "", phone: "", email: "", companyName: "", revenue: "", mainPain: "" });
      }, 2500);
    } catch (err) {
      setStatus("idle");
      alert("Erro ao enviar. Tente novamente.");
    }
  };

  const inputClass =
    "w-full bg-secondary border border-border rounded-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="relative bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Fechar formulário"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="text-primary mb-4" size={48} strokeWidth={1.5} />
                <h3 className="font-serif text-xl mb-2">Dados enviados com sucesso!</h3>
                <p className="text-muted-foreground text-sm">Entraremos em contato em breve.</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl md:text-2xl mb-1">Agende seu Diagnóstico</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Preencha os dados abaixo e entraremos em contato.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="lead-name" className="sr-only">Seu nome</label>
                    <input
                      id="lead-name"
                      type="text"
                      placeholder="Seu nome *"
                      aria-label="Seu nome"
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={inputClass}
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-phone" className="sr-only">Telefone</label>
                    <input
                      id="lead-phone"
                      type="tel"
                      placeholder="Telefone *"
                      aria-label="Telefone"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={inputClass}
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-email" className="sr-only">Email</label>
                    <input
                      id="lead-email"
                      type="email"
                      placeholder="Email *"
                      aria-label="Email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={inputClass}
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-company" className="sr-only">Nome da empresa</label>
                    <input
                      id="lead-company"
                      type="text"
                      placeholder="Nome da Empresa"
                      aria-label="Nome da empresa"
                      value={form.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-revenue" className="sr-only">Faturamento mensal aproximado</label>
                    <input
                      id="lead-revenue"
                      type="text"
                      placeholder="Faturamento mensal aproximado"
                      aria-label="Faturamento mensal aproximado"
                      value={form.revenue}
                      onChange={(e) => handleChange("revenue", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-pain" className="sr-only">Qual sua maior dor atualmente?</label>
                    <textarea
                      id="lead-pain"
                      placeholder="Qual sua maior dor atualmente?"
                      aria-label="Qual sua maior dor atualmente?"
                      value={form.mainPain}
                      onChange={(e) => handleChange("mainPain", e.target.value)}
                      rows={3}
                      className={inputClass + " resize-none"}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-6 py-4 rounded-md hover:brightness-110 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Enviando...
                      </>
                    ) : (
                      "Solicitar Diagnóstico"
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeadFormDialog;
