import { NextResponse } from "next/server";
import { runIngest } from "@/lib/ingest";

// Called by the external cron-ping service on a schedule, never by the
// browser. The shared secret means finding this URL isn't enough to
// trigger it — see the architecture plan for why Vercel's own cron and
// GitHub Actions' schedule trigger were both ruled out for this.
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.INGEST_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngest();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Ingest failed:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
