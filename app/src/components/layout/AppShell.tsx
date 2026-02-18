import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Wrench,
  PackageSearch,
} from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/invoice-review", label: "Invoice Review", icon: <FileText className="h-4 w-4" /> },
  { to: "/transactions", label: "Transactions", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { to: "/services", label: "Services", icon: <Wrench className="h-4 w-4" /> },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <aside
          className={cn(
            "sticky top-0 h-screen border-r bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40",
            "transition-[width] duration-200 ease-out",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <PackageSearch className="h-5 w-5" />
                </div>
                {!collapsed ? (
                  <div className="leading-tight">
                    <div className="font-semibold">FAP Shells</div>
                    <div className="text-xs text-muted-foreground">All-in-one</div>
                  </div>
                ) : null}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            <Separator />

            <nav className="p-2 space-y-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"
                    )
                  }
                >
                  <div className="shrink-0">{item.icon}</div>
                  {!collapsed ? <div className="truncate">{item.label}</div> : null}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto p-3">
              <div className={cn("rounded-2xl border p-3 text-xs text-muted-foreground", collapsed && "hidden")}>
                Tip: Each widget has a “chip” that navigates to the linked page.
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="px-6 py-6 max-w-[1400px] mx-auto">
            <div className="mb-4 text-xs text-muted-foreground">
              Route: <span className="font-medium text-foreground">{location.pathname}</span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
