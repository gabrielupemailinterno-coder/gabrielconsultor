import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, CheckCircle2, Download, Copy, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type Status = "checking" | "waiting" | "paid" | "not_found" | "error";

const STATUS_META: Record<Status, { label: string; hint: string; tone: string }> = {
  checking:  { label: "Verificando pagamento...",     hint: "Consultando o banco emissor.",                     tone: "text-muted-foreground" },
  waiting:   { label: "Aguardando confirmação",       hint: "Assim que o PIX cair, liberamos seu acesso.",      tone: "text-muted-foreground" },
  paid:      { label: "Pagamento confirmado",         hint: "Redirecionando para o app...",                     tone: "text-primary" },
  not_found: { label: "Cobrança não encontrada",      hint: "Volte aos planos e gere uma nova cobrança.",       tone: "text-destructive" },
  error:     { label: "Erro ao verificar pagamento",  hint: "Tentaremos novamente em instantes.",               tone: "text-destructive" },
};

export default function ScoreCheckoutPix() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invoiceId = params.get("invoice");
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!invoiceId) { navigate("/app/planos", { replace: true }); return; }
    let stopped = false;
    const check = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { navigate("/app/login", { replace: true }); return; }
      let fnResult: { paid?: boolean; status?: string; reason?: string; error?: string } | null = null;
      try {
        const { data, error } = await supabase.functions.invoke("cora-check-invoice", { body: {} });
        if (error) fnResult = { error: error.message };
        else fnResult = data ?? null;
      } catch (e: any) {
        fnResult = { error: e?.message ?? "network" };
      }
      const { data } = await supabase
        .from("score_profiles")
        .select("*")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      setProfile(data);
      setLastCheckedAt(new Date());

      const isPaid = data?.payment_status === "paid" || data?.plan_status === "active" || fnResult?.paid === true;
      if (isPaid) {
        if (status !== "paid") toast.success("Pagamento confirmado!");
        setStatus("paid");
        stopped = true;
        setTimeout(() => navigate("/app/score", { replace: true }), 1500);
      } else if (fnResult?.reason === "no_invoice") {
        setStatus("not_found");
      } else if (fnResult?.error) {
        setStatus("error");
      } else {
        setStatus("waiting");
      }
      setLoading(false);
    };
    check();
    const interval = setInterval(() => { if (!stopped) check(); }, 5000);
    return () => { stopped = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, navigate]);

  const copy = () => {
    if (profile?.cora_emv) {
      navigator.clipboard.writeText(profile.cora_emv);
      toast.success("Código PIX copiado");
    }
  };

  const amount = profile?.cora_paid_amount ?? (profile?.plan === "semestral" ? 4970 : 970);
  const formatted = `R$ ${(amount / 100).toFixed(2).replace(".", ",")}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="text-primary" size={20} />
          <span className="font-serif text-lg">Score Comercial</span>
        </div>

        {status === "paid" ? (
          <div className="bg-card border border-primary/50 rounded-lg p-8 text-center">
            <CheckCircle2 className="mx-auto text-primary mb-4" size={48} />
            <h1 className="font-serif text-2xl mb-2">{STATUS_META.paid.label}</h1>
            <p className="text-muted-foreground text-sm">{STATUS_META.paid.hint}</p>
          </div>
        ) : status === "not_found" ? (
          <div className="bg-card border border-destructive/50 rounded-lg p-8 text-center space-y-4">
            <AlertCircle className="mx-auto text-destructive" size={48} />
            <div>
              <h1 className="font-serif text-2xl mb-2">{STATUS_META.not_found.label}</h1>
              <p className="text-muted-foreground text-sm">{STATUS_META.not_found.hint}</p>
            </div>
            <button
              onClick={() => navigate("/app/planos", { replace: true })}
              className="w-full bg-primary text-primary-foreground text-sm py-2 rounded-md"
            >
              Voltar aos planos
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h1 className="font-serif text-2xl text-center">Pagamento via PIX</h1>
            <p className="text-center text-muted-foreground text-sm">
              Escaneie o QR Code ou use o copia e cola para pagar
            </p>
            <div className="text-center font-mono text-3xl text-primary">{formatted}</div>

            {profile?.cora_emv ? (
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(profile.cora_emv)}`}
                  alt="QR Code PIX"
                  className="w-64 h-64 object-contain bg-white p-2 border border-border rounded-lg"
                />
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                QR Code não disponível
              </div>
            )}

            {profile?.cora_emv && (
              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-md text-xs break-all font-mono border border-border">
                  {profile.cora_emv}
                </div>
                <button onClick={copy} className="w-full bg-secondary text-secondary-foreground text-sm py-2 rounded-md flex items-center justify-center gap-2">
                  <Copy size={14} /> Copiar código PIX
                </button>
              </div>
            )}

            {profile?.cora_qr_code_url && (
              <a
                href={profile.cora_qr_code_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-border text-foreground text-sm py-2 rounded-md flex items-center justify-center gap-2 hover:bg-muted transition"
              >
                <Download size={14} /> Baixar boleto (PDF)
              </a>
            )}

            <div className={`flex items-start gap-2 rounded-md border p-3 text-xs ${status === "error" ? "border-destructive/40 bg-destructive/5" : "border-border bg-muted/40"}`}>
              {status === "error" ? (
                <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
              ) : status === "checking" ? (
                <Loader2 size={14} className="text-primary animate-spin mt-0.5 shrink-0" />
              ) : (
                <Clock size={14} className="text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <div className={`font-medium ${STATUS_META[status].tone}`}>{STATUS_META[status].label}</div>
                <div className="text-muted-foreground">{STATUS_META[status].hint}</div>
                {lastCheckedAt && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Última verificação: {lastCheckedAt.toLocaleTimeString("pt-BR")}
                    {profile?.cora_status ? ` · status Cora: ${profile.cora_status}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
