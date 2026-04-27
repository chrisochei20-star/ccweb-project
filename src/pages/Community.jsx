import { useState } from "react";
import { MessageCircle, ThumbsUp, Share2, Users, TrendingUp, Hash } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

const channels = [
  { id: "general", name: "General", members: 8400 },
  { id: "crypto", name: "Crypto Trading", members: 5200 },
  { id: "ai", name: "AI Projects", members: 3100 },
  { id: "study", name: "Study Groups", members: 2800 },
];

const posts = [
  {
    id: 1,
    user: "Maya O.",
    channel: "AI Projects",
    time: "2h ago",
    content: "Just completed the Neural Networks module — the AI tutor explained backpropagation better than any textbook I've read.",
    likes: 34,
    comments: 8,
  },
  {
    id: 2,
    user: "Ahmad K.",
    channel: "Crypto Trading",
    time: "4h ago",
    content: "BTC forming a classic cup and handle on the 4H chart. Watching the $68k resistance closely.",
    likes: 51,
    comments: 19,
  },
  {
    id: 3,
    user: "Priya S.",
    channel: "General",
    time: "6h ago",
    content: "The live Blockchain Masterclass earlier was incredible. 891 people joined!",
    likes: 27,
    comments: 12,
  },
];

export default function Community() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [likedPosts, setLikedPosts] = useState(new Set());

  function toggleLike(id) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Community</h2>
        <p className="text-sm text-slate-500 mt-0.5">Connect and grow with learners worldwide</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Channels */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-1">Channels</p>
          <nav className="space-y-0.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left
                  ${activeChannel === ch.id
                    ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
              >
                <Hash size={15} />
                <span className="flex-1">{ch.name}</span>
                <span className="text-xs text-slate-600">{(ch.members / 1000).toFixed(1)}k</span>
              </button>
            ))}
          </nav>

          <Card>
            <CardBody>
              <p className="text-xs font-medium text-slate-300 mb-3">Online now</p>
              <div className="flex -space-x-1.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-cyan/30 to-blue-500/30 border-2 border-surface-800" />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">24 members online</p>
            </CardBody>
          </Card>
        </div>

        {/* Posts */}
        <div className="lg:col-span-3 space-y-4">
          {/* New post */}
          <Card>
            <CardBody>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan/30 to-blue-500/30 border border-brand-cyan/20 shrink-0" />
                <div className="flex-1">
                  <textarea
                    placeholder="Share something with the community..."
                    rows={2}
                    className="w-full bg-surface-900 border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-brand-cyan/30 transition-all resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button variant="primary" size="sm">Post</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Posts list */}
          {posts.map((post) => (
            <Card key={post.id} hover>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cyan/20 to-blue-500/20 border border-white/[0.08] shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-200">{post.user}</span>
                      <Badge variant="cyan">{post.channel}</Badge>
                      <span className="text-xs text-slate-600">{post.time}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${likedPosts.has(post.id) ? "text-brand-cyan" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        <ThumbsUp size={13} />
                        {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                      </button>
                      <button type="button" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <MessageCircle size={13} />
                        {post.comments}
                      </button>
                      <button type="button" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <Share2 size={13} />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
