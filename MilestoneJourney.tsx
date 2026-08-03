"use client";

import { useEffect, useRef, useState } from "react";
import {
  MILESTONE_CONFIG,
  chapterProgress,
  currentSegmentIndex,
  segmentRange,
} from "@/lib/milestones";
import { Container } from "@/components/ui";
import { useChannelStatsStore } from "@/lib/store";
import type { ChannelStats } from "@/lib/types";
import { MilestoneCarousel } from "./MilestoneCarousel";

const PATH_D = "M 20,70 C 220,15 560,125 780,60";

interface Point {
  x: number;
  y: number;
}

export function MilestoneJourney({ initialStats }: { initialStats: ChannelStats }) {
  const stats = useChannelStatsStore((s) => s.stats) ?? initialStats;
  const subscriberCount = stats.subscriberCount;

  const pathRef = useRef<SVGPathElement>(null);
  const [markerPoint, setMarkerPoint] = useState<Point | null>(null);
  const [dotPoints, setDotPoints] = useState<Point[]>([]);
  const [segmentIndex, setSegmentIndex] = useState(() => currentSegmentIndex(subscriberCount));

  // If a live poll pushes the count into a later segment, follow it forward
  // — but never backward, and never overriding a manual carousel step the
  // visitor already made past where the live count currently sits.
  //
  // This adjusts state during render (React's documented pattern for
  // syncing state to a changed prop) rather than in a useEffect — ESLint's
  // react-hooks/set-state-in-effect rule correctly flags setState-in-effect
  // for exactly this kind of derived update, since it causes an extra,
  // avoidable render pass.
  const [lastSeenCount, setLastSeenCount] = useState(subscriberCount);
  if (subscriberCount !== lastSeenCount) {
    setLastSeenCount(subscriberCount);
    const liveSegment = currentSegmentIndex(subscriberCount);
    if (liveSegment > segmentIndex) {
      setSegmentIndex(liveSegment);
    }
  }

  const progress = chapterProgress(subscriberCount);

  // getTotalLength/getPointAtLength need the path to actually be in the DOM
  // and are syncing React state to an external system (the rendered SVG
  // geometry) — a legitimate use of an effect, unlike the segment logic above.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();

    setMarkerPoint(path.getPointAtLength(length * progress));

    setDotPoints(
      MILESTONE_CONFIG.subMilestones.slice(0, -1).map((_, i) => {
        const t = (i + 1) / MILESTONE_CONFIG.subMilestones.length;
        return path.getPointAtLength(length * t);
      })
    );
  }, [progress]);

  const { start, end, pct } = segmentRange(segmentIndex, subscriberCount);

  return (
    <section className="pb-[var(--space-section)]">
      <Container size="wide">
        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-[var(--text-dim)]">
          <span>100K</span>
          <span className="text-[var(--gold)]">500K</span>
        </div>

        <svg
          viewBox="0 0 800 130"
          className="mt-2 w-full"
          role="img"
          aria-label={`${Math.round(progress * 100)} percent of the way from 100,000 to 500,000 subscribers`}
        >
          <defs>
            <linearGradient id="journey-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--violet)" />
              <stop offset="55%" stopColor="var(--pink)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>
            <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            ref={pathRef}
            d={PATH_D}
            fill="none"
            stroke="url(#journey-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.65}
          />

          {/* 100K anchor */}
          <circle cx="20" cy="70" r="6" fill="var(--violet)" />
          {/* 500K Moon anchor — same simple dark-circle-plus-shadow idiom as
              the CSS Moon element, kept subtle here since the hero already
              carries the Moon's visual weight */}
          <circle cx="780" cy="60" r="14" fill="#c9c2e8" opacity={0.9} />

          {/* sub-milestones — quiet by design, never competing with the
              100K → 500K read */}
          {dotPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="var(--text-dim)" opacity={0.5} />
          ))}

          {/* current position */}
          {markerPoint && (
            <g transform={`translate(${markerPoint.x}, ${markerPoint.y})`}>
              <circle r="7" fill="var(--pink)" filter="url(#marker-glow)" />
              <circle r="7" fill="var(--pink)" className="animate-[marker-pulse_2.4s_ease-in-out_infinite]" />
            </g>
          )}
        </svg>
      </Container>

      <MilestoneCarousel
        segmentIndex={segmentIndex}
        segmentCount={MILESTONE_CONFIG.subMilestones.length}
        onPrev={() => setSegmentIndex((i) => Math.max(0, i - 1))}
        onNext={() =>
          setSegmentIndex((i) => Math.min(MILESTONE_CONFIG.subMilestones.length - 1, i + 1))
        }
        start={start}
        end={end}
        pct={pct}
      />
    </section>
  );
}
