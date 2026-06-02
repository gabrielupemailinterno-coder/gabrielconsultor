import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/useAnalytics";
import { useLocale } from "@/contexts/LocaleContext";

interface QuickContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const copy = {
  pt: {
    title: "Antes de te chamar no WhatsApp",
    subtitle:
      "Pra garantir que você vai ser respondido, me deixa seu nome e telefone. Aí já te chamo por lá.",
    name: "Seu nome",
    phone: "WhatsApp com DDD",
    submit: "Abrir WhatsApp",
    submitting: "Enviando…",
    successTitle: "Tudo certo. Abrindo o WhatsApp…",
    successBody: "Já recebi seus contatos. Te chamo por lá em instantes.",
    closeAria: "Fechar",
    errName: "Informe seu nome",
    errPhone: "Informe um telefone válido",
    submitError: "Não consegui enviar agora. Tenta de novo em instantes.",
  },
  en: {
    title: "Before I reach you on WhatsApp",
    subtitle:
      "To make sure you get a reply, leave your name and phone. I'll message you there.",
    name: "Your name",
    phone: "Phone with country code",
    submit: "Open WhatsApp",
    submitting: "Sending…",
    successTitle: "All set. Opening WhatsApp…",
    successBody: "Got your contacts. Talk to you on WhatsApp shortly.",
    closeAria: "Close",
    errName: "Enter your name",
    errPhone: "Enter a valid phone",
    submitError: "Couldn't send right now. Please try again.",
  },
};

const QuickContactDialog = ({ open, onClose, onSuccess }: QuickContactDialogProps) => {
  const { locale } = useLocale();
  const t = copy[locale];

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().trim().min(1, t.errName).max(100),
        phone: z.string().trim().min(6, t.errPhone).max(30),
      }),
    [t]
  );

  const [form, setForm] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const change = (k: "name" | "phone", v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const fe: { name?: string; phone?: string } = {};
      r.error.issues.forEach((i) => {
        fe[i.path[0] as "name" | "phone"] = i.message;
      });
      setErrors(fe);
      return;
    }
    setStatus("loading");
    try {
      const { error } = await supabase.from("leads").insert({
        name: r.data.name,
        phone: r.data.phone,
        email: "",
        source: window.location.pathname,
        form_type: "whatsapp",
      });
      if (error) throw error;
      trackClick("form_submit", "quick_contact_submitted");
      setStatus("success");
      if (onSuccess) setTimeout(() => onSuccess(), 500);
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setForm({ name: "", phone: "" });
      }, 2200);
    } catch {
      setStatus("idle");
      alert(t.submitError);
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
            className="relative bg-card border border-border rounded-lg w-full max-w-md p-6 md:p-8"
          >
            <button
              onClick={onClose}
              aria-label={t.closeAria}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="text-primary mb-4" size={44} strokeWidth={1.5} />
                <h3 className="font-serif text-xl mb-2">{t.successTitle}</h3>
                <p className="text-muted-foreground text-sm">{t.successBody}</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl md:text-2xl mb-2">{t.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{t.subtitle}</p>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="qc-name" className="sr-only">{t.name}</label>
                    <input
                      id="qc-name"
                      type="text"
                      placeholder={t.name}
                      value={form.name}
                      onChange={(e) => change("name", e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                    {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="qc-phone" className="sr-only">{t.phone}</label>
                    <input
                      id="qc-phone"
                      type="tel"
                      placeholder={t.phone}
                      value={form.phone}
                      onChange={(e) => change("phone", e.target.value)}
                      className={inputClass}
                    />
                    {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-primary text-primary-foreground font-sans font-semibold text-sm tracking-wide uppercase px-6 py-4 rounded-md hover:brightness-110 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        {t.submitting}
                      </>
                    ) : (
                      t.submit
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

export default QuickContactDialog;
