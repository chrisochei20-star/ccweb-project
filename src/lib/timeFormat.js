/** Relative and chat-friendly timestamps for mobile surfaces. */

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMessageTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function formatDateSeparator(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function shouldShowDateSeparator(prevIso, currIso) {
  if (!currIso) return false;
  if (!prevIso) return true;
  const a = new Date(prevIso);
  const b = new Date(currIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return a.toDateString() !== b.toDateString();
}
