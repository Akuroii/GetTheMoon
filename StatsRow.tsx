import { AnimatedNumber, SectionLabel, GlassPanel, Container } from "@/components/ui";

export function StatsRow({
  totalViews,
  contentCount,
  nextMilestone,
}: {
  totalViews: number;
  contentCount: number;
  nextMilestone: number;
}) {
  const stats = [
    { label: "Total Views", value: totalViews },
    // "Content" rather than V1's "Videos" — this number now includes
    // streams and shorts too, so the old label would undercount what it means.
    { label: "Content", value: contentCount },
    { label: "Next Milestone", value: nextMilestone },
  ];

  return (
    <Container className="pb-[var(--space-section)]">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <GlassPanel key={s.label} className="px-4 py-5 text-center">
            <AnimatedNumber value={s.value} className="text-xl font-medium sm:text-2xl" />
            <SectionLabel className="mt-1">{s.label}</SectionLabel>
          </GlassPanel>
        ))}
      </div>
    </Container>
  );
}
