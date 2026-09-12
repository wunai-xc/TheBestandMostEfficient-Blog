import { MetadataRoute } from "next";
import { getPosts, type Lang } from "../lib/content";
import { SITE } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/zh/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/en/`, changeFrequency: "daily", priority: 0.9 },
  ];
  for (const lang of ["zh", "en"] as Lang[]) {
    entries.push({ url: `${base}/${lang}/posts/` });
    entries.push({ url: `${base}/${lang}/tags/` });
    entries.push({ url: `${base}/${lang}/categories/` });
    entries.push({ url: `${base}/${lang}/archives/` });
    entries.push({ url: `${base}/${lang}/links/` });
    for (const p of getPosts(lang)) {
      entries.push({
        url: `${base}/${lang}/posts/${encodeURIComponent(p.slug)}/`,
        lastModified: p.date,
      });
    }
  }
  return entries;
}
