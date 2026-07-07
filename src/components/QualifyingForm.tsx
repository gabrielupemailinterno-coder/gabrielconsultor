import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/hooks/useAnalytics";
import { FORM_SCHEMAS, type FormType } from "@/lib/qualifying-forms";
import { sendBotConversaLead } from "@/lib/botconversa";

interface QualifyingFormProps {
  open: boolean;
  onClose: () => void;
  formType: Exclude<FormType, "contato">;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  email: z.string().trim().email("E-mail inválido").max(255),
  companyName: z.string().trim().max(120).optional(),
});

const QualifyingForm = ({ open, onClose, formType }: QualifyingFormProps) => {
  const schema = FORM_SCHEMAS[formType];
  const totalSteps = schema.questions.length + 1; // +1 contato
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "", companyName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const resetAll = () => {
    setStep(0);
    setAnswers({});
    setContact({ name: "", phone: "", email: "", companyName: "" });
    setErrors({});
    setStatus("idle");
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const progress = useMemo(() => ((step + 1) / totalSteps) * 100, [step, totalSteps]);
  const isContactStep = step === schema.questions.length;
  const currentQuestion = !isContactStep ? schema.questions[step] : null;

  const canAdvance = useMemo(() => {
    if (isContactStep) return true;
    const v = answers[currentQuestion!.id];
    if (currentQuestion!.type === "multi") return Array.isArray(v) && v.length > 0;
    return typeof v === "string" && v.length > 0;
  }, [answers, currentQuestion, isContactStep]);

  const selectSingle = (qid: string, value: string) => {
    setAnswers((p) => ({ ...p, [qid]: value }));
    // auto-advance
    setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), 180);
  };

  const toggleMulti = (qid: string, value: string) => {
    setAnswers((p) => {
      const cur = (p[qid] as string[]) || [];
      return {
        ...p,
        [qid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
    });
  };

  const submit = async () => {
    const result = contactSchema.safeParse(contact);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.issues.forEach((i) => (fe[String(i.path[0])] = i.message));
      setErrors(fe);
      return;
    }
    setStatus("loading");
    try {
      // Build human-readable pain summary from selected answers
      const summary = schema.questions
        .map((q) => {
          const v = answers[q.id];
          const text = Array.isArray(v) ? v.join(", ") : v;
          return text ? `${q.label}: ${text}` : null;
        })
        .filter(Boolean)
        .join(" | ");

      const { error } = await supabase.from("leads").insert({
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email,
        company_name: result.data.companyName || null,
        main_pain: summary || null,
        source: window.location.pathname,
        form_type: formType,
        answers,
      });
      if (error) throw error;
      void sendBotConversaLead(result.data.name, result.data.phone);
      trackClick("form_submit", `form_${formType}`);
      setStatus("success");
      setTimeout(() => {
        handleClose();
      }, 2400);
    } catch (e) {
      setStatus("idle");
      alert("Não consegui enviar. Tente novamente em instantes.");
    }
  };

  const inputClass =
    "w-full bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-secondary transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-background/85 backdrop-blur-xl" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-card/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            <button
              onClick={handleClose}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-10 w-9 h-9 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>

            {/* Progress */}
            {status !== "success" && (
              <div className="px-6 md:px-8 pt-6">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  <span>{schema.title}</span>
                  <span className="font-mono">{step + 1} / {totalSteps}</span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )}

            <div className="p-6 md:p-8 pt-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <CheckCircle className="text-primary mb-4" size={48} strokeWidth={1.4} />
                  <h3 className="font-serif text-xl mb-2">Recebido.</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Entro em contato pelo canal mais rápido em até 1 dia útil.
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {isContactStep ? (
                      <div>
                        <h3 className="font-serif text-2xl mb-1">Como te chamo?</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                          Deixe seus contatos pra eu responder.
                        </p>
                        <div className="space-y-3">
                          <div>
                            <input
                              placeholder="Nome completo"
                              value={contact.name}
                              onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                              className={inputClass}
                            />
                            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                          </div>
                          <div>
                            <input
                              type="tel"
                              placeholder="WhatsApp / Telefone"
                              value={contact.phone}
                              onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                              className={inputClass}
                            />
                            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                          </div>
                          <div>
                            <input
                              type="email"
                              placeholder="E-mail"
                              value={contact.email}
                              onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                              className={inputClass}
                            />
                            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                          </div>
                          {schema.askCompany && (
                            <input
                              placeholder="Empresa"
                              value={contact.companyName}
                              onChange={(e) => setContact((p) => ({ ...p, companyName: e.target.value }))}
                              className={inputClass}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-serif text-2xl mb-2 leading-snug">
                          {currentQuestion!.label}
                        </h3>
                        {currentQuestion!.type === "multi" && (
                          <p className="text-muted-foreground text-xs mb-5">Pode marcar mais de uma.</p>
                        )}
                        <div className="grid gap-2 mt-5">
                          {currentQuestion!.options.map((opt) => {
                            const isMulti = currentQuestion!.type === "multi";
                            const selected = isMulti
                              ? ((answers[currentQuestion!.id] as string[]) || []).includes(opt)
                              : answers[currentQuestion!.id] === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  isMulti
                                    ? toggleMulti(currentQuestion!.id, opt)
                                    : selectSingle(currentQuestion!.id, opt)
                                }
                                className={`text-left px-4 py-3.5 rounded-xl border text-sm transition-all duration-200 ${
                                  selected
                                    ? "border-primary bg-primary/10 text-foreground"
                                    : "border-white/[0.08] bg-white/[0.02] text-foreground/85 hover:bg-white/[0.05] hover:border-white/[0.14]"
                                }`}
                              >
                                <span className="inline-flex items-center gap-2.5">
                                  <span
                                    className={`w-4 h-4 rounded-full border ${
                                      selected ? "border-primary bg-primary" : "border-white/20"
                                    } flex-shrink-0`}
                                  />
                                  {opt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Footer nav */}
              {status !== "success" && (
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/[0.06]">
                  <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  >
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  {isContactStep ? (
                    <button
                      onClick={submit}
                      disabled={status === "loading"}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)] disabled:opacity-60"
                    >
                      {status === "loading" ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Enviando…
                        </>
                      ) : (
                        <>Enviar</>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
                      disabled={!canAdvance}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]"
                    >
                      Avançar <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QualifyingForm;
