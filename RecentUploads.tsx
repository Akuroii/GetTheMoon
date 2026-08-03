import { Container, SectionHeading } from "@/components/ui";
import { UploadCard } from "@/components/content/UploadCard";
import type { ContentItem } from "@/lib/types";

export function RecentUploads({ items }: { items: ContentItem[] }) {
  const recent = [...items]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 12);

  return (
    <section className="pb-[var(--space-section)]">
      <Container size="wide">
        <SectionHeading>Recent Uploads</SectionHeading>
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x proximity", overscrollBehaviorX: "contain" }}>
          {recent.map((item) => (
            <UploadCard key={item.videoId} item={item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
