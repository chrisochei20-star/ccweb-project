import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Youtube } from "lucide-react";
import Logo from "../brand/Logo";

const columns = [
  {
    title: "Learn",
    links: [
      { to: "/courses", label: "All courses" },
      { to: "/courses?track=web3", label: "Web3 track" },
      { to: "/courses?track=crypto", label: "Crypto track" },
      { to: "/courses?track=ai", label: "AI track" },
      { to: "/learn", label: "Free guides" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/pricing", label: "Pricing" },
      { to: "/blog", label: "Blog" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Help center" },
      { to: "/about#policies", label: "Privacy" },
      { to: "/about#policies", label: "Terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-background/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-display text-lg font-semibold">ChainCraft</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Learn Web3, crypto, and AI the right way — hands-on projects,
            mentor-led paths, and a community of serious builders.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              aria-label="GitHub"
              href="https://github.com"
              className="rounded-md p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              aria-label="Twitter"
              href="https://twitter.com"
              className="rounded-md p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              aria-label="LinkedIn"
              href="https://linkedin.com"
              className="rounded-md p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              aria-label="YouTube"
              href="https://youtube.com"
              className="rounded-md p-2 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-5 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ChainCraft. All rights reserved.</p>
          <p>Built for curious minds who want to ship.</p>
        </div>
      </div>
    </footer>
  );
}
