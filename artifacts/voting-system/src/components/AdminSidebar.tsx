import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Vote, Users, LogOut, ChevronRight, AlertTriangle, ScrollText } from "lucide-react";
import { NigeriaCoatOfArms } from "./NigeriaCoatOfArms";
import { clearAdminToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/elections", label: "Elections", icon: Vote },
  { href: "/admin/voters", label: "Voters", icon: Users },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export function AdminSidebar() {
  const [location, setLocation] = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [exiting, setExiting] = useState(false);

  function handleLogoutRequest() {
    setShowConfirm(true);
    setExiting(false);
  }

  function handleConfirmLogout() {
    setExiting(true);
    setTimeout(() => {
      clearAdminToken();
      // Replace current history entry so Back button can't return to admin pages
      window.history.replaceState(null, "", "/admin/login");
      setLocation("/admin/login");
    }, 300);
  }

  function handleCancel() {
    setExiting(true);
    setTimeout(() => setShowConfirm(false), 200);
  }

  return (
    <>
      <aside className="w-64 min-h-screen flex flex-col bg-sidebar text-sidebar-foreground shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <NigeriaCoatOfArms className="w-9 h-9" />
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground leading-none">Nigeria Votes</p>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">Admin Portal</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase()}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {active && <ChevronRight size={14} className="ml-auto" />}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-5">
          <button
            data-testid="button-logout"
            onClick={handleLogoutRequest}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm text-sidebar-foreground/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Sign out confirmation overlay */}
      {showConfirm && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "transition-all duration-200",
            exiting ? "opacity-0" : "opacity-100"
          )}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div
            className={cn(
              "relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4",
              "transition-all duration-200",
              exiting
                ? "scale-95 opacity-0 translate-y-2"
                : "scale-100 opacity-100 translate-y-0"
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-lg font-bold text-foreground text-center mb-1">
              Sign Out?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to sign out of the admin portal?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                data-testid="button-logout-cancel"
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                No, Stay
              </button>
              <button
                onClick={handleConfirmLogout}
                data-testid="button-logout-confirm"
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
