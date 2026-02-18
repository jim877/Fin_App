import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Bell, Settings } from "lucide-react";
import { LoggedInUser } from "@/components/shared/LoggedInUser";
import { HeaderSearchPill } from "@/components/shared/HeaderSearchPill";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HeaderRemindersContent } from "@/components/reminders/RemindersPanel";

export type AppPageLayoutProps = {
  /** Page icon (black) */
  icon?: LucideIcon;
  /** Page title (black, no help text) */
  title: string;
  /** Main content */
  children: React.ReactNode;
  /** Optional max-width wrapper for content */
  maxWidth?: "max-w-6xl" | "max-w-7xl" | "max-w-full";
};

const HEADER_CLASS =
  "sticky top-0 z-10 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3";
const ICON_CLASS = "h-5 w-5 shrink-0 text-sky-800";
const TITLE_CLASS = "text-lg font-semibold tracking-tight text-sky-800";
const MAIN_CLASS = "flex-1 overflow-y-auto p-4";
const HEADER_BTN_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-slate-700 hover:bg-sky-500/25 hover:text-sky-800";

export function AppPageLayout({
  icon: Icon,
  title,
  children,
  maxWidth = "max-w-full",
}: AppPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-slate-100">
      <header className={HEADER_CLASS}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {Icon ? <Icon className={ICON_CLASS} aria-hidden /> : null}
          <h1 className={TITLE_CLASS}>{title}</h1>
          <HeaderSearchPill />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className={HEADER_BTN_CLASS}
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`relative ${HEADER_BTN_CLASS}`}
                aria-label="Reminders"
              >
                <Bell className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="p-0 border-slate-200 bg-white shadow-xl">
              <HeaderRemindersContent />
            </PopoverContent>
          </Popover>
          <LoggedInUser />
        </div>
      </header>
      <main className={MAIN_CLASS}>
        {maxWidth !== "max-w-full" ? (
          <div className={`mx-auto ${maxWidth}`}>{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
