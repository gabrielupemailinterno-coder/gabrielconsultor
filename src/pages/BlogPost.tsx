import { Navigate, useParams } from "react-router-dom";
export default function BlogPost() {
  const { slug } = useParams();
  return <Navigate to={`/escola/conteudos/${slug ?? ""}`} replace />;
}
