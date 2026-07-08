import { Navigate } from "react-router-dom";

export default function PortalLogin() {
  return <Navigate to="/app/login??next=/app/mentorados" replace />;
}
