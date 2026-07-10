import { useEffect } from "react";

export default function LigacaoRedirect() {
  useEffect(() => {
    window.location.replace("/ligacao/index.html" + window.location.search + window.location.hash);
  }, []);
  return null;
}
