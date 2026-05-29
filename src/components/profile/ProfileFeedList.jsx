import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "../ui/Skeleton";

function EmptyState({ tab }) {
  const copy = {
    posts: "No posts yet. Share something in Community.",
    replies: "No replies yet.",
    media: "No media posts yet. Add image URLs in community posts.",
    likes: "You haven't liked any posts yet.",
  };
  return (
    <div className="ccweb-glass rounded-2xl px-4 py-10 text-center">
      <p className="text-sm text-ccweb-muted">{copy[tab] || "Nothing here yet."}</p>
      {tab === "posts" && (
        <Link to="/community" className="mt-4 inline-block ccweb-gradient-btn min-h-[44px] px-5 text-sm">
          Open Community
        </Link>
      )}
    </div>
  );
}

export function ProfileFeedList({ tab, items, loading, error, onRetry }) {
  if (loading && !items?.length) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ccweb-glass rounded-2xl p-4">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="mt-2 h-3 w-full rounded-md" />
            <Skeleton className="mt-2 h-3 w-4/5 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="ccweb-glass rounded-2xl px-4 py-8 text-center">
        <p className="text-sm text-rose-200">{error}</p>
        {onRetry && (
          <button type="button" className="ccweb-outline-btn mt-4 min-h-[44px] px-4 text-sm" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!items?.length) return <EmptyState tab={tab} />;

  if (tab === "replies") {
    return (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="ccweb-glass rounded-2xl p-4">
            <p className="text-xs text-ccweb-muted">Reply to {item.postTitle || "post"}</p>
            <p className="mt-1 text-sm text-white">{item.body}</p>
            <p className="mt-2 text-[11px] text-ccweb-muted">{new Date(item.createdAt).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="ccweb-glass rounded-2xl p-4">
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="mt-1 line-clamp-4 text-sm text-ccweb-muted">{item.content}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ccweb-muted">
            <span>{new Date(item.createdAt).toLocaleString()}</span>
            {item.commentCount != null && <span>{item.commentCount} comments</span>}
            {item.likedAt && <span>Liked {new Date(item.likedAt).toLocaleString()}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProfileFeedLoadingMore({ show }) {
  if (!show) return null;
  return (
    <div className="flex justify-center py-4 text-ccweb-muted" role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
    </div>
  );
}
