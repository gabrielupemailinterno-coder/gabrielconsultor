import { Navigate } from "react-router-dom";

export default function ScoreLogin() {
  return <Navigate to="/app/login?next=/app/score" replace />;
}
