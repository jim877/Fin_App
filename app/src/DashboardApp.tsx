import React, { useEffect, useMemo, useState } from "react";
import { Bell, LayoutDashboard } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useReminders } from "@/contexts/RemindersContext";
import { Empty, ReminderRow, RemindersPanel } from "@/components/reminders/RemindersPanel";
import { getSectionLabel } from "@/lib/nav";
import PerformanceSection from "./PerformanceSection";

const TODAY = new Date("2025-11-15T00:00:00Z");

const USERS = [
  { id: "jim", name: "Jim", dot: "bg-slate-700" },
  { id: "jc", name: "JC", dot: "bg-indigo-600" },
  { id: "df", name: "DF", dot: "bg-emerald-600" },
  { id: "rh", name: "RH", dot: "bg-orange-500" },
  { id: "ma", name: "MA", dot: "bg-slate-500" },
];
type Order = {
  id: string;
  orderName: string;
  storageExpiresAt?: string;
  estFinalDelivery?: string;
  deliveryDue?: string;
  dopStatus?: "confirmed" | "question";
};

const ORDERS: Order[] = [
  {
    id: "o-1",
    orderName: "Kaminsky-HillsboroughNJ",
    storageExpiresAt: "2025-11-18",
    estFinalDelivery: "2025-11-27",
    deliveryDue: "2025-12-02",
    dopStatus: "confirmed",
  },
  {
    id: "o-2",
    orderName: "Helmers-NewYorkNY",
    storageExpiresAt: "2025-11-16",
    estFinalDelivery: "2025-11-20",
    deliveryDue: "2025-11-22",
    dopStatus: "question",
  },
  { id: "o-4", orderName: "Russenbeger-CliffsideParkNJ", deliveryDue: "2025-11-20", dopStatus: "question" },
  { id: "o-5", orderName: "Parry-NewYorkNY", deliveryDue: "2025-11-24", dopStatus: "question" },
  { id: "o-6", orderName: "Winterroth-YonkersNY", deliveryDue: "2025-12-10", dopStatus: "question" },
];

type CollectionsAlert = {
  id: string;
  orderName: string;
  balance: number;
  reasons: Array<"nonResponsive" | "deliveredNotPaid" | "collectionConcern">;
  salesRep: string;
};

const COLLECTION_ALERTS: CollectionsAlert[] = [
  {
    id: "ca-1",
    orderName: "Kaminsky-HillsboroughNJ",
    balance: 12480,
    reasons: ["deliveredNotPaid", "nonResponsive"],
    salesRep: "jc",
  },
  {
    id: "ca-2",
    orderName: "Helmers-NewYorkNY",
    balance: 8450,
    reasons: ["collectionConcern"],
    salesRep: "jc",
  },
  {
    id: "ca-3",
    orderName: "Parry-NewYorkNY",
    balance: 3920,
    reasons: ["deliveredNotPaid"],
    salesRep: "df",
  },
  {
    id: "ca-4",
    orderName: "Russenbeger-CliffsideParkNJ",
    balance: 15675,
    reasons: ["nonResponsive", "collectionConcern"],
    salesRep: "df",
  },
];

const ui = {
  card: "border-slate-200 bg-white",
  pill: "inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold text-white",
  btn: "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50",
  tag: "inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600",
  navChip:
    "inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800",
  navChipMuted:
    "inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600",
};

function userFor(id: string) {
  return USERS.find((u) => u.id === id);
}

