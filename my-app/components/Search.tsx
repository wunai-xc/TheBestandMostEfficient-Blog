"use client";

import { useEffect, useState, useRef } from "react";
import Fuse from "fuse.js";
import { SITE } from "@/lib/site";

interface SearchDoc { slug: string; title: string; summary: string; content: string; tags: string[]; }

export default function Search({ lang }: { lang: string }) {
  const t = SITE.i18n[lang === "en" ? "en" : "zh"];
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[]>([]);
  const fuseRef = useRef<Fuse<SearchDoc> | null>(null);

  useEffect(() => {
    fetch(`/search-index.${lang}.json`)
      .then((r) => r.json())
      .then((data: SearchDoc[]) => {
        fuseRef.current = new Fuse(data, {
          keys: ["title", "summary", "content", "tags"],
          includeScore: true,
          threshold: 0.3,
          ignoreLocation: true,
        });
      })
      .catch(() => {});
  }, [lang]);

  useEffect(() => {
    if (!fuseRef.current || !query.trim()) {
      setResults([]);
      return;
    }
    const res = fuseRef.current.search(query).slice(0, 20).map((r) => r.item);
    setResults(res);
  }, [query]);

  function highlight(text: string, q: string) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-highlight">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div>
      <input
        type="search"
        className="search-box"
        placeholder={t.searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {results.map((r) => (
        <div className="search-result" key={r.slug}>
          <a href={`/${lang}/posts/${encodeURIComponent(r.slug)}/`} className="title">
            {highlight(r.title, query)}
          </a>
          <div className="snippet">{highlight(r.summary, query)}</div>
        </div>
      ))}
      {query && results.length === 0 && <p style={{ color: "var(--muted)" }}>{t.noResults}</p>}
    </div>
  );
}
