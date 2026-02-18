import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Loader2,
  Send,
  Settings as SettingsIcon,
  Trash2,
  X,
} from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import { useGlobalSearch } from "@/contexts/GlobalSearchContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ApprovalAction =
  | "Re-submit Updated Invoice"
  | "Supplemental Invoice"
  | "Take No Action"
  | "Re-submit Reject List";

const APPROVAL_ACTIONS: ApprovalAction[] = [
  "Re-submit Updated Invoice",
  "Supplemental Invoice",
  "Take No Action",
  "Re-submit Reject List",
];

type DeliveryStatus = "Not Started" | "In Progress" | "Delivered" | "On Hold";

type ReviewEvent = {
  id: number;
  type: string;
  itemNo: string;
  itemDesc: string;
  change: string;
  by: string;
  at: string;
  delta: number;
  cleared: boolean;
  saved?: boolean;
  invoiced?: boolean;
};

export type StagedLedgerAction = "invoice" | "save" | "dismiss" | "restore";

type ReviewOrder = {
  id: number;
  orderNumber: string;
  orderName: string;
  date: string;
  deliveryStatus: DeliveryStatus;
  packedPct: number;
  deliveredPct: number;
  notifyEnabled?: boolean;
  notifyWeeks?: number;
  notifySetAt?: string;
  events: ReviewEvent[];
  approved: boolean;
  approvalAction?: ApprovalAction;
};

type ReviewTriggerKey =
  | "rejectedItem"
  | "zeroValueItemChanges"
  | "priceChange"
  | "deletedItem"
  | "apuCreated"
  | "apuContainerCreated"
  | "redoCreated";

type ReviewTriggerSettings = Record<ReviewTriggerKey, boolean>;

const REVIEW_TRIGGER_DEFS: { key: ReviewTriggerKey; label: string; match: string[] }[] = [
  {
    key: "rejectedItem",
    label: "Rejected Item",
    match: ["rejecting items", "rejected item", "rejected items"],
  },
  {
    key: "zeroValueItemChanges",
    label: "Zero Value Item Changes",
    match: ["zero value item changes", "zero value item change"],
  },
  { key: "priceChange", label: "Price Change", match: ["price change"] },
  {
    key: "deletedItem",
    label: "Deleted Item",
    match: ["deleting items", "deleted item", "deleted items"],
  },
  { key: "apuCreated", label: "APU created", match: ["apu created"] },
  {
    key: "apuContainerCreated",
    label: "APU container created",
    match: ["apu container created"],
  },
  { key: "redoCreated", label: "Redo Created", match: ["redo created"] },
];

const DEFAULT_REVIEW_TRIGGER_SETTINGS: ReviewTriggerSettings = {
  rejectedItem: true,
  zeroValueItemChanges: true,
  priceChange: true,
  deletedItem: true,
  apuCreated: true,
  apuContainerCreated: true,
  redoCreated: true,
};

const SAMPLE_REVIEWS: ReviewOrder[] = [
  {
    id: 1,
    orderNumber: "1250882",
    orderName: "CasperZZ-NorthBergenNJ",
    date: "2025-11-14",
    deliveryStatus: "Delivered",
    packedPct: 100,
    deliveredPct: 100,
    approved: false,
    events: [
      {
        id: 1,
        type: "Price change",
        itemNo: "0001",
        itemDesc: "Blouse (fancy)",
        change: "Rate updated from $45/hr to $55/hr",
        by: "RH",
        at: "2025-11-13T14:12:00",
        delta: 240,
        cleared: false,
      },
      {
        id: 2,
        type: "Deleted item",
        itemNo: "0002",
        itemDesc: "Pants (tailored)",
        change: "Line item deleted",
        by: "JC",
        at: "2025-11-13T15:06:00",
        delta: -80,
        cleared: false,
      },
      {
        id: 10,
        type: "Deleted item",
        itemNo: "0007",
        itemDesc: "Dry cleaning - rush",
        change: "Duplicate line removed",
        by: "JC",
        at: "2025-11-13T15:10:00",
        delta: -120,
        cleared: false,
      },
    ],
  },
  {
    id: 2,
    orderNumber: "1250839",
    orderName: "Kaminsky-HillsboroughNJ",
    date: "2025-11-13",
    deliveryStatus: "In Progress",
    packedPct: 75,
    deliveredPct: 40,
    notifyEnabled: true,
    notifyWeeks: 2,
    notifySetAt: "2025-11-13T09:00:00",
    approved: true,
    approvalAction: "Take No Action",
    events: [
      {
        id: 3,
        type: "Rejecting items",
        itemNo: "0012",
        itemDesc: "Deodorization",
        change: "Rejected by adjuster",
        by: "DF",
        at: "2025-11-12T10:22:00",
        delta: -4500,
        cleared: false,
      },
      {
        id: 7,
        type: "Rejecting items",
        itemNo: "0015",
        itemDesc: "Air mover rental",
        change: "Rejected by adjuster",
        by: "DF",
        at: "2025-11-12T10:29:00",
        delta: -350,
        cleared: false,
      },
    ],
  },
  {
    id: 3,
    orderNumber: "1250679",
    orderName: "Winterroth-YonkersNY",
    date: "2025-11-12",
    deliveryStatus: "On Hold",
    packedPct: 55,
    deliveredPct: 25,
    approved: false,
    events: [
      {
        id: 4,
        type: "Deleted item",
        itemNo: "0003",
        itemDesc: "Equipment charges",
        change: "Duplicate equipment lines removed",
        by: "RH",
        at: "2025-11-11T09:05:00",
        delta: -1250,
        cleared: false,
      },
      {
        id: 5,
        type: "Price change",
        itemNo: "0009",
        itemDesc: "Contents cleaning",
        change: "Adjusted cleaning rate",
        by: "JC",
        at: "2025-11-11T09:42:00",
        delta: 300,
        cleared: false,
      },
      {
        id: 8,
        type: "Price change",
        itemNo: "0010",
        itemDesc: "Material markup",
        change: "Markup changed from 10% to 15%",
        by: "JC",
        at: "2025-11-11T09:50:00",
        delta: 180,
        cleared: false,
      },
    ],
  },
];

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
const signedMoney = (n: number) => (n === 0 ? money(0) : `${n > 0 ? "+" : "-"}${money(Math.abs(n))}`);
const clampPct = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0);

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};

