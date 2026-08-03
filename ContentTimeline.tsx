import { Container, SectionHeading } from "@/components/ui";
import { TimelineNode } from "./TimelineNode";
import type { ContentItem } from "@/lib/types";

export function ContentTimeline({ items }: { items: ContentItem[] }) {
  const sorted = [...items].sort(
    (a, b) => +new Date(a.publishedAt) - +new Date(b.publishedAt)
  );

  return (
    <section className="pb-[var(--space-section)]">
      <Container size="wide">
        <SectionHeading>The Journey</SectionHeading>

        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollSnapType: "x proximity", overscrollBehaviorX: "contain" }}>
          {sorted.map((item) => (
            <div key={item.videoId} style={{ scrollSnapAlign: "start" }}>
              <TimelineNode item={item} />
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-[var(--text-dim)]">
          {sorted.length} uploads since the 100K milestone · hover or tap to explore
        </p>
      </Container>
    </section>
  );
}
