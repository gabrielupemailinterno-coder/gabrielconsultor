import { useEffect } from "react";
import { useAnalytics, trackClick } from "@/hooks/useAnalytics";

const DESTINATION =
  "https://api.whatsapp.com/send?phone=553298316501&text=Oi,%20quero%20entender%20mais%20sobre%20o%20%20Score%20comercial";

export default function Contagem() {
  useAnalytics("/contagem");

  useEffect(() => {
    trackClick("cta_whatsapp_score", "Redirect /contagem → WhatsApp Score", "/contagem");
    window.location.replace(DESTINATION);
  }, []);

  return null;
}
