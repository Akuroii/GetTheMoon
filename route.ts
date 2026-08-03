import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { ChannelStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`select * from channel_stats where id = 1`;
  const row = rows[0];

  if (!row) {
    return NextResponse.json(
      { error: "No stats yet — ingestion hasn't run" },
      { status: 503 }
    );
  }

  const stats: ChannelStats = {
    subscriberCount: row.subscriber_count,
    totalViews: row.total_views,
    videoCount: row.video_count,
    avatarUrlYoutube: row.avatar_url_youtube,
    updatedAt: row.updated_at,
  };

  return NextResponse.json(stats, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
