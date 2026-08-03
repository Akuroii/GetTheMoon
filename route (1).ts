import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { ContentItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await sql`
    select * from content_items
    where type = 'video'
    order by view_count desc
    limit 12
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
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
  });
}
