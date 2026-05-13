/** Tiny className joiner (no extra deps). */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
