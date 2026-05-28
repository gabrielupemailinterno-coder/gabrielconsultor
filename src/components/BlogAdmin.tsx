import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, Edit3, Eye, EyeOff, X } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

const empty = { title: "", slug: "", excerpt: "", content: "", cover_image_url: "", published: false };

const BlogAdmin = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ ...empty });
  const startEdit = (p: Post) => setEditing({ ...p });

  const save = async () => {
    if (!editing?.title || !editing?.content) {
      alert("Título e conteúdo são obrigatórios.");
      return;
    }
    setSaving(true);
    const slug = (editing.slug && editing.slug.trim()) || slugify(editing.title);
    const payload = {
      title: editing.title.trim(),
      slug,
      excerpt: editing.excerpt?.trim() || null,
      content: editing.content,
      cover_image_url: editing.cover_image_url?.trim() || null,
      published: !!editing.published,
      published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }
    setSaving(false);
    if (error) { alert("Erro: " + error.message); return; }
    setEditing(null);
    load();
  };

  const togglePublish = async (p: Post) => {
    const next = !p.published;
    await supabase.from("blog_posts").update({
      published: next,
      published_at: next ? (p.published_at || new Date().toISOString()) : null,
    }).eq("id", p.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este conteúdo?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    load();
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{posts.length} conteúdo(s)</p>
        <button onClick={startNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
          <Plus size={16} /> Novo conteúdo
        </button>
      </div>

      {posts.length === 0 && <p className="text-muted-foreground text-sm">Nenhum conteúdo ainda. Clique em "Novo conteúdo" para começar.</p>}

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="font-serif text-lg">{p.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.published ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {p.published ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">/blog/{p.slug}</p>
                {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => togglePublish(p)} title={p.published ? "Despublicar" : "Publicar"} className="text-muted-foreground hover:text-primary transition">
                  {p.published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => startEdit(p)} className="text-muted-foreground hover:text-foreground transition"><Edit3 size={16} /></button>
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive transition"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-background border border-border rounded-lg w-full max-w-3xl my-8 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-2xl">{editing.id ? "Editar conteúdo" : "Novo conteúdo"}</h2>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Título</label>
              <input
                value={editing.title || ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Slug (URL)</label>
              <input
                value={editing.slug || ""}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Resumo (opcional)</label>
              <textarea
                value={editing.excerpt || ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                rows={2}
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Imagem de capa (URL, opcional)</label>
              <input
                value={editing.cover_image_url || ""}
                onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo</label>
              <textarea
                value={editing.content || ""}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={14}
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="Escreva o conteúdo do post. Quebras de linha são preservadas."
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Publicar agora (visível no site)
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogAdmin;
