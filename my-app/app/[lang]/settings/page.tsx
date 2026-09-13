import { type Lang } from "@/lib/site";
import SiteSettings from "@/components/SiteSettings";

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  return <SiteSettings lang={p.lang as Lang} />;
}
