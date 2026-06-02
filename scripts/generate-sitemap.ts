// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://gabrielconsultor.com";
const SUPABASE_URL = "https://xhzsdnbztsnupbukmdjg.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoenNkbmJ6dHNudXBidWttZGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjY5ODAsImV4cCI6MjA5NTQwMjk4MH0.737zwJUZbF8Fm2sDI97XUJznbR1OZexbmxoLR8Ocqt8";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/mentoria-profissional", changefreq: "monthly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
];

async function fetchPosts(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at,published_at&published=eq.true`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string; updated_at?: string; published_at?: string }[];
    return rows.map((p) => ({
      path: `/blog/${p.slug}`,
      lastmod: (p.updated_at || p.published_at || "").slice(0, 10) || undefined,
      changefreq: "monthly",
      priority: "0.7",
    }));
  } catch {
    return [];
  }
}

function build(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

(async () => {
  const all = [...staticEntries, ...(await fetchPosts())];
  writeFileSync(resolve("public/sitemap.xml"), build(all));
  console.log(`sitemap.xml written (${all.length} entries)`);
})();
