import * as React from "react";
import { Bell, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useReminders } from "@/contexts/RemindersContext";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { getSectionLabel } from "@/lib/nav";
import { REMINDER_USERS } from "@/lib/reminders";
import type { Reminder } from "@/lib/reminders";

const ui = {
  btn: "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",
  navChip:
    "inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800",
};

export type RemindersPanelProps = {
  /** "all" | "mine" - who to show */
  taskView?: "all" | "mine";
  /** hide completed */
  hideDone?: boolean;
  /** section filter (e.g. from dashboard) */
  sectionFilter?: string | null;
  /** show All/Mine + Hide done controls */
  showFilters?: boolean;
  /** when showFilters: controlled taskView (dashboard passes setState) */
  onTaskViewChange?: (v: "all" | "mine") => void;
  /** when showFilters: controlled hideDone */
  onHideDoneChange?: (v: boolean) => void;
  /** when sectionFilter: clear button callback */
  onSectionFilterClear?: () => void;
  /** show Create reminder button */
  showCreateButton?: boolean;
  /** max height for list (e.g. "60vh" for overlay, "none" for inline) */
  listMaxHeight?: string;
  /** on row click (e.g. set section filter and close) */
  onReminderClick?: (reminder: Reminder) => void;
  /** optional footer (e.g. "View all on Dashboard") */
  footer?: React.ReactNode;
};

function initialsFrom(id: string, name?: string): string {
  const s = (name ?? id).trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function UserDot({ id, size = 24 }: { id: string; size?: number }) {
  const u = REMINDER_USERS.find((x) => x.id === id);
  const initials = initialsFrom(id, u?.name);
  const bg = u?.dot ?? "bg-slate-600";
  const label = u?.name ?? id;
  const cls = size === 20 ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[11px]";
  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex ${cls} items-center justify-center rounded-full font-extrabold text-white ${bg}`}
    >
      {initials}
    </span>
  );
}

function splitTaskOrder(title: string): { task: string; order: string } {
  const parts = title
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { task: parts[0], order: parts.slice(1).join(" • ") };
  return { task: title, order: "" };
}

export function ReminderRow({
  item,
  showAssignee,
  onToggleDone,
  onClick,
}: {
  item: Reminder;
  showAssignee: boolean;
  onToggleDone: () => void;
  onClick?: () => void;
}) {
  const { task, order } = splitTaskOrder(item.title);
  const sec = getSectionLabel(item.section);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-stretch justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm hover:border-slate-300"
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-slate-900">{task}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={ui.navChip}>{sec}</span>
          {order ? <span className="truncate text-xs font-semibold text-slate-800">{order}</span> : null}
        </div>
        <div className="mt-1 truncate text-xs text-slate-500">{item.detail}</div>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        {showAssignee ? (
          <div className="pt-1">
            <UserDot id={item.assignedTo} size={24} />
          </div>
        ) : null}
        <div
          className="flex h-full items-start justify-start"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleDone();
          }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Checkbox checked={item.done} />
          </span>
        </div>
      </div>
    </button>
  );
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-xs font-semibold text-slate-800">{title}</div>
      {subtitle ? <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

export function RemindersPanel({
  taskView: taskViewProp = "all",
  hideDone: hideDoneProp = true,
  sectionFilter: sectionFilterProp = null,
  showFilters = false,
  onTaskViewChange,
  onHideDoneChange,
  onSectionFilterClear,
  showCreateButton = true,
  listMaxHeight = "none",
  onReminderClick,
  footer,
}: RemindersPanelProps) {
  const { followUps, openCreateReminder, toggleDone } = useReminders();
  const { currentUser } = useCurrentUser();
  const me = currentUser.id;

  const [localTaskView, setLocalTaskView] = React.useState<"all" | "mine">("all");
  const [localHideDone, setLocalHideDone] = React.useState(true);
  const taskView = onTaskViewChange ? taskViewProp : localTaskView;
  const setTaskView = React.useCallback(
    (v: "all" | "mine") => (onTaskViewChange ? onTaskViewChange(v) : setLocalTaskView(v)),
    [onTaskViewChange]
  );
  const hideDone = onHideDoneChange ? hideDoneProp : localHideDone;
  const setHideDone = React.useCallback(
    (v: boolean) => (onHideDoneChange ? onHideDoneChange(v) : setLocalHideDone(v)),
    [onHideDoneChange]
  );
  const sectionFilter = sectionFilterProp;

  const reminders = React.useMemo(() => {
    let base = taskView === "mine" ? followUps.filter((f) => f.assignedTo === me) : followUps;
    if (hideDone) base = base.filter((f) => !f.done);
    if (sectionFilter) base = base.filter((f) => f.section === sectionFilter);
    return base.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [followUps, taskView, me, hideDone, sectionFilter]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {showFilters ? (
          <>
            <div className="flex gap-1">
              {(["all", "mine"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${ui.btn} ${taskView === v ? "border-sky-300 bg-sky-50" : ""}`}
                  onClick={() => setTaskView(v)}
                >
                  {v === "all" ? "All" : "Mine"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={hideDone}
                onCheckedChange={() => setHideDone(!hideDone)}
              />
              <span className="text-[11px] font-semibold text-slate-500">Hide done</span>
            </div>
          </>
        ) : (
          <span />
        )}
        {showCreateButton && (
          <button
            type="button"
            onClick={() => openCreateReminder()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Create reminder"
            title="Create reminder"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {sectionFilter && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
          <span className="font-semibold text-slate-700">
            Filtered: {getSectionLabel(sectionFilter)}
          </span>
          {onSectionFilterClear && (
            <button type="button" className={ui.btn} onClick={onSectionFilterClear}>
              Clear
            </button>
          )}
        </div>
      )}

      <div
        className="mt-3 space-y-2 overflow-y-auto pr-1"
        style={listMaxHeight !== "none" ? { maxHeight: listMaxHeight } : undefined}
      >
        {reminders.length === 0 ? (
          <Empty title="All caught up 🎉" subtitle="Click the + button to add a reminder." />
        ) : (
          reminders.map((f) => (
            <ReminderRow
              key={f.id}
              item={f}
              showAssignee={taskView === "all"}
              onToggleDone={() => toggleDone(f.id)}
              onClick={() => onReminderClick?.(f)}
            />
          ))
        )}
      </div>
      {footer ? <div className="mt-3 border-t border-slate-200 pt-2">{footer}</div> : null}
    </div>
  );
}

/** Compact header popover content: title + Create button + list (no filters). */
export function HeaderRemindersContent() {
  const { followUps } = useReminders();
  const count = followUps.filter((f) => !f.done).length;
  return (
    <div className="w-[360px] max-w-[calc(100vw - 2rem)] p-3">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-sky-700" />
          <span className="text-sm font-semibold text-slate-900">Reminders</span>
          {count > 0 ? (
            <span className="inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {count}
            </span>
          ) : null}
        </div>
      </div>
      <RemindersPanel
        taskView="all"
        hideDone={true}
        showFilters={false}
        showCreateButton={true}
        listMaxHeight="60vh"
      />
    </div>
  );
}
