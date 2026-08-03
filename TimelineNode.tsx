"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentItem } from "@/lib/types";
import { TypeGlyph } from "@/components/content/TypeGlyph";
import { ContentCard } from "@/components/content/ContentCard";
import { formatDate } from "@/lib/format";

const TYPE_COLOR: Record<ContentItem["type"], string> = {
  video: "var(--violet)",
  stream: "var(--pink)",
  short: "var(--gold)",
};

export function TimelineNode({ item }: { item: ContentItem }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes and returns focus to the node — same pattern V1 already
  // uses for its own overlays, carried forward rather than reinvented.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative shrink-0">
      {/*
        The visible marker is 12px; the actual button is 44px (h-11 w-11).
        An invisible larger hit area around a small visual dot, not a 44px
        dot — matches current touch-target guidance without bloating the
        visual design of the rail.
      */}
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((o) => !o)}
        aria-label={`${item.type}: ${item.title}, ${formatDate(item.publishedAt, "short")}`}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center"
      >
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-full"
          style={{
            background: TYPE_COLOR[item.type],
            boxShadow: `0 0 8px ${TYPE_COLOR[item.type]}`,
          }}
        />
        <TypeGlyph
          type={item.type}
          className="absolute -bottom-0.5 h-2.5 w-2.5 text-[var(--text-dim)]"
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2">
          <ContentCard item={item} />
        </div>
      )}
    </div>
  );
}
