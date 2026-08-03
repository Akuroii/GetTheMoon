import { ImageResponse } from "@vercel/og";
import { sql } from "@/lib/db";
import { MILESTONE_CONFIG, chapterProgress } from "@/lib/milestones";

export const runtime = "edge";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`select subscriber_count from channel_stats where id = 1`;
  const subscriberCount = rows[0]?.subscriber_count ?? MILESTONE_CONFIG.chapterStart;

  // chapterProgress() is the same clamped helper the frontend uses — this
  // is the exact division that produced V1's "NaN% at 100K" bug when it
  // was duplicated by hand instead of shared.
  const pct = Math.round(chapterProgress(subscriberCount) * 100);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#04040a",
          color: "#f0eefc",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#9d98c2" }}>
          The Subscriber Watch
        </div>
        <div style={{ fontSize: 96, fontWeight: 600, marginTop: 20 }}>
          {subscriberCount.toLocaleString()}
        </div>
        <div style={{ fontSize: 28, marginTop: 10, color: "#9d98c2" }}>
          {MILESTONE_CONFIG.chapterStart.toLocaleString()} → {MILESTONE_CONFIG.chapterGoal.toLocaleString()} · {pct}%
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
