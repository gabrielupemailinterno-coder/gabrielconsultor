import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, CheckCircle2, Download, Copy } from "lucide-react";


export default function ScoreCheckoutPix() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invoiceId = params.get("invoice");
  const [profile, setProfile] = useState<any>(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId) { navigate("/scoreapp/planos", { replace: true }); return; }
    const check = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { navigate("/scoreapp/login", { replace: true }); return; }
      const { data } = await supabase
        .from("score_profiles")
        .select("*")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      setProfile(data);
      if (data?.payment_status === "paid" || data?.plan_status === "active") {
        setPaid(true);
        setTimeout(() => navigate("/scoreapp/app", { replace: true }), 2000);
      }
      setLoading(false);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [invoiceId, navigate]);

  const copy = () => {
    if (profile?.cora_emv) {
      navigator.clipboard.writeText(profile.cora_emv);
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

        {paid ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <CheckCircle2 className="mx-auto text-primary mb-4" size={48} />
            <h1 className="font-serif text-2xl mb-2">Pagamento confirmado</h1>
            <p className="text-muted-foreground text-sm">Redirecionando para o app...</p>
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


            <p className="text-center text-xs text-muted-foreground">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
