import { useEffect } from "react";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";

// Parte 2 da campanha /contagem — agora a página redireciona direto para o
// WhatsApp do Score. Os dados antigos (variantes A–E) continuam preservados
// no painel Campanhas; novos acessos/cliques ficam marcados como "P2".
const DESTINATION =
  "https://api.whatsapp.com/send?phone=553298316501&text=Oi,%20quero%20entender%20mais%20sobre%20o%20Score%20comercial";

const TRACKED_PATH = "/contagem?v=P2";

export default function Contagem() {
  useAnalytics(TRACKED_PATH);

  useEffect(() => {
    trackClick(
      "cta_whatsapp_score",
      "[P2] Redirect /contagem → WhatsApp Score",
      TRACKED_PATH,
    );
    window.location.replace(DESTINATION);
  }, []);

  return null;
}
