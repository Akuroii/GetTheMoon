import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { MILESTONE_CONFIG } from "@/lib/milestones";
import type { ContentItem } from "@/lib/types";

const VISIBLE_LIMIT = 40;

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`
    select * from content_items
    where published_at >= ${MILESTONE_CONFIG.chapterStartDate}
    order by published_at desc
    limit ${VISIBLE_LIMIT}
  `;

  const items: ContentItem[] = rows.map((r) => ({
    videoId: r.video_id,
    type: r.type,
    title: r.title,
    thumbnailUrl: r.thumbnail_url,
    publishedAt: r.published_at,
    viewCount: r.view_count,
    durationSeconds: r.duration_seconds,
    url: r.url,
  }));

  return NextResponse.json(items, {
    headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}
