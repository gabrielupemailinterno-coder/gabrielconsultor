import { Navigate } from "react-router-dom";

export default function ScoreLogin() {
  return <Navigate to="/entrar?next=/scoreapp/app" replace />;
}
