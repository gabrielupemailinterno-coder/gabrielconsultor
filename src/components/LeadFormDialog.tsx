import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/useAnalytics";
import { useLocale } from "@/contexts/LocaleContext";
import { leadFormCopy } from "@/locales/copy";
import { sendBotConversaLead } from "@/lib/botconversa";

type LeadData = {
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  revenue?: string;
  mainPain?: string;
};

interface LeadFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  successTitle?: string;
  successBody?: string;
}

const LeadFormDialog = ({ open, onClose, onSuccess, successTitle, successBody }: LeadFormDialogProps) => {
  const { locale } = useLocale();
  const c = leadFormCopy[locale];

  const leadSchema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, c.errors.name).max(100),
        phone: z.string().trim().min(1, c.errors.phone).max(30),
        email: z.string().trim().email(c.errors.email).max(255),
        companyName: z.string().trim().max(100).optional(),
        revenue: z.string().trim().max(100).optional(),
        mainPain: z.string().trim().max(1000).optional(),
      }),
    [c]
  );

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
        form_type: "contato",
      });
      if (error) throw error;
      void sendBotConversaLead(result.data.name, result.data.phone);
      trackClick("form_submit", "lead_form_submitted");
      setStatus("success");
      if (onSuccess) {
        setTimeout(() => onSuccess(), 600);
      }
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setForm({ name: "", phone: "", email: "", companyName: "", revenue: "", mainPain: "" });
      }, 2500);
    } catch (err) {
      setStatus("idle");
      alert(c.submitError);
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
              aria-label={c.closeAria}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="text-primary mb-4" size={48} strokeWidth={1.5} />
                <h3 className="font-serif text-xl mb-2">{successTitle || c.successTitle}</h3>
                <p className="text-muted-foreground text-sm">{successBody || c.successBody}</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl md:text-2xl mb-1">{c.title}</h3>
                <p className="text-muted-foreground text-sm mb-6">{c.subtitle}</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="lead-name" className="sr-only">{c.placeholders.name}</label>
                    <input
                      id="lead-name"
                      type="text"
                      placeholder={c.placeholders.name}
                      aria-label={c.placeholders.name}
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className={inputClass}
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-phone" className="sr-only">{c.placeholders.phone}</label>
                    <input
                      id="lead-phone"
                      type="tel"
                      placeholder={c.placeholders.phone}
                      aria-label={c.placeholders.phone}
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={inputClass}
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-email" className="sr-only">{c.placeholders.email}</label>
                    <input
                      id="lead-email"
                      type="email"
                      placeholder={c.placeholders.email}
                      aria-label={c.placeholders.email}
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={inputClass}
                    />
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="lead-company" className="sr-only">{c.placeholders.company}</label>
                    <input
                      id="lead-company"
                      type="text"
                      placeholder={c.placeholders.company}
                      aria-label={c.placeholders.company}
                      value={form.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-revenue" className="sr-only">{c.placeholders.revenue}</label>
                    <input
                      id="lead-revenue"
                      type="text"
                      placeholder={c.placeholders.revenue}
                      aria-label={c.placeholders.revenue}
                      value={form.revenue}
                      onChange={(e) => handleChange("revenue", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="lead-pain" className="sr-only">{c.placeholders.pain}</label>
                    <textarea
                      id="lead-pain"
                      placeholder={c.placeholders.pain}
                      aria-label={c.placeholders.pain}
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
                        {c.submitting}
                      </>
                    ) : (
                      c.submit
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
