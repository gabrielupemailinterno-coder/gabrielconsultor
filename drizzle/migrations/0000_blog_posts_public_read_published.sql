-- Cases publicados ficam legíveis sem login (anon)
GRANT SELECT ON public.blog_posts TO anon;

CREATE POLICY "blog_posts_public_read_published" ON public.blog_posts
  FOR SELECT TO anon
  USING (published = true);