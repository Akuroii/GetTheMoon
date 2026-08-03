import Image from "next/image";
import type { ContentItem } from "@/lib/types";
import { GlassPanel } from "@/components/ui";
import { TypeGlyph } from "@/components/content/TypeGlyph";
import { formatDate } from "@/lib/format";

export function UploadCard({ item }: { item: ContentItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-56 shrink-0 transition-transform duration-[var(--duration-fast)] hover:-translate-y-1"
      style={{ scrollSnapAlign: "start" }}
    >
      <GlassPanel className="overflow-hidden p-0">
        <div className="relative aspect-video w-full">
          <Image
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="224px"
          />
          <TypeGlyph
            type={item.type}
            className="absolute bottom-2 right-2 h-4 w-4 rounded bg-[var(--bg)]/70 p-0.5 text-[var(--text)]"
          />
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">{item.title}</p>
          <p className="mt-1 font-[var(--font-data)] text-xs text-[var(--text-dim)]">
            {item.viewCount.toLocaleString()} views · {formatDate(item.publishedAt, "compact")}
          </p>
        </div>
      </GlassPanel>
    </a>
  );
}
