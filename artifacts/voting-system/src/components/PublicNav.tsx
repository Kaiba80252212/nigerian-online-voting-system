import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { NigeriaFlag } from "./NigeriaCoatOfArms";
import { cn } from "@/lib/utils";
import { Moon, Sun, User, Menu, X, LayoutDashboard } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { getVoterToken } from "@/lib/auth";

const SECRET_SEQUENCE = "INEC";

export function PublicNav() {
  const [location, navigate] = useLocation();
  const { toggle, isDark } = useTheme();
  const [hasVoterToken, setHasVoterToken] = useState(() => !!getVoterToken());
  const [mobileOpen, setMobileOpen] = useState(false);
  const sequenceRef = useRef("");
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasVoterToken(!!getVoterToken());
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;

      const char = e.key.toUpperCase();
      if (!/^[A-Z]$/.test(char)) {
        sequenceRef.current = "";
        return;
      }

      sequenceRef.current += char;
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = setTimeout(() => { sequenceRef.current = ""; }, 2500);

      if (sequenceRef.current.endsWith(SECRET_SEQUENCE)) {
        sequenceRef.current = "";
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
        navigate("/admin/login");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [navigate]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/register", label: "Register" },
    { href: "/verify", label: "Verify & Vote" },
    { href: "/results", label: "Results" },
  ].filter(({ href }) => href !== "/register" || !(hasVoterToken || getVoterToken()));

  return (
    <header className="public-nav sticky top-0 z-50 border-b border-border backdrop-blur transition-colors duration-300">
      <div className="public-nav-inner mx-auto px-3 sm:px-4 lg:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <div className="public-nav-brand flex items-center cursor-pointer" data-testid="link-home-logo">
            <span className="public-nav-brand-mark">
              <NigeriaFlag className="w-7 h-[18px] rounded-[2px] shadow-sm" />
            </span>
            <span className="flex flex-col">
              <span className="font-semibold text-foreground text-sm tracking-tight leading-tight">Nigeria Votes</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground leading-tight mt-0.5">Digital voting portal</span>
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}>
              <span
                data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
                  location === href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-public-link
                data-active={location === href}
                aria-current={location === href ? "page" : undefined}
              >
                {label}
              </span>
            </Link>
          ))}

          {hasVoterToken && (
            <>
              <Link href="/dashboard">
                <span
                  data-testid="nav-dashboard"
                  className={cn(
                    "ml-0.5 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
                    location === "/dashboard"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  data-public-link
                  data-active={location === "/dashboard"}
                  aria-current={location === "/dashboard" ? "page" : undefined}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </span>
              </Link>
              <Link href="/profile">
                <span
                  data-testid="nav-profile"
                  className={cn(
                    "ml-0.5 flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors",
                    location === "/profile"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  data-public-link
                  data-active={location === "/profile"}
                  aria-current={location === "/profile" ? "page" : undefined}
                >
                  <User size={14} />
                  Profile
                </span>
              </Link>
            </>
          )}

          <button
            onClick={toggle}
            data-testid="button-theme-toggle"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-1.5 w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative overflow-hidden"
          >
            <span className="absolute transition-all duration-300" style={{ opacity: isDark ? 0 : 1, transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)" }}>
              <Sun size={16} />
            </span>
            <span className="absolute transition-all duration-300" style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)" }}>
              <Moon size={16} />
            </span>
          </button>
        </nav>

        {/* Mobile right controls */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative overflow-hidden"
          >
            <span className="absolute transition-all duration-300" style={{ opacity: isDark ? 0 : 1, transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)" }}>
              <Sun size={16} />
            </span>
            <span className="absolute transition-all duration-300" style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)" }}>
              <Moon size={16} />
            </span>
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            className="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
        <div
        className={cn(
          "public-nav-mobile md:hidden border-t border-border backdrop-blur overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="px-3 py-3 space-y-0.5">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}>
              <span
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                  location === href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-public-link
                data-active={location === href}
                aria-current={location === href ? "page" : undefined}
              >
                {label}
              </span>
            </Link>
          ))}

          {hasVoterToken && (
            <>
              <div className="h-px bg-border my-2" />
              <Link href="/dashboard">
                <span
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                    location === "/dashboard"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  data-public-link
                  data-active={location === "/dashboard"}
                  aria-current={location === "/dashboard" ? "page" : undefined}
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </span>
              </Link>
              <Link href="/profile">
                <span
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors",
                    location === "/profile"
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  data-public-link
                  data-active={location === "/profile"}
                  aria-current={location === "/profile" ? "page" : undefined}
                >
                  <User size={15} />
                  Profile
                </span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
