import { Container, SectionHeading } from "@/components/ui";
import { UploadCard } from "@/components/content/UploadCard";
import type { ContentItem } from "@/lib/types";

export function FanFavorites({ items }: { items: ContentItem[] }) {
  // The API route already queries `WHERE type = 'video'`, but this
  // requirement has been restated as non-negotiable enough times that a
  // second, cheap guard here is worth it — if a stream or short ever slips
  // through upstream, it's silently dropped here rather than shipped.
  const favorites = items
    .filter((item) => item.type === "video")
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 12);

  return (
    <section className="pb-[var(--space-section)]">
      <Container size="wide">
        <SectionHeading>Fan Favorites</SectionHeading>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x proximity", overscrollBehaviorX: "contain" }}>
          {favorites.map((item) => (
            <UploadCard key={item.videoId} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
