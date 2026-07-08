import { Navigate } from "react-router-dom";

export default function PartnerLogin() {
  return <Navigate to="/app/login?next=/app/parceiro" replace />;
}
