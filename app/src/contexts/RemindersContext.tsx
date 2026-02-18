import * as React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  INITIAL_REMINDERS,
  REMINDER_SECTIONS,
  REMINDER_USERS,
  reminderUid,
  todayISO,
  type Reminder,
} from "@/lib/reminders";
import { useCurrentUser } from "@/contexts/CurrentUserContext";

export type ReminderDraft = {
  section: string;
  title: string;
  notes: string;
  dueDate: string;
  dueTime: string;
  assignedTo: string;
};

type RemindersState = {
  followUps: Reminder[];
  setFollowUps: React.Dispatch<React.SetStateAction<Reminder[]>>;
  createReminderOpen: boolean;
  setCreateReminderOpen: (open: boolean) => void;
  reminderDraft: ReminderDraft;
  setReminderDraft: React.Dispatch<React.SetStateAction<ReminderDraft>>;
  openCreateReminder: (section?: string) => void;
  saveReminder: () => void;
  toggleDone: (id: string) => void;
};

const RemindersContext = React.createContext<RemindersState | null>(null);

const defaultDraft: ReminderDraft = {
  section: "billingPrep",
  title: "",
  notes: "",
  dueDate: "",
  dueTime: "",
  assignedTo: "jim",
};

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser();
  const me = currentUser.id;
  const [followUps, setFollowUps] = React.useState<Reminder[]>(INITIAL_REMINDERS);
  const [createReminderOpen, setCreateReminderOpen] = React.useState(false);
  const [reminderDraft, setReminderDraft] = React.useState<ReminderDraft>(defaultDraft);

  const openCreateReminder = React.useCallback(
    (section?: string) => {
      const sec =
        section && REMINDER_SECTIONS.some((s) => s.id === section) ? section : "billingPrep";
      setReminderDraft({
        section: sec,
        title: "",
        notes: "",
        dueDate: "",
        dueTime: "",
        assignedTo: me,
      });
      setCreateReminderOpen(true);
    },
    [me]
  );

  const saveReminder = React.useCallback(() => {
    const title = reminderDraft.title.trim();
    if (!title) return;
    const newReminder: Reminder = {
      id: reminderUid(),
      section: reminderDraft.section,
      title,
      detail: reminderDraft.notes.trim() || "",
      createdAt: todayISO(),
      assignedTo: reminderDraft.assignedTo,
      done: false,
      dueDate: reminderDraft.dueDate || undefined,
      dueTime: reminderDraft.dueTime || undefined,
    };
    setFollowUps((p) => [newReminder, ...p]);
    setCreateReminderOpen(false);
  }, [reminderDraft]);

  const toggleDone = React.useCallback((id: string) => {
    setFollowUps((p) => p.map((f) => (f.id === id ? { ...f, done: !f.done } : f)));
  }, []);

  const value = React.useMemo(
    () => ({
      followUps,
      setFollowUps,
      createReminderOpen,
      setCreateReminderOpen,
      reminderDraft,
      setReminderDraft,
      openCreateReminder,
      saveReminder,
      toggleDone,
    }),
    [
      followUps,
      createReminderOpen,
      reminderDraft,
      openCreateReminder,
      saveReminder,
      toggleDone,
    ]
  );

  return (
    <RemindersContext.Provider value={value}>
      {children}
      <CreateReminderDialog />
    </RemindersContext.Provider>
  );
}

function CreateReminderDialog() {
  const ctx = React.useContext(RemindersContext);
  if (!ctx) return null;
  const {
    createReminderOpen,
    setCreateReminderOpen,
    reminderDraft,
    setReminderDraft,
    saveReminder,
  } = ctx;

  return (
    <Dialog open={createReminderOpen} onOpenChange={setCreateReminderOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create reminder</DialogTitle>
        </DialogHeader>
        <DialogBody>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Section</Label>
              <select
                value={reminderDraft.section}
                onChange={(e) => setReminderDraft((d) => ({ ...d, section: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
              >
                {REMINDER_SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Assigned to</Label>
              <select
                value={reminderDraft.assignedTo}
                onChange={(e) => setReminderDraft((d) => ({ ...d, assignedTo: e.target.value }))}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
              >
                {REMINDER_USERS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Title (task reference)</Label>
            <Input
              placeholder="e.g., Send invoice • Order-123"
              value={reminderDraft.title}
              onChange={(e) => setReminderDraft((d) => ({ ...d, title: e.target.value }))}
              className="h-9 rounded-lg border-slate-200 bg-white text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Due date & time</Label>
            <div className="flex gap-3">
              <Input
                type="date"
                value={reminderDraft.dueDate}
                onChange={(e) => setReminderDraft((d) => ({ ...d, dueDate: e.target.value }))}
                className="h-9 flex-1 min-w-0 rounded-lg border border-slate-200 bg-white text-sm"
              />
              <Input
                type="time"
                value={reminderDraft.dueTime}
                onChange={(e) => setReminderDraft((d) => ({ ...d, dueTime: e.target.value }))}
                className="h-9 w-[120px] shrink-0 rounded-lg border border-slate-200 bg-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-700">Notes</Label>
            <textarea
              placeholder="Optional details"
              value={reminderDraft.notes}
              onChange={(e) => setReminderDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50"
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCreateReminderOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-sky-300 bg-white px-4 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveReminder}
              disabled={!reminderDraft.title.trim()}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              Save
            </button>
          </div>
        </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function useReminders(): RemindersState {
  const ctx = React.useContext(RemindersContext);
  if (!ctx) {
    return {
      followUps: [],
      setFollowUps: () => {},
      createReminderOpen: false,
      setCreateReminderOpen: () => {},
      reminderDraft: defaultDraft,
      setReminderDraft: () => {},
      openCreateReminder: () => {},
      saveReminder: () => {},
      toggleDone: () => {},
    };
  }
  return ctx;
}
