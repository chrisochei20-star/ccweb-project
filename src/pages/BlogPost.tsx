import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getPost } from "@/data/posts";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function BlogPost() {
  const { slug = "" } = useParams();
  const post = getPost(slug);

  if (!post) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Post not found</h1>
        <Link to="/blog" className="btn-primary mt-8">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="container-page py-16">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All posts
      </Link>

      <header className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{post.category}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dateFormatter.format(new Date(post.date))}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        <p className="mt-6 text-sm text-muted-foreground">by {post.author}</p>
      </header>

      <div className="mx-auto mt-10 max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground">
        {post.content.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