function initialsFrom(id: string, name?: string) {
  const s = (name ?? id).trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function UserDot({ id, size = 24 }: { id: string; size?: number }) {
  const u = userFor(id);
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

function toDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function daysUntil(iso?: string, ref = TODAY) {
  const d = toDate(iso);
  if (!d) return null;
  return daysBetween(ref, d);
}

function fmtDate(iso?: string) {
  const d = toDate(iso);
  return d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
}

function formatMoney(value: number) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function splitTaskOrder(title: string) {
  const parts = title
    .split("•")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { task: parts[0], order: parts.slice(1).join(" • ") };
  return { task: title, order: "" };
}

function HelpLine({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 border-t border-slate-200 pt-2 text-[11px] text-slate-500">{children}</div>;
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function devTests() {
  const exp = toDate("2025-11-10")!;
  const fin = toDate("2025-11-12")!;
  assert(exp.getTime() < fin.getTime(), "date compare failed");
  assert(daysUntil("2025-11-20", new Date("2025-11-15T00:00:00Z")) === 5, "daysUntil failed");
  const ref = new Date("2025-11-15T00:00:00Z");
  assert(daysUntil("2025-11-25", ref) === 10, "boundary 10 failed");
  assert(daysUntil("2025-11-26", ref) === 11, "boundary 11 failed");
  assert(initialsFrom("jim", "Jim") === "JI", "initials failed");
  const so = splitTaskOrder("Send invoice • Russenbeger-CliffsideParkNJ");
  assert(so.task === "Send invoice" && so.order === "Russenbeger-CliffsideParkNJ", "splitTaskOrder failed");
}

export default function DashboardApp() {
  const { currentUser } = useCurrentUser();
  const me = currentUser.id;
  const [taskView, setTaskView] = useState<"all" | "mine">("all");
  const [hideDone, setHideDone] = useState(true);
  const [sectionFilter, setSectionFilter] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [openList, setOpenList] = useState<null | "storageGap" | "dop" | "collectionsAlert" | "reminders">(null);

  const [prefs, setPrefs] = useState({
    reminders: true,
    storageGap: true,
    dop: true,
    collectionsAlert: true,
    chips: true,
  });

  const { followUps, openCreateReminder, toggleDone } = useReminders();

  const openDest =
    openList === "storageGap"
      ? "Storage"
      : openList === "dop"
      ? "Invoice Prep"
      : openList === "collectionsAlert"
      ? "Collections"
      : null;

  useEffect(() => {
    try {
      devTests();
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!showCustomize && !openList) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowCustomize(false);
        setOpenList(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCustomize, openList]);

  const storageGap = useMemo(() => {
    return ORDERS.filter((o) => {
      const expD = toDate(o.storageExpiresAt);
      const finD = toDate(o.estFinalDelivery);
      return !!(expD && finD && expD.getTime() < finD.getTime());
    }).sort(
      (a, b) =>
        (toDate(a.storageExpiresAt)?.getTime() ?? 0) - (toDate(b.storageExpiresAt)?.getTime() ?? 0)
    );
  }, []);

  const unconfirmedDop = useMemo(() => {
    return ORDERS.filter((o) => {
      if (o.dopStatus !== "question") return false;
      const dueIn = daysUntil(o.deliveryDue);
      return dueIn !== null && dueIn >= 0 && dueIn <= 10;
    }).sort((a, b) => (daysUntil(a.deliveryDue) ?? 9999) - (daysUntil(b.deliveryDue) ?? 9999));
  }, []);

  const togglePref = (k: keyof typeof prefs) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  const reminders = useMemo(() => {
    let base = taskView === "mine" ? followUps.filter((f) => f.assignedTo === me) : followUps;
    if (hideDone) base = base.filter((f) => !f.done);
    if (sectionFilter) base = base.filter((f) => f.section === sectionFilter);
    return base.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [followUps, taskView, me, hideDone, sectionFilter]);

  return (
    <AppPageLayout icon={LayoutDashboard} title="Dashboard">
      {showCustomize ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/20" onMouseDown={() => setShowCustomize(false)} />
            <div
              className="absolute right-4 top-20 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">Widgets</div>
                <button type="button" className={ui.btn} onClick={() => setShowCustomize(false)}>
                  Close
                </button>
              </div>
              <div className="space-y-2 px-4 py-3">
                <Pref label="Reminders" checked={prefs.reminders} onToggle={() => togglePref("reminders")} />
                <Pref label="Storage Gap" checked={prefs.storageGap} onToggle={() => togglePref("storageGap")} />
                <Pref label="Unconfirmed DOP" checked={prefs.dop} onToggle={() => togglePref("dop")} />
                <Pref
                  label="Collections alert"
                  checked={prefs.collectionsAlert}
                  onToggle={() => togglePref("collectionsAlert")}
                />
                <Pref label="Sidebar chips" checked={prefs.chips} onToggle={() => togglePref("chips")} />
              </div>
            </div>
          </div>
        ) : null}

        {openList ? (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-slate-900/20" onMouseDown={() => setOpenList(null)} />
            <div
              className="absolute left-1/2 top-20 w-[720px] max-w-[calc(100vw-2rem)] -translate-x-1/2"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Card className={ui.card + " shadow-xl"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">
                      {openList === "storageGap"
                        ? "Storage Gap"
                        : openList === "dop"
                        ? "Unconfirmed DOP"
                        : openList === "collectionsAlert"
                        ? "Collections alert"
                        : "Reminders"}
                    </CardTitle>
                    {openDest ? <span className={ui.navChip}>{openDest}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className={ui.btn} onClick={() => setOpenList(null)}>
                      Close
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {openList === "storageGap" ? (
                    <>
                      <div className="text-xs text-slate-500">Orders where storage expires before estimated final delivery.</div>
                      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {storageGap.map((o) => (
                          <MiniRow
                            key={o.id}
                            title={o.orderName}
                            detail={`Storage exp ${fmtDate(o.storageExpiresAt)} • Final ${fmtDate(o.estFinalDelivery)}`}
                            onClick={() => {
                              setSectionFilter("storage");
                              setOpenList(null);
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {openList === "dop" ? (
                    <>
                      <div className="text-xs text-slate-500">Orders due within 10 days where direction of payment is still "Question".</div>
                      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {unconfirmedDop.map((o) => {
                          const d = daysUntil(o.deliveryDue);
                          const s = d === null ? "" : d === 0 ? "(today)" : `(${d}d)`;
                          return (
                            <MiniRow
                              key={o.id}
                              title={o.orderName}
                              detail={`Due ${fmtDate(o.deliveryDue)} ${s} • DOP: Question`}
                              onClick={() => {
                                setSectionFilter("billingPrep");
                                setOpenList(null);
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : null}

                  {openList === "collectionsAlert" ? (
                    <>
                      <div className="text-xs text-slate-500">
                        Orders trending toward collections due to non-payment. Reasons include non-responsive customers, delivered-not-paid, or a collection concern flag.
                      </div>
                      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                        {COLLECTION_ALERTS.map((a) => (
                          <CollectionsRow
                            key={a.id}
                            orderName={a.orderName}
                            balance={a.balance}
                            reasons={a.reasons}
                            salesRep={a.salesRep}
                            onClick={() => {
                              setSectionFilter("collections");
                              setOpenList(null);
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {openList === "reminders" ? (
                    <RemindersPanel
                      taskView={taskView}
                      hideDone={hideDone}
                      sectionFilter={sectionFilter}
                      showFilters={true}
                      onTaskViewChange={setTaskView}
                      onHideDoneChange={setHideDone}
                      onSectionFilterClear={() => setSectionFilter(null)}
                      showCreateButton={true}
                      listMaxHeight="60vh"
                      onReminderClick={(f) => {
                        setSectionFilter(f.section);
                        setOpenList(null);
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {/* Create reminder dialog is in RemindersContext (header + dashboard use it) */}
        <div className="p-4 space-y-6">
          <PerformanceSection />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {prefs.storageGap ? (
              <Card className={ui.card}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Storage Gap</CardTitle>
                    <span className={ui.navChip}>Storage</span>
                  </div>
                  {storageGap.length ? (
                    <button type="button" className={ui.pill} onClick={() => setOpenList("storageGap")}>
                      {storageGap.length}
                    </button>
                  ) : null}
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {storageGap.length === 0 ? (
                    <Empty title="None flagged" subtitle="Goal: 0 flagged" />
                  ) : (
                    <div className="space-y-2">
                      {storageGap.slice(0, 2).map((o) => (
                        <MiniRow
                          key={o.id}
                          title={o.orderName}
                          detail={`Storage exp ${fmtDate(o.storageExpiresAt)} • Final ${fmtDate(o.estFinalDelivery)}`}
                          onClick={() => setSectionFilter("storage")}
                        />
                      ))}
                      {storageGap.length > 2 ? (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-sky-700 hover:underline"
                          onClick={() => setOpenList("storageGap")}
                        >
                          View all ({storageGap.length})
                        </button>
                      ) : null}
                    </div>
                  )}
                  <HelpLine>Goal: 0 flagged. Storage expires before estimated final delivery.</HelpLine>
                </CardContent>
              </Card>
            ) : null}

            {prefs.dop ? (
              <Card className={ui.card}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Unconfirmed DOP</CardTitle>
                    <span className={ui.navChip}>Invoice Prep</span>
                  </div>
                  {unconfirmedDop.length ? (
                    <button type="button" className={ui.pill} onClick={() => setOpenList("dop")}>
                      {unconfirmedDop.length}
                    </button>
                  ) : null}
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {unconfirmedDop.length === 0 ? (
                    <Empty title="None due soon" subtitle="Goal: 0 flagged" />
                  ) : (
                    <div className="space-y-2">
                      {unconfirmedDop.slice(0, 2).map((o) => {
                        const d = daysUntil(o.deliveryDue);
                        const s = d === null ? "" : d === 0 ? "(today)" : `(${d}d)`;
                        return (
                          <MiniRow
                            key={o.id}
                            title={o.orderName}
                            detail={`Due ${fmtDate(o.deliveryDue)} ${s} • DOP: Question`}
                            onClick={() => setSectionFilter("billingPrep")}
                          />
                        );
                      })}
                      {unconfirmedDop.length > 2 ? (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-sky-700 hover:underline"
                          onClick={() => setOpenList("dop")}
                        >
                          View all ({unconfirmedDop.length})
                        </button>
                      ) : null}
                    </div>
                  )}
                  <HelpLine>Goal: 0 flagged. Due within 10 days and payer is still undecided.</HelpLine>
                </CardContent>
              </Card>
            ) : null}

            {prefs.collectionsAlert ? (
              <Card className={ui.card}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Collections alert</CardTitle>
                    <span className={ui.navChip}>Collections</span>
                  </div>
                  {COLLECTION_ALERTS.length ? (
                    <button type="button" className={ui.pill} onClick={() => setOpenList("collectionsAlert")}>
                      {COLLECTION_ALERTS.length}
                    </button>
                  ) : null}
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {COLLECTION_ALERTS.length === 0 ? (
                    <Empty title="No alerts" subtitle="Goal: 0 flagged" />
                  ) : (
                    <div className="space-y-2">
                      {COLLECTION_ALERTS.slice(0, 2).map((a) => (
                        <CollectionsRow
                          key={a.id}
                          orderName={a.orderName}
                          balance={a.balance}
                          reasons={a.reasons}
                          salesRep={a.salesRep}
                          onClick={() => setSectionFilter("collections")}
                        />
                      ))}
                      {COLLECTION_ALERTS.length > 2 ? (
                        <button
                          type="button"
                          className="text-[11px] font-semibold text-sky-700 hover:underline"
                          onClick={() => setOpenList("collectionsAlert")}
                        >
                          View all ({COLLECTION_ALERTS.length})
                        </button>
                      ) : null}
                    </div>
                  )}
                  <HelpLine>Goal: 0 flagged. Flagged by non-response, delivered-not-paid, or collection concern.</HelpLine>
                </CardContent>
              </Card>
            ) : null}

            {prefs.reminders ? (
              <Card className={ui.card}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Reminders</CardTitle>
                    <span className={sectionFilter ? ui.navChip : ui.navChipMuted}>
                      {sectionFilter ? getSectionLabel(sectionFilter) : "All sections"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCreateReminder(sectionFilter ?? undefined)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      aria-label="Add reminder"
                      title="Add reminder"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                    {reminders.length ? (
                      <button type="button" className={ui.pill} onClick={() => setOpenList("reminders")}>
                        {reminders.length}
                      </button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                      <Checkbox checked={hideDone} onCheckedChange={() => setHideDone((x) => !x)} />
                      <span className="text-[11px] font-semibold text-slate-500">Hide done</span>
                    </div>
                  </div>

                  {sectionFilter ? (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700">Filtered: {getSectionLabel(sectionFilter)}</span>
                      <button type="button" className={ui.btn} onClick={() => setSectionFilter(null)}>
                        Clear
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {reminders.length === 0 ? (
                      <Empty title="All caught up 🎉" subtitle="Click the bell above to add a reminder." />
                    ) : (
                      reminders.slice(0, 3).map((f) => (
                        <ReminderRow
                          key={f.id}
                          item={f}
                          showAssignee={taskView === "all"}
                          onClick={() => setSectionFilter(f.section)}
                          onToggleDone={() => toggleDone(f.id)}
                        />
                      ))
                    )}
                    {reminders.length > 3 ? (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-sky-700 hover:underline"
                        onClick={() => setOpenList("reminders")}
                      >
                        View all ({reminders.length})
                      </button>
                    ) : null}
                  </div>

                  <HelpLine>Open reminders across financial sections. Click a section chip to narrow.</HelpLine>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
    </AppPageLayout>
  );
}

function Pref({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-sm font-semibold text-slate-900">{label}</div>
      <Checkbox checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}

function reasonLabel(r: CollectionsAlert["reasons"][number]) {
  if (r === "nonResponsive") return "Non-responsive";
  if (r === "deliveredNotPaid") return "Delivered, not paid";
  return "Collection concern";
}

function CollectionsRow({
  orderName,
  balance,
  reasons,
  salesRep,
  onClick,
}: {
  orderName: string;
  balance: number;
  reasons: CollectionsAlert["reasons"];
  salesRep: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm hover:border-slate-300"
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-slate-900">{orderName}</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {reasons.slice(0, 2).map((r) => (
            <span key={r} className={ui.tag}>
              {reasonLabel(r)}
            </span>
          ))}
          {reasons.length > 2 ? <span className={ui.tag}>+{reasons.length - 2}</span> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <div className="text-xs font-extrabold text-slate-900">{formatMoney(balance)}</div>
          <div className="text-[10px] font-semibold text-slate-500">Balance</div>
        </div>
        <UserDot id={salesRep} size={24} />
      </div>
    </button>
  );
}

function MiniRow({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm hover:border-slate-300"
    >
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 truncate text-xs text-slate-500">{detail}</div>
      </div>
      <div className="shrink-0 text-slate-400">›</div>
    </button>
  );
}

