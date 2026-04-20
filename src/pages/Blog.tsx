import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Badge from "@/components/ui/Badge";
import { posts } from "@/data/posts";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function Blog() {
  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Blog"
        title="Notes from engineers and researchers"
        description="Essays and field notes on Web3, crypto, and AI. Written by people doing the work."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            to={`/blog/${p.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-white/10 bg-card/60 p-6 transition-colors hover:border-white/20"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline">{p.category}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {dateFormatter.format(new Date(p.date))}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {p.readTime}
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">
              {p.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
            <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted-foreground">
              <span>by {p.author}</span>
              <span className="inline-flex items-center gap-1 text-foreground opacity-80 transition-opacity group-hover:opacity-100">
                Read
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
