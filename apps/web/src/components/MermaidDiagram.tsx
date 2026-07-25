import { useEffect, useState } from "react";

import { fnv1a32 } from "../lib/diffRendering";
import { LRUCache } from "../lib/lruCache";
import { Skeleton } from "./ui/skeleton";

type MermaidTheme = "light" | "dark";

const MAX_MERMAID_CACHE_ENTRIES = 100;
const MAX_MERMAID_CACHE_MEMORY_BYTES = 10 * 1024 * 1024;

const mermaidSvgCache = new LRUCache<string>(
  MAX_MERMAID_CACHE_ENTRIES,
  MAX_MERMAID_CACHE_MEMORY_BYTES,
);

let mermaidImportPromise: Promise<typeof import("mermaid")> | null = null;
let lastInitializedTheme: string | null = null;

async function getMermaid(theme: MermaidTheme) {
  mermaidImportPromise ??= import("mermaid");
  const mermaid = (await mermaidImportPromise).default;
  const mermaidTheme = theme === "dark" ? "dark" : "default";
  if (lastInitializedTheme !== mermaidTheme) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      // Without this, a diagram that fails to parse or draw leaves Mermaid's
      // temporary render container attached to document.body — render() only
      // cleans it up on the success path.
      suppressErrorRendering: true,
      theme: mermaidTheme,
      fontFamily: "inherit",
    });
    lastInitializedTheme = mermaidTheme;
  }
  return mermaid;
}

function createMermaidCacheKey(source: string, theme: MermaidTheme): string {
  return `${fnv1a32(source).toString(36)}:${source.length}:${theme}`;
}

/** Test-only: reset module init state between cases. */
export function __resetMermaidDiagramStateForTests(): void {
  mermaidImportPromise = null;
  lastInitializedTheme = null;
  mermaidSvgCache.clear();
}

export async function renderMermaidSvg(source: string, theme: MermaidTheme): Promise<string> {
  const cacheKey = createMermaidCacheKey(source, theme);
  const cachedSvg = mermaidSvgCache.get(cacheKey);
  if (cachedSvg != null) {
    return cachedSvg;
  }

  const mermaid = await getMermaid(theme);
  const { svg } = await mermaid.render(`mermaid-${cacheKey.replaceAll(":", "-")}`, source);
  mermaidSvgCache.set(cacheKey, svg, svg.length * 2);
  return svg;
}

/**
 * Holds a fixed-height placeholder while Mermaid resolves so the block does not
 * jump by the length of the diagram source, and falls back to that source
 * permanently when a diagram cannot parse.
 */
export function MermaidDiagram({ source, theme }: { source: string; theme: MermaidTheme }) {
  const [svg, setSvg] = useState(() => mermaidSvgCache.get(createMermaidCacheKey(source, theme)));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(mermaidSvgCache.get(createMermaidCacheKey(source, theme)));
    setFailed(false);

    void renderMermaidSvg(source, theme).then(
      (nextSvg) => {
        if (!cancelled) setSvg(nextSvg);
      },
      (cause: unknown) => {
        if (cancelled) return;
        console.error("[chat-markdown] mermaid render failed", cause);
        setFailed(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [source, theme]);

  if (svg != null) {
    return <div className="chat-markdown-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
  }

  if (failed) {
    return (
      <pre>
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <div className="chat-markdown-mermaid">
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
