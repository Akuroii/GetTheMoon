import type { ContentType } from "@/lib/types";

const LABELS: Record<ContentType, string> = {
  video: "Video",
  stream: "Stream",
  short: "Short",
};

// The glyph is the label — no text tag or legend sits next to these
// anywhere they're used, per the explicit "no unnecessary legends" direction.
export function TypeGlyph({
  type,
  className,
}: {
  type: ContentType;
  className?: string;
}) {
  return (
    <span className={className} role="img" aria-label={LABELS[type]}>
      {type === "video" && (
        <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
          <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
        </svg>
      )}
      {type === "stream" && (
        <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
          <circle cx="8" cy="8" r="3" fill="currentColor" />
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        </svg>
      )}
      {type === "short" && (
        <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
          <rect x="4.5" y="1.5" width="7" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7 6.5l2.5 1.5-2.5 1.5v-3z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}
