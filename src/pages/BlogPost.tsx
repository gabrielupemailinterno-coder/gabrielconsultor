import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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

const BlogPost = () => {
  const { slug } = useParams();
  useAnalytics(`/blog/${slug}`);
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
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-2xl mb-3">Conteúdo não encontrado</h1>
        <Link to="/blog" className="text-primary text-sm">← Voltar para o blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{post.title} | Gabriel Vieira</title>
        {post.excerpt && <meta name="description" content={post.excerpt} />}
        <link rel="canonical" href={`https://gabrielconsultor.com/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        {post.excerpt && <meta property="og:description" content={post.excerpt} />}
        <meta property="og:url" content={`https://gabrielconsultor.com/blog/${post.slug}`} />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.cover_image_url || undefined,
          datePublished: post.published_at || undefined,
          author: { "@type": "Person", name: "Gabriel Lincoln Vieira Passos", url: "https://gabrielconsultor.com/" },
          publisher: { "@type": "Organization", name: "Gabriel Vieira Consultoria" },
          mainEntityOfPage: `https://gabrielconsultor.com/blog/${post.slug}`,
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: "https://gabrielconsultor.com/" },
            { "@type": "ListItem", position: 2, name: "Blog", item: "https://gabrielconsultor.com/blog" },
            { "@type": "ListItem", position: 3, name: post.title, item: `https://gabrielconsultor.com/blog/${post.slug}` },
          ],
        })}</script>
      </Helmet>


      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition">← Blog</Link>

        <header className="mt-8 mb-8">
          {post.published_at && (
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              {new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-5xl leading-tight">{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mt-4">{post.excerpt}</p>}
        </header>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full rounded-lg mb-10 aspect-video object-cover" />
        )}

        <div className="prose prose-invert max-w-none text-foreground/90 leading-relaxed space-y-4">
          {post.content.split(/\n\n+/).map((para, i) => {
            const parts = para.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i} className="whitespace-pre-wrap">
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <a
            href={`https://api.whatsapp.com/send?phone=5532998316501&text=${encodeURIComponent(
              `Olá, Gabriel! Estou respondendo ao desafio do post "${post.title}":\n\n`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-medium cta-glow"
          >
            Responder o desafio no WhatsApp →
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            Envie sua resposta e ganhe 1h de mentoria gratuita.
          </p>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;