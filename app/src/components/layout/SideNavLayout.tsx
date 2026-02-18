import * as React from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { NAV_ITEMS, routeToNavId } from "@/lib/nav";

export default function SideNavLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeId = routeToNavId[location.pathname];

  const mainItems = NAV_ITEMS.slice(0, -1);
  const settingsItem = NAV_ITEMS[NAV_ITEMS.length - 1];
  const isSettings = settingsItem?.id === "settings";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      <aside
        className={`${
          collapsed ? "w-14" : "w-56"
        } flex shrink-0 flex-col border-r border-slate-200 bg-sky-700 text-white transition-[width] duration-200`}
      >
        <div className="flex items-center justify-between px-3 py-4">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10"
            onClick={() => setCollapsed((c) => !c)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 font-bold">
              R
            </div>
            {!collapsed ? <span className="font-semibold tracking-tight">Renewal Finance</span> : null}
          </button>
        </div>

        <nav className="mt-1 flex-1 space-y-1 overflow-y-auto px-2">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            const showChip = item.count > 0;
            const isClickable = Boolean(item.route);
            return (
              <div
                key={item.id}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : -1}
                onClick={() => item.route && navigate(item.route)}
                onKeyDown={(e) => {
                  if (!item.route) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(item.route);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  isActive ? "bg-sky-800/50 text-white" : "text-white/80 hover:bg-white/10"
                } ${collapsed ? "justify-center" : ""} ${isClickable ? "cursor-pointer" : "cursor-default"}`}
              >
                <Icon className="h-4 w-4" />
                {!collapsed ? (
                  <>
                    <span className="truncate">{item.label}</span>
                    {showChip ? (
                      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-orange-500 px-2 text-[10px] font-semibold">
                        {item.count}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
        </nav>

        {isSettings && settingsItem && (() => {
          const SettingsIcon = settingsItem.icon;
          return (
            <div className="mt-auto border-t border-white/10 px-2 pb-2 pt-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => settingsItem.route && navigate(settingsItem.route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    settingsItem.route && navigate(settingsItem.route);
                  }
                }}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                  activeId === "settings" ? "bg-sky-800/50 text-white" : "text-white/80 hover:bg-white/10"
                } ${collapsed ? "justify-center" : ""} cursor-pointer`}
              >
                <SettingsIcon className="h-4 w-4" />
                {!collapsed ? <span className="truncate">{settingsItem.label}</span> : null}
              </div>
            </div>
          );
        })()}

        {!collapsed ? (
          <div className="border-t border-white/10 px-4 py-4 text-xs text-white/60">
            Monarch-inspired prototype
          </div>
        ) : null}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
