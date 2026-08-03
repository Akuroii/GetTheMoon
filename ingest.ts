// Local testing entry point: `npm run ingest`.
// Calls the exact same lib/ingest.ts logic the production /api/ingest
// route uses — this is not a second implementation to keep in sync.
import { runIngest } from "../lib/ingest";

runIngest()
  .then((result) => {
    console.log("Ingest complete:", result);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Ingest failed:", err);
    process.exit(1);
  });
