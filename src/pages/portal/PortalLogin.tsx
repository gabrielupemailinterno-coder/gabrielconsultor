import { Navigate } from "react-router-dom";

export default function PortalLogin() {
  return <Navigate to="/entrar?next=/mentorados" replace />;
}