const enabledEvent = (type: string, s: ReviewTriggerSettings) => {
  const t = type.trim().toLowerCase();
  for (const def of REVIEW_TRIGGER_DEFS) {
    if (def.match.some((m) => t === m || t.includes(m))) return Boolean(s[def.key]);
  }
  return true;
};

const visibleEvents = (o: ReviewOrder, s: ReviewTriggerSettings) =>
  o.events.filter((e) => !e.cleared && !e.saved && !e.invoiced && enabledEvent(e.type, s));

const sumDelta = (events: ReviewEvent[]) => events.reduce((a, e) => a + e.delta, 0);

const groupByType = (events: ReviewEvent[]) =>
  events.reduce<Record<string, ReviewEvent[]>>((acc, ev) => {
    (acc[ev.type] ??= []).push(ev);
    return acc;
  }, {});

const reasonFromEvents = (events: ReviewEvent[]) => {
  if (events.length === 0) return "—";
  const uniqueTypes = new Set(events.map((e) => e.type));
  return uniqueTypes.size === 1 ? events[0].type : `${uniqueTypes.size} reasons`;
};

const notifyState = (o: ReviewOrder) => {
  if (!o.notifyEnabled || !o.notifySetAt || !o.notifyWeeks) {
    return { configured: false, silenced: false, deadline: null as Date | null };
  }
  const base = new Date(o.notifySetAt);
  const deadline = new Date(base.getTime() + o.notifyWeeks * 7 * 24 * 60 * 60 * 1000);
  const silenced = o.packedPct < 100 && Date.now() < deadline.getTime();
  return { configured: true, silenced, deadline };
};

