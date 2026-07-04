import { Link } from "react-router-dom";

export function ProfileActionBar({ profile }) {
  if (!profile) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Link
        to={`/u/${profile.slug || profile.id}`}
        className="rounded-full border border-white/10 px-3 py-2 text-sm text-white hover:border-ccweb-cyan"
      >
        View Profile
      </Link>

      <Link
        to={`/chat?user=${encodeURIComponent(profile.id)}`}
        className="rounded-full bg-ccweb-cyan px-3 py-2 text-sm font-medium text-black"
      >
        Message
      </Link>

      <button
        type="button"
        className="rounded-full border border-ccweb-cyan px-3 py-2 text-sm text-ccweb-cyan"
      >
        Follow
      </button>
    </div>
  );
}
