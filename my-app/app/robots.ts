import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://newblog.wunai.top/sitemap.xml",
    host: "https://newblog.wunai.top",
  };
}
