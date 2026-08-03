/**
 * Centralizes date formatting that was previously written independently
 * (and inconsistently — three different option sets) in ContentCard,
 * UploadCard, and Footer.
 */
export function formatDate(iso: string, style: "short" | "compact" | "long" = "short"): string {
  const date = new Date(iso);
  switch (style) {
    case "compact":
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    case "long":
      return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
    case "short":
    default:
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