function PctBadge({ pct, title }: { pct: number; title: string }) {
  const p = clampPct(pct);
  const ring = p >= 100 ? "border-emerald-500" : "border-sky-600";
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${ring}`}
      title={`${title} ${p}%`}
      aria-label={`${title} ${p}%`}
    >
      <span className="text-[9px] font-semibold tabular-nums text-slate-800">{p}%</span>
    </div>
  );
}

function DeliveryPill({ status }: { status: DeliveryStatus }) {
  const cls =
    status === "Delivered"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "In Progress"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : status === "On Hold"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function ProgressPill({ label, pct }: { label: string; pct: number }) {
  const p = clampPct(pct);
  const cls =
    p >= 100
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-sky-200 bg-sky-50 text-sky-800";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}
      title={`${label} ${p}%`}
      aria-label={`${label} ${p}%`}
    >
      {label} {p}%
    </span>
  );
}

type SubmitProgress = { total: number; done: number; amount: number };

function TriggerSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReviewTriggerSettings;
  onChange: (next: ReviewTriggerSettings) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invoice Review triggers</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="text-[11px] text-slate-500">
            Turn review triggers on or off. Disabled triggers will not surface invoice reviews for those events.
          </div>
          <div className="space-y-2">
            {REVIEW_TRIGGER_DEFS.map((t) => (
              <div
                key={t.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="text-[11px] font-medium text-slate-800">{t.label}</div>
                <Checkbox
                  checked={Boolean(settings[t.key])}
                  onCheckedChange={(v) => onChange({ ...settings, [t.key]: v === true })}
                  className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => onChange({ ...DEFAULT_REVIEW_TRIGGER_SETTINGS })}>
              Reset
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  order,
  focus,
  selectionCount,
  approvalAction,
  onApprovalAction,
  notifyWeeks,
  onNotifyWeeks,
  onApprove,
  onToggleSnooze,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ReviewOrder | null;
  focus: "approve" | "snooze";
  selectionCount: number;
  approvalAction: ApprovalAction;
  onApprovalAction: (a: ApprovalAction) => void;
  notifyWeeks: number;
  onNotifyWeeks: (n: number) => void;
  onApprove: () => void;
  onToggleSnooze: () => void;
}) {
  const ns = order ? notifyState(order) : { configured: false, silenced: false, deadline: null as Date | null };

  const ApproveSection = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-slate-800">Approve</div>
        {selectionCount > 1 ? (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            {selectionCount} selected
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">Choose what happens when approving.</div>
      <div className="mt-2">
        <select
          value={approvalAction}
          onChange={(e) => onApprovalAction(e.target.value as ApprovalAction)}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {APPROVAL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button size="sm" onClick={onApprove}>
          Approve
        </Button>
      </div>
    </div>
  );

  const SnoozeSection = (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold text-slate-800">Snooze notifications</div>
        {ns.configured ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            <BellOff className="h-3 w-3" />
            {ns.silenced ? "Snoozed" : "Set"}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Optional</span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">
        Silence notifications until fully packed or the selected number of weeks, whichever comes sooner.
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[11px] text-slate-600">Max</span>
        <select
          value={String(notifyWeeks)}
          onChange={(e) => onNotifyWeeks(Number(e.target.value))}
          className="h-9 w-32 rounded-md border border-slate-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          {[1, 2, 3, 4, 6, 8].map((w) => (
            <option key={w} value={String(w)}>
              {w} week{w === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        <Button
          variant={ns.configured ? "default" : "outline"}
          size="sm"
          className={ns.configured ? "gap-1 bg-sky-600 text-white hover:bg-sky-700" : "gap-1"}
          onClick={onToggleSnooze}
          disabled={!order}
        >
          {ns.configured ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          {ns.configured ? "Unsnooze" : "Snooze"}
        </Button>
      </div>
      {ns.configured && ns.deadline ? (
        <div className="mt-2 rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600">
          {ns.silenced ? "Snoozed until fully packed or " : "Snooze ends on "}
          {ns.deadline.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          .
        </div>
      ) : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invoice review actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          {order ? (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="truncate text-[11px] font-semibold text-slate-900">{order.orderName}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span>#{order.orderNumber}</span>
                <ProgressPill label="Packed" pct={order.packedPct} />
                <ProgressPill label="Delivered" pct={order.deliveredPct} />
                {!(order.deliveryStatus === "Delivered" && clampPct(order.deliveredPct) === 100) ? (
                  <DeliveryPill status={order.deliveryStatus} />
                ) : null}
              </div>
            </div>
          ) : null}
          {focus === "approve" ? ApproveSection : SnoozeSection}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmClearOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ReviewOrder | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clear order?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="truncate text-[11px] font-semibold text-slate-900">{order?.orderName ?? "Order"}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">#{order?.orderNumber ?? "—"}</div>
          </div>
          <div className="text-[11px] text-slate-600">This removes the order from Invoice Review.</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
              Clear order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmClearAllDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clear all?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-900">{count} order{count === 1 ? "" : "s"}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">This removes all orders from Invoice Review.</div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
              Clear all
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QueueView({
  orders,
  triggerSettings,
  selectedId,
  onSelect,
  selectedForSubmit,
  onToggleSelected,
  onToggleAll,
  onOpenSnooze,
  onClearOrder,
}: {
  orders: ReviewOrder[];
  triggerSettings: ReviewTriggerSettings;
  selectedId: number | null;
  onSelect: (id: number) => void;
  selectedForSubmit: Record<number, boolean>;
  onToggleSelected: (orderId: number, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onOpenSnooze: (orderId: number) => void;
  onClearOrder: (orderId: number) => void;
}) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl">🎉</div>
          <div className="mt-4 text-lg font-medium text-slate-800">No pending invoice reviews</div>
          <div className="mt-2 text-sm text-slate-500">All clear! You're all caught up.</div>
        </CardContent>
      </Card>
    );
  }

  const selectedCount = orders.reduce((acc, o) => acc + (selectedForSubmit[o.id] ? 1 : 0), 0);
  const selectAllState: boolean | "indeterminate" =
    selectedCount === 0 ? false : selectedCount === orders.length ? true : "indeterminate";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review Queue ({orders.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full table-fixed divide-y divide-slate-200">
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[52px]" />
                <col className="w-[130px]" />
                <col className="w-[86px]" />
                <col className="w-[58px]" />
                <col className="w-[58px]" />
                <col className="w-[86px]" />
                <col className="w-[56px]" />
                <col className="w-[52px]" />
                <col className="w-[52px]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2 text-center">Evts</th>
                  <th className="px-2 py-2">Reason</th>
                  <th className="px-2 py-2 text-center">Status</th>
                  <th className="px-2 py-2 text-center">Pack</th>
                  <th className="px-2 py-2 text-center">Del</th>
                  <th className="px-2 py-2 whitespace-nowrap text-right">+/-</th>
                  <th className="px-2 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Checkbox
                        checked={selectAllState}
                        onCheckedChange={(v) => onToggleAll(v === true)}
                        className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white data-[state=indeterminate]:bg-sky-700 data-[state=indeterminate]:border-sky-700 data-[state=indeterminate]:text-white"
                        aria-label="Select all"
                      />
                    </div>
                  </th>
                  <th className="px-2 py-2 text-center">Sno</th>
                  <th className="px-2 py-2 text-center">Clr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {orders.map((o) => {
                  const events = visibleEvents(o, triggerSettings);
                  const total = sumDelta(events);
                  const ns = notifyState(o);
                  const isSelected = selectedId === o.id;

                  return (
                    <tr
                      key={o.id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`}
                      onClick={() => onSelect(o.id)}
                    >
                      <td className="px-2 py-2">
                        <div className="truncate text-[12px] font-medium text-slate-900">{o.orderName}</div>
                        <div className="truncate text-[11px] text-slate-500">#{o.orderNumber}</div>
                      </td>
                      <td className="px-2 py-2 text-center font-semibold tabular-nums">{events.length}</td>
                      <td className="px-2 py-2">
                        <div className="truncate text-[12px] font-medium text-slate-800">{reasonFromEvents(events)}</div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-center">
                          <DeliveryPill status={o.deliveryStatus} />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-center">
                          <PctBadge pct={o.packedPct} title="Packed" />
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-center">
                          <PctBadge pct={o.deliveredPct} title="Delivered" />
                        </div>
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold tabular-nums ${
                          total > 0 ? "text-sky-700" : total < 0 ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {signedMoney(total)}
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={Boolean(selectedForSubmit[o.id])}
                            onCheckedChange={(v) => onToggleSelected(o.id, v === true)}
                            className="border-sky-700 data-[state=checked]:bg-sky-700 data-[state=checked]:border-sky-700 data-[state=checked]:text-white"
                            aria-label={`Select ${o.orderName}`}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${ns.silenced ? "bg-sky-100 text-sky-700" : "text-slate-600"}`}
                            onClick={() => onOpenSnooze(o.id)}
                            aria-label={ns.silenced ? "Unsnooze" : "Snooze"}
                          >
                            {ns.silenced ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                            onClick={() => onClearOrder(o.id)}
                            aria-label="Clear order"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-2 text-center text-xs text-slate-500 md:hidden">
          ← Swipe to see more columns →
        </div>
      </CardContent>
    </Card>
  );
}

function SelectedOrderView({
  order,
  triggerSettings,
  onClose,
  onApplyStagedActions,
  onClearOrder,
  onOpenSnooze,
}: {
  order: ReviewOrder;
  triggerSettings: ReviewTriggerSettings;
  onClose: () => void;
  onApplyStagedActions: (orderId: number, actions: Record<number, StagedLedgerAction | undefined>) => void;
  onClearOrder: (orderId: number) => void;
  onOpenSnooze: (orderId: number) => void;
}) {
  const ev = useMemo(() => visibleEvents(order, triggerSettings), [order, triggerSettings]);
  const totalDelta = useMemo(() => sumDelta(ev), [ev]);
  const groups = useMemo(() => groupByType(ev), [ev]);
  const keys = useMemo(() => Object.keys(groups), [groups]);

  const savedEvents = useMemo(() => order.events.filter((e) => !e.cleared && Boolean(e.saved)), [order.events]);
  const invoicedEvents = useMemo(() => order.events.filter((e) => !e.cleared && Boolean(e.invoiced)), [order.events]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [showInvoiced, setShowInvoiced] = useState(false);

  const [staged, setStaged] = useState<Record<number, StagedLedgerAction | undefined>>({});

  const stagedCount = useMemo(() => Object.values(staged).filter(Boolean).length, [staged]);
  const canSubmitActions = stagedCount > 0;

  useEffect(() => {
    setCollapsed(() => {
      if (keys.length <= 1) return {};
      return keys.reduce<Record<string, boolean>>((acc, k) => {
        acc[k] = true;
        return acc;
      }, {});
    });
  }, [order.id, keys.length]);

  useEffect(() => {
    setShowSaved(false);
    setShowInvoiced(false);
    setStaged({});
  }, [order.id]);

  const ns = notifyState(order);
  const actionBtn = "h-8 w-8 p-0 rounded-lg border shadow-sm flex items-center justify-center shrink-0";

  const pillClass = (active: boolean, tone: "sky" | "slate" | "red" | "amber" = "slate") => {
    if (!active)
      return "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900";

    if (tone === "red") return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
    if (tone === "sky") return "border-sky-200 bg-sky-100 text-sky-800 hover:bg-sky-200/60";
    if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70";
    return "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200/60";
  };

  const toggleStaged = (eventId: number, action: StagedLedgerAction) => {
    setStaged((prev) => {
      const current = prev[eventId];
      const next = { ...prev };
      if (current === action) delete next[eventId];
      else next[eventId] = action;
      return next;
    });
  };

  const stageGroupDismiss = (groupEvents: ReviewEvent[]) => {
    const ids = groupEvents.map((e) => e.id);
    setStaged((prev) => {
      const allDismissed = ids.length > 0 && ids.every((id) => prev[id] === "dismiss");
      const next = { ...prev };
      if (allDismissed) {
        ids.forEach((id) => delete next[id]);
        return next;
      }
      ids.forEach((id) => {
        next[id] = "dismiss";
      });
      return next;
    });
  };

  const submitActions = () => {
    if (!canSubmitActions) return;
    onApplyStagedActions(order.id, staged);
    setStaged({});
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClose();
          }
        }}
        className="w-full rounded-xl border bg-white px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">{order.orderName}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span>#{order.orderNumber}</span>
              <ProgressPill label="Packed" pct={order.packedPct} />
              <ProgressPill label="Delivered" pct={order.deliveredPct} />
              {!(order.deliveryStatus === "Delivered" && clampPct(order.deliveredPct) === 100) ? (
                <DeliveryPill status={order.deliveryStatus} />
              ) : null}
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenSnooze(order.id);
                }}
              >
                {ns.silenced ? <BellOff className="mr-1 h-3.5 w-3.5" /> : <Bell className="mr-1 h-3.5 w-3.5" />}
                {ns.silenced ? "Unsnooze" : "Snooze"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[10px] border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearOrder(order.id);
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Clear order
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-base font-semibold ${
                totalDelta > 0 ? "text-sky-700" : totalDelta < 0 ? "text-red-600" : "text-slate-700"
              }`}
            >
              {signedMoney(totalDelta)}
            </div>
            <div className="text-[11px] text-slate-500">Net change</div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Review ledger</CardTitle>
            {savedEvents.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-[11px] ${showSaved ? "bg-slate-100 text-slate-900" : "text-slate-600"}`}
                onClick={() => setShowSaved((v) => !v)}
              >
                Saved ({savedEvents.length})
              </Button>
            ) : null}
            {invoicedEvents.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-[11px] ${
                  showInvoiced ? "bg-slate-100 text-slate-900" : "text-slate-600"
                }`}
                onClick={() => setShowInvoiced((v) => !v)}
              >
                Invoiced ({invoicedEvents.length})
              </Button>
            ) : null}
            {stagedCount > 0 ? (
              <span className="ml-1 inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                {stagedCount} staged
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 gap-1 bg-sky-700 text-white hover:bg-sky-800 disabled:pointer-events-none disabled:opacity-60"
              onClick={submitActions}
              disabled={!canSubmitActions}
              title={canSubmitActions ? "Submit staged actions" : "Select actions below first"}
            >
              <Send className="h-3.5 w-3.5" />
              <span className="text-[11px]">Submit</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-[160px_minmax(0,1fr)_120px_118px] border-b border-sky-300 bg-sky-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
            <div>Item</div>
            <div>Detail</div>
            <div className="text-right">Invoice +/-</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-sky-200">
            {keys.map((k) => {
              const ge = groups[k] ?? [];
              const gd = sumDelta(ge);
              const gdClass = gd > 0 ? "text-sky-700" : gd < 0 ? "text-red-600" : "text-slate-700";
              const isCollapsed = Boolean(collapsed[k]);
              const groupAllDismiss = ge.length > 0 && ge.every((e) => staged[e.id] === "dismiss");

              return (
                <div key={k}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="grid w-full grid-cols-[160px_minmax(0,1fr)_120px_118px] items-center gap-2 border-b border-sky-200 bg-sky-100 px-3 py-2 hover:bg-sky-50"
                    onClick={() => setCollapsed((p) => ({ ...p, [k]: !Boolean(p[k]) }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setCollapsed((p) => ({ ...p, [k]: !Boolean(p[k]) }));
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-sky-700" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-sky-700" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-sky-900">{k}</div>
                        <div className="text-[11px] text-sky-900/70">
                          {ge.length} event{ge.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <div />
                    <div className={`text-right text-sm font-semibold ${gdClass}`}>{signedMoney(gd)}</div>
                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${actionBtn} ${pillClass(groupAllDismiss, "red")}`}
                        onClick={() => stageGroupDismiss(ge)}
                        aria-label="Stage dismiss group"
                        title={groupAllDismiss ? "Unstage" : "Stage dismiss"}
                      >
                        <X className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                      </Button>
                    </div>
                  </div>

                  {!isCollapsed
                    ? ge.map((evt) => {
                        const invActive = staged[evt.id] === "invoice";
                        const saveActive = staged[evt.id] === "save";
                        const disActive = staged[evt.id] === "dismiss";

                        return (
                          <div
                            key={evt.id}
                            className={`grid grid-cols-[160px_minmax(0,1fr)_120px_118px] items-start gap-2 border-b border-sky-200 bg-sky-50 px-3 py-1.5 ${
                              invActive || saveActive || disActive ? "ring-1 ring-slate-200" : ""
                            }`}
                          >
                            <div className="text-[11px]">
                              <div className="tabular-nums font-semibold text-slate-700">{evt.itemNo}</div>
                              <div className="truncate text-[10px] text-slate-500">{evt.itemDesc}</div>
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{evt.change}</div>
                              <div className="text-[10px] text-slate-500">
                                {evt.by} • {when(evt.at)}
                              </div>
                            </div>
                            <div className="tabular-nums text-right text-sm font-semibold">{signedMoney(evt.delta)}</div>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${actionBtn} ${pillClass(invActive, "sky")}`}
                                onClick={() => toggleStaged(evt.id, "invoice")}
                                aria-label="Stage invoice add/subtract"
                                title="Invoice"
                              >
                                <Send className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${actionBtn} ${pillClass(saveActive, "amber")}`}
                                onClick={() => toggleStaged(evt.id, "save")}
                                aria-label="Stage save for later"
                                title="Save for later"
                              >
                                <Bookmark className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`${actionBtn} ${pillClass(disActive, "red")}`}
                                onClick={() => toggleStaged(evt.id, "dismiss")}
                                aria-label="Stage dismiss"
                                title="Dismiss"
                              >
                                <X className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    : null}
                </div>
              );
            })}
          </div>

          {showSaved && savedEvents.length > 0 ? (
            <div className="border-t border-slate-200">
              <div className="grid grid-cols-[160px_minmax(0,1fr)_120px_118px] bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                <div>Saved for later</div>
                <div />
                <div />
                <div />
              </div>
              <div className="divide-y divide-slate-200">
                {savedEvents.map((evt) => {
                  const invActive = staged[evt.id] === "invoice";
                  const restoreActive = staged[evt.id] === "restore";
                  const disActive = staged[evt.id] === "dismiss";

                  return (
                    <div
                      key={`saved-${evt.id}`}
                      className="grid grid-cols-[160px_minmax(0,1fr)_120px_118px] items-start gap-2 bg-white px-3 py-1.5"
                    >
                      <div className="text-[11px] opacity-75">
                        <div className="tabular-nums font-semibold text-slate-700 line-through">{evt.itemNo}</div>
                        <div className="truncate text-[10px] text-slate-500 line-through">{evt.itemDesc}</div>
                      </div>
                      <div className="opacity-75">
                        <div className="font-medium text-slate-800 line-through">{evt.change}</div>
                        <div className="text-[10px] text-slate-500">
                          {evt.by} • {when(evt.at)}
                        </div>
                      </div>
                      <div className="tabular-nums text-right text-sm font-semibold opacity-75 line-through">
                        {signedMoney(evt.delta)}
                      </div>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${actionBtn} ${pillClass(invActive, "sky")}`}
                          onClick={() => toggleStaged(evt.id, "invoice")}
                          aria-label="Stage invoice"
                          title="Invoice"
                        >
                          <Send className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${actionBtn} ${pillClass(restoreActive, "slate")}`}
                          onClick={() => toggleStaged(evt.id, "restore")}
                          aria-label="Stage restore"
                          title="Restore"
                        >
                          <BookmarkCheck className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${actionBtn} ${pillClass(disActive, "red")}`}
                          onClick={() => toggleStaged(evt.id, "dismiss")}
                          aria-label="Stage dismiss"
                          title="Dismiss"
                        >
                          <X className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {showInvoiced && invoicedEvents.length > 0 ? (
            <div className="border-t border-slate-200">
              <div className="grid grid-cols-[160px_minmax(0,1fr)_120px_118px] bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                <div>Invoiced</div>
                <div />
                <div />
                <div />
              </div>
              <div className="divide-y divide-slate-200">
                {invoicedEvents.map((evt) => {
                  const disActive = staged[evt.id] === "dismiss";
                  return (
                    <div
                      key={`inv-${evt.id}`}
                      className="grid grid-cols-[160px_minmax(0,1fr)_120px_118px] items-start gap-2 bg-white px-3 py-1.5"
                    >
                      <div className="text-[11px] opacity-75">
                        <div className="tabular-nums font-semibold text-slate-700 line-through">{evt.itemNo}</div>
                        <div className="truncate text-[10px] text-slate-500 line-through">{evt.itemDesc}</div>
                      </div>
                      <div className="opacity-75">
                        <div className="font-medium text-slate-800 line-through">{evt.change}</div>
                        <div className="text-[10px] text-slate-500">
                          {evt.by} • {when(evt.at)}
                        </div>
                      </div>
                      <div className="tabular-nums text-right text-sm font-semibold opacity-75 line-through">
                        {signedMoney(evt.delta)}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${actionBtn} ${pillClass(disActive, "red")}`}
                          onClick={() => toggleStaged(evt.id, "dismiss")}
                          aria-label="Stage dismiss"
                          title="Dismiss"
                        >
                          <X className="h-5 w-5 shrink-0 text-current" strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

export function applyStagedActionsToEvents(
  events: ReviewEvent[],
  staged: Record<number, StagedLedgerAction | undefined>
): ReviewEvent[] {
  if (!staged || Object.keys(staged).length === 0) return events;

  return events.map((e) => {
    if (e.cleared) return e;

    const a = staged[e.id];
    if (!a) return e;

    if (a === "invoice") {
      return { ...e, invoiced: true, saved: false };
    }

    if (a === "save") {
      return { ...e, saved: true, invoiced: false };
    }

    if (a === "restore") {
      return { ...e, saved: false, invoiced: false };
    }

    if (a === "dismiss") {
      return { ...e, cleared: true, saved: false, invoiced: false };
    }

    return e;
  });
}

export default function InvoiceReviewApp() {
  const timersRef = useRef<number[]>([]);

  const [items, setItems] = useState<ReviewOrder[]>(SAMPLE_REVIEWS);
  const { query: searchTerm } = useGlobalSearch();
  const [triggerSettings, setTriggerSettings] = useState<ReviewTriggerSettings>({
    ...DEFAULT_REVIEW_TRIGGER_SETTINGS,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [selectedForSubmit, setSelectedForSubmit] = useState<Record<number, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFocus, setDialogFocus] = useState<"approve" | "snooze">("approve");
  const [dialogIds, setDialogIds] = useState<number[]>([]);

  const [approvalAction, setApprovalAction] = useState<ApprovalAction>("Re-submit Updated Invoice");
  const [notifyWeeks, setNotifyWeeks] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<SubmitProgress | null>(null);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);

  const normalized = searchTerm.trim().toLowerCase();

  const queue = useMemo(() => {
    const base = items.filter((o) => visibleEvents(o, triggerSettings).length > 0 && !o.approved);
    if (!normalized) return base;
    return base.filter((o) => {
      const ev = visibleEvents(o, triggerSettings);
      const hay = `${o.orderNumber} ${o.orderName} ${o.date} ${o.deliveryStatus} ${o.approvalAction ?? ""} ${ev
        .map((e) => `${e.type} ${e.itemNo} ${e.itemDesc} ${e.change} ${e.by}`)
        .join(" ")}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [items, normalized, triggerSettings]);

  const sortedQueue = useMemo(
    () => [...queue].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [queue]
  );

  const selectedOrder = useMemo(
    () => (selectedId == null ? null : items.find((o) => o.id === selectedId) ?? null),
    [items, selectedId]
  );

  const selectedSubmitIds = useMemo(
    () => sortedQueue.filter((o) => selectedForSubmit[o.id]).map((o) => o.id),
    [sortedQueue, selectedForSubmit]
  );

  const selectedSubmitCount = selectedSubmitIds.length;
  const canSubmit = selectedSubmitCount > 0 && !isSubmitting;

  const dialogOrder = useMemo(() => {
    if (dialogIds.length !== 1) return null;
    return items.find((o) => o.id === dialogIds[0]) ?? null;
  }, [items, dialogIds]);

  const confirmOrder = useMemo(
    () => (confirmOrderId == null ? null : items.find((o) => o.id === confirmOrderId) ?? null),
    [items, confirmOrderId]
  );

  useEffect(() => {
    if (selectedId == null) return;
    if (!selectedOrder || visibleEvents(selectedOrder, triggerSettings).length === 0 || selectedOrder.approved) {
      setSelectedId(null);
    }
  }, [selectedId, selectedOrder, triggerSettings]);

  useEffect(() => {
    setSelectedForSubmit((prev) => {
      const next: Record<number, boolean> = {};
      for (const o of sortedQueue) {
        if (prev[o.id]) next[o.id] = true;
      }
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && prevKeys.every((k) => next[Number(k)])) return prev;
      return next;
    });
  }, [sortedQueue]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  const openApproveSelected = () => {
    if (selectedSubmitIds.length === 0) return;
    setDialogFocus("approve");
    setDialogIds(selectedSubmitIds);
    setDialogOpen(true);
  };

  const openSnooze = (orderId: number) => {
    const o = items.find((x) => x.id === orderId);
    setNotifyWeeks(o?.notifyWeeks ?? 2);
    setDialogFocus("snooze");
    setDialogIds([orderId]);
    setDialogOpen(true);
  };

  const approveFromDialog = () => {
    if (dialogFocus !== "approve") return;
    const ids = [...dialogIds];
    if (ids.length === 0) return;

    setDialogOpen(false);
    setSelectedForSubmit({});

    const amount = ids.reduce((acc, id) => {
      const o = items.find((x) => x.id === id);
      if (!o) return acc;
      const events = visibleEvents(o, triggerSettings);
      return acc + sumDelta(events);
    }, 0);

    setIsSubmitting(true);
    setSubmitProgress({ total: ids.length, done: 0, amount });

    const base = 140;
    const stagger = 95;

    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];

    ids.forEach((id, idx) => {
      const startDelay = base + idx * stagger;
      const t = window.setTimeout(() => {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, approved: true, approvalAction } : o)));
        setSubmitProgress((p) => (p ? { ...p, done: Math.min(p.done + 1, p.total) } : p));
      }, startDelay);
      timersRef.current.push(t);
    });

    const endDelay = base + ids.length * stagger + 220;

    timersRef.current.push(
      window.setTimeout(() => {
        setIsSubmitting(false);
      }, endDelay)
    );

    timersRef.current.push(
      window.setTimeout(() => {
        setSubmitProgress(null);
      }, endDelay + 1400)
    );
  };

  const toggleSnooze = () => {
    if (dialogFocus !== "snooze") return;
    const id = dialogIds[0];
    if (id == null) return;
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const configured = Boolean(o.notifyEnabled && o.notifySetAt && o.notifyWeeks);
        if (configured) return { ...o, notifyEnabled: false, notifyWeeks: undefined, notifySetAt: undefined };
        return { ...o, notifyEnabled: true, notifyWeeks, notifySetAt: now };
      })
    );
  };

  const applyStagedActionsToOrder = (orderId: number, actions: Record<number, StagedLedgerAction | undefined>) => {
    setItems((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return { ...o, events: applyStagedActionsToEvents(o.events, actions) };
      })
    );
  };

  const doClearOrder = (orderId: number) => {
    setItems((prev) => prev.filter((o) => o.id !== orderId));
    setSelectedId((v) => (v === orderId ? null : v));
    setSelectedForSubmit((prev) => {
      if (!prev[orderId]) return prev;
      const next = { ...prev };
      delete next[orderId];
      return next;
    });
    if (dialogIds.includes(orderId)) {
      setDialogOpen(false);
      setDialogIds([]);
    }
  };

  const requestClearOrder = (orderId: number) => {
    setConfirmOrderId(orderId);
    setConfirmClearOpen(true);
  };

  const requestClearAll = () => {
    setConfirmClearAllOpen(true);
  };

  const confirmClearOrder = () => {
    if (confirmOrderId == null) return;
    doClearOrder(confirmOrderId);
    setConfirmClearOpen(false);
    setConfirmOrderId(null);
  };

  const clearAll = () => {
    setItems([]);
    setSelectedId(null);
    setSelectedForSubmit({});
    setDialogOpen(false);
    setDialogIds([]);
    setConfirmClearOpen(false);
    setConfirmOrderId(null);
    setConfirmClearAllOpen(false);
  };

  const toggleSelected = (orderId: number, selected: boolean) => {
    setSelectedForSubmit((prev) => {
      const next = { ...prev };
      if (selected) next[orderId] = true;
      else delete next[orderId];
      return next;
    });
  };

  const toggleAll = (selected: boolean) => {
    if (!selected) {
      setSelectedForSubmit({});
      return;
    }
    const next: Record<number, boolean> = {};
    sortedQueue.forEach((o) => {
      next[o.id] = true;
    });
    setSelectedForSubmit(next);
  };

  return (
    <AppPageLayout icon={FileCheck} title="Invoice Review" maxWidth="max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
            onClick={() => setSettingsOpen(true)}
            title="Invoice Review triggers"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1 bg-sky-700 text-white hover:bg-sky-800 disabled:pointer-events-none disabled:opacity-60 text-xs"
            onClick={openApproveSelected}
            disabled={!canSubmit}
            title={selectedSubmitCount > 0 ? `Submit ${selectedSubmitCount} selected` : "Select orders to submit"}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Submit selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs"
            onClick={requestClearAll}
            disabled={items.length === 0}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">
            Select actions on line items, then Submit (safety check). Orders leave Invoice Review once all pending
            items are resolved.
          </div>
          {selectedSubmitCount > 0 ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
              <span>{selectedSubmitCount} selected</span>
              <button
                type="button"
                className="text-sky-700 hover:text-sky-900"
                onClick={() => setSelectedForSubmit({})}
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </div>

          {submitProgress ? (
            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-700" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-sky-700" />
                )}
                <div className="flex-1">
                  {isSubmitting
                    ? `Approving ${submitProgress.done}/${submitProgress.total} (${formatCurrency(submitProgress.amount)})…`
                    : `Approved ${submitProgress.total} (${formatCurrency(submitProgress.amount)})`}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-100">
                    <div
                      className="h-full bg-sky-700 transition-[width] duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          submitProgress.total === 0
                            ? 0
                            : Math.round((submitProgress.done / submitProgress.total) * 1000) / 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {sortedQueue.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <p className="text-lg font-medium text-slate-800">No pending reviews</p>
              <p className="mt-1 text-sm text-slate-500">You're all caught up!</p>
            </Card>
          ) : selectedOrder ? (
            <SelectedOrderView
              order={selectedOrder}
              triggerSettings={triggerSettings}
              onClose={() => setSelectedId(null)}
              onApplyStagedActions={applyStagedActionsToOrder}
              onClearOrder={requestClearOrder}
              onOpenSnooze={openSnooze}
            />
          ) : (
            <QueueView
              orders={sortedQueue}
              triggerSettings={triggerSettings}
              selectedId={selectedId}
              onSelect={setSelectedId}
              selectedForSubmit={selectedForSubmit}
              onToggleSelected={toggleSelected}
              onToggleAll={toggleAll}
              onOpenSnooze={openSnooze}
              onClearOrder={requestClearOrder}
            />
          )}

      <TriggerSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={triggerSettings}
        onChange={setTriggerSettings}
      />

      <ActionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setDialogIds([]);
          }
        }}
        order={dialogFocus === "snooze" ? dialogOrder : dialogIds.length === 1 ? dialogOrder : null}
        focus={dialogFocus}
        selectionCount={dialogFocus === "approve" ? dialogIds.length : 1}
        approvalAction={approvalAction}
        onApprovalAction={setApprovalAction}
        notifyWeeks={notifyWeeks}
        onNotifyWeeks={setNotifyWeeks}
        onApprove={approveFromDialog}
        onToggleSnooze={toggleSnooze}
      />

      <ConfirmClearOrderDialog
        open={confirmClearOpen}
        onOpenChange={(open) => {
          setConfirmClearOpen(open);
          if (!open) setConfirmOrderId(null);
        }}
        order={confirmOrder}
        onConfirm={confirmClearOrder}
      />

      <ConfirmClearAllDialog
        open={confirmClearAllOpen}
        onOpenChange={(open) => setConfirmClearAllOpen(open)}
        count={items.length}
        onConfirm={clearAll}
      />
    </AppPageLayout>
  );
}
