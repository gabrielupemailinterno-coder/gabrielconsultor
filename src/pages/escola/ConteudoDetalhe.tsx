import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function EscolaConteudoDetalhe() {
  const { slug } = useParams();
  useAnalytics(`/escola/conteudos/${slug}`);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .eq("published", true)
        .maybeSingle();
      setPost(data as Post);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-2xl mb-3">Conteúdo não encontrado</h1>
        <Link to="/escola/conteudos" className="text-primary text-sm">
          ← Voltar para os conteúdos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{post.title} | Escola de Vendedores</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/escola/conteudos" className="flex items-center gap-2 text-sm">
            <GraduationCap className="text-primary" size={18} />
            <span className="font-serif text-lg">Escola de Vendedores</span>
          </Link>
          <Link to="/escola/conteudos" className="text-xs text-muted-foreground hover:text-foreground">
            ← Todos os conteúdos
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          {post.published_at && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              {new Date(post.published_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mt-4">{post.excerpt}</p>}
        </header>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full rounded-lg mb-10 aspect-video object-cover"
          />
        )}

        <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed space-y-4">
          {post.content.split(/\n\n+/).map((para, i) => {
            const parts = para.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className="whitespace-pre-wrap">
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} className="font-semibold text-foreground">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>

        <div className="mt-10 border-t border-border pt-8 space-y-6">
          <a
            href={`https://api.whatsapp.com/send?phone=5532998316501&text=${encodeURIComponent(
              `Olá, Gabriel! Estou respondendo ao desafio do conteúdo "${post.title}":\n\n`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium cta-glow"
          >
            Responder o desafio no WhatsApp →
          </a>
          <p className="text-xs text-muted-foreground">
            Envie sua resposta e ganhe 1h de mentoria gratuita.
          </p>
        </div>
      </article>
    </div>
  );
}
