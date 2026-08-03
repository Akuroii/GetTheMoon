import Image from "next/image";
import type { ContentItem } from "@/lib/types";
import { GlassPanel } from "@/components/ui";
import { formatDate } from "@/lib/format";

export function ContentCard({ item }: { item: ContentItem }) {
  return (
    <GlassPanel intensity="strong" glow="violet" className="w-64 overflow-hidden p-0">
      <div className="relative aspect-video w-full">
        <Image src={item.thumbnailUrl} alt="" fill className="object-cover" sizes="256px" />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-[var(--text)]">{item.title}</p>
        <p className="mt-1 font-[var(--font-data)] text-xs text-[var(--text-dim)]">
          {formatDate(item.publishedAt, "short")} · {item.viewCount.toLocaleString()} views
        </p>
      </div>
    </GlassPanel>
  );
}
