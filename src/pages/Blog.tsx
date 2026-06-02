import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
};

const Blog = () => {
  useAnalytics("/blog");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,cover_image_url,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      setPosts((data as Post[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Blog | Gabriel Vieira — Processos comerciais e execução</title>
        <meta name="description" content="Conteúdos práticos sobre processos comerciais, gestão de funil, CRM e execução. Cases reais e métodos aplicáveis." />
        <link rel="canonical" href="https://gabrielconsultor.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog | Gabriel Vieira" />
        <meta property="og:description" content="Conteúdos práticos sobre processos comerciais, gestão de funil, CRM e execução." />
        <meta property="og:url" content="https://gabrielconsultor.com/blog" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Blog | Gabriel Vieira",
          url: "https://gabrielconsultor.com/blog",
          inLanguage: "pt-BR",
          author: { "@type": "Person", name: "Gabriel Lincoln Vieira Passos", url: "https://gabrielconsultor.com/" },
          publisher: { "@type": "Organization", name: "Gabriel Vieira Consultoria" },
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: `https://gabrielconsultor.com/blog/${p.slug}`,
            datePublished: p.published_at || undefined,
            description: p.excerpt || undefined,
          })),
        })}</script>
      </Helmet>

      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition">← Início</Link>
          <h1 className="font-serif text-3xl md:text-4xl">Blog</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {loading && (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        )}

        {!loading && posts.length === 0 && (
          <p className="text-center text-muted-foreground py-20">Nenhum conteúdo publicado ainda.</p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/blog/${p.slug}`}
              className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition"
            >
              {p.cover_image_url && (
                <div className="aspect-video overflow-hidden bg-secondary">
                  <img src={p.cover_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
              )}
              <div className="p-6">
                {p.published_at && (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    {new Date(p.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
                <h2 className="font-serif text-2xl mb-3 group-hover:text-primary transition">{p.title}</h2>
                {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
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
};

export default Blog;
