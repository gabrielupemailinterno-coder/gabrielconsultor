import { Navigate } from "react-router-dom";

export default function PartnerLogin() {
  return <Navigate to="/entrar?next=/app/parceiro" replace />;
}
