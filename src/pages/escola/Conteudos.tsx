import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, LogOut, GraduationCap } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function EscolaConteudos() {
  useAnalytics("/escola/conteudos");
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: sessionData }, { data }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("blog_posts")
          .select("id,title,slug,excerpt,cover_image_url,published_at")
          .eq("published", true)
          .order("published_at", { ascending: false }),
      ]);
      setSignedIn(Boolean(sessionData.session));
      setPosts((data as Post[]) || []);
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/escola", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Conteúdos | Escola de Vendedores Grátis</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/escola" className="flex items-center gap-2 text-sm">
            <GraduationCap className="text-primary" size={18} />
            <span className="font-serif text-lg">Escola de Vendedores</span>
          </Link>
          {signedIn ? (
            <button
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <LogOut size={14} /> Sair
            </button>
          ) : (
            <Link
              to="/escola/login"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl md:text-4xl mb-8">Conteúdos</h1>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-20">
            Nenhum conteúdo publicado ainda. Volte em breve.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/escola/conteudos/${p.slug}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition"
            >
              {p.cover_image_url && (
                <div className="aspect-video overflow-hidden bg-secondary">
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              )}
              <div className="p-6">
                {p.published_at && (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {new Date(p.published_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                <h2 className="font-serif text-2xl mb-3 group-hover:text-primary transition">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-4">
                  Ler mais <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
