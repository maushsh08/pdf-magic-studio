import { Link, useLocation } from "@tanstack/react-router";
import { FileText, Combine, Scissors } from "lucide-react";
import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/registerSW";

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const navItems = [
    { to: "/", label: "ホーム", icon: FileText },
    { to: "/merge", label: "結合", icon: Combine },
    { to: "/split", label: "分割", icon: Scissors },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--gradient-subtle)" }}>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <FileText className="h-4 w-4" />
            </span>
            <span className="tracking-tight">PDF Manager</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-24 sm:pb-10">{children}</main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="grid grid-cols-3">
          {navItems.map((n) => {
            const Icon = n.icon;
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}