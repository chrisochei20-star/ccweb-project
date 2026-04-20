import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../brand/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/courses", label: "Courses" },
  { to: "/learn", label: "Learn" },
  { to: "/blog", label: "Blog" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors",
        scrolled
          ? "border-b border-white/10 bg-background/70 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="ChainCraft home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-lg font-semibold tracking-tight">
            ChainCraft
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/contact" className="btn-ghost">
            Sign in
          </Link>
          <Link to="/pricing" className="btn-primary">
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="btn-ghost md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-white/10 bg-background/90 backdrop-blur-md md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="Mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                    isActive && "bg-white/[0.06] text-foreground"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2">
              <Link to="/contact" className="btn-outline flex-1">
                Sign in
              </Link>
              <Link to="/pricing" className="btn-primary flex-1">
                Get started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
