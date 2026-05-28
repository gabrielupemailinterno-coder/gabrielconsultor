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
        <title>{post.title} | Blog Gabriel Vieira</title>
        {post.excerpt && <meta name="description" content={post.excerpt} />}
        <link rel="canonical" href={`https://gabrielconsultor.com/blog/${post.slug}`} />
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

        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {post.content}
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
