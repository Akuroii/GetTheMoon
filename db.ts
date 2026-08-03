import { neon } from "@neondatabase/serverless";

// Falls back to a syntactically-valid-but-fake connection string so this
// module can be imported during `next build`'s page-data collection without
// a real DATABASE_URL present — neon() validates the URL's format at
// construction time, not just when a query actually runs, so an arbitrary
// placeholder string isn't enough; it has to look like a real postgres URL.
// Every route that actually queries the DB is marked
// `export const dynamic = "force-dynamic"`, so no query runs at build
// time — only at request time, on a real deployment with real env vars.
export const sql = neon(
  process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/placeholder"
);
