"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COLLECTION_ACTIVITY,
  COLLECTION_DOCS,
  COLLECTION_INVOICES,
  COLLECTION_ORDERS,
  type Activity,
} from "@/lib/collections-data";

const REP_COLOR_CLASS_MAP: Record<string, string> = {
  JC: "bg-sky-100 text-sky-700 border border-sky-200",
  DF: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  RH: "bg-amber-100 text-amber-700 border border-amber-200",
  MA: "bg-violet-100 text-violet-700 border border-violet-200",
};

function getRepBadgeClasses(rep: string) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold";
  const color = REP_COLOR_CLASS_MAP[rep] ?? "bg-slate-100 text-slate-700 border border-slate-200";
  return `${base} ${color}`;
}

function formatCurrency(v: number) {
  return v.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityIcon(type: Activity["type"]) {
  switch (type) {
    case "Email": return Mail;
    case "Call": return Phone;
    case "Text": return MessageSquare;
    default: return FileText;
  }
}

async function safeCopy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Props = {
  orderId: number | null;
  onClose: () => void;
};

export default function CollectionsOrderDrawer({ orderId, onClose }: Props) {
  const [drawerTab, setDrawerTab] = useState<"overview" | "activity" | "docs" | "invoices">("overview");
  const [drawerQ, setDrawerQ] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const order = useMemo(() => {
    if (orderId == null) return null;
    return COLLECTION_ORDERS.find((o) => o.id === orderId) ?? null;
  }, [orderId]);

  const orderInvoices = useMemo(() => {
    if (!order) return [];
    return COLLECTION_INVOICES.filter((inv) => inv.orderId === order.id && inv.balance > 0 && inv.status !== "Paid")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [order]);

  const openBalance = useMemo(() => orderInvoices.reduce((sum, inv) => sum + inv.balance, 0), [orderInvoices]);

  const activity = useMemo(() => {
    if (!order) return [];
    return COLLECTION_ACTIVITY.filter((a) => a.orderId === order.id)
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [order]);

  const docs = useMemo(() => {
    if (!order) return [];
    return COLLECTION_DOCS.filter((d) => d.orderId === order.id);
  }, [order]);

  const allInvoices = useMemo(() => {
    if (!order) return [];
    return COLLECTION_INVOICES.filter((inv) => inv.orderId === order.id)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [order]);

  const handleCopy = async (key: string, text: string) => {
    const ok = await safeCopy(text);
    if (!ok) return;
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 900);
  };

  const open = orderId != null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-xl overflow-hidden border-l border-slate-200 bg-white p-0"
      >
        {order && (
          <div className="flex h-full flex-col overflow-hidden">
            <Tabs value={drawerTab} onValueChange={(v) => setDrawerTab(v as typeof drawerTab)} className="flex h-full min-h-0 flex-col">
              <div className="border-b border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={getRepBadgeClasses(order.rep)}>{order.rep}</div>
                      <div className="min-w-0">
                        <SheetHeader className="p-0">
                          <SheetTitle className="truncate text-base font-semibold">{order.orderName}</SheetTitle>
                        </SheetHeader>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
                          <span className="font-medium text-slate-900">Order #{order.orderNumber}</span>
                          {order.claimNumber && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="truncate">Claim {order.claimNumber}</span>
                            </>
                          )}
                          {order.policyNumber && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="truncate">Policy {order.policyNumber}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy("order", order.orderNumber)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <span className="text-slate-500">Order</span>
                        <span className="text-slate-900">{order.orderNumber}</span>
                        {copiedKey === "order" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {order.claimNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy("claim", order.claimNumber!)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span className="text-slate-500">Claim</span>
                          <span className="text-slate-900">{order.claimNumber}</span>
                          {copiedKey === "claim" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                      {order.billToEmail && (
                        <button
                          type="button"
                          onClick={() => handleCopy("email", order.billToEmail!)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <span className="text-slate-500">Email</span>
                          <span className="max-w-[11rem] truncate text-slate-900">{order.billToEmail}</span>
                          {copiedKey === "email" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={onClose} aria-label="Close">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="px-5 pb-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-72">
                      <Input
                        className="h-9 pl-8 pr-8 text-xs"
                        placeholder={`Search ${drawerTab}…`}
                        value={drawerQ}
                        onChange={(e) => setDrawerQ(e.target.value)}
                      />
                      <span className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </span>
                    </div>
                    <TabsList className="h-9 w-full justify-start bg-slate-100/70 sm:w-auto">
                      <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                      <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                      <TabsTrigger value="docs" className="text-xs">Docs</TabsTrigger>
                      <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Card className="border border-slate-200 bg-white">
                      <CardContent className="p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Open balance</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(openBalance)}</div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          {orderInvoices.length} open invoice{orderInvoices.length === 1 ? "" : "s"}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-slate-200 bg-white">
                      <CardContent className="p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">Next reminder</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {order.nextFollowUpDate ? formatShortDate(order.nextFollowUpDate) : "—"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border border-slate-200 bg-white">
                  <div className="p-4">
                    <TabsContent value="overview" className="m-0">
                      <div className="space-y-4">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Next action</div>
                          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                            Call adjuster and confirm payment timing. Use Activity to reference the last touch.
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button size="sm" className="h-8 gap-2 bg-sky-700 text-white hover:bg-sky-800">
                              <Mail className="h-4 w-4" />
                              Email statement
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-2">
                              <Phone className="h-4 w-4" />
                              Call
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Text
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bill to</div>
                          <div className="truncate text-sm font-semibold text-slate-900">{order.billToCompany}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-700">
                            <span className="font-semibold">{order.billTo}</span>
                            {order.billToEmail && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="truncate">{order.billToEmail}</span>
                              </>
                            )}
                            {order.billToPhone && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="truncate">{order.billToPhone}</span>
                              </>
                            )}
                          </div>
                          {order.serviceAddress && (
                            <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-700">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              <span className="truncate">{order.serviceAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="m-0">
                      <div className="space-y-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Timeline</div>
                        {activity.length === 0 ? (
                          <div className="text-xs text-slate-500">No activity.</div>
                        ) : (
                          <div className="relative pl-6">
                            <div className="absolute left-2 top-0 h-full w-px bg-slate-200" />
                            {activity.map((a) => {
                              const Icon = activityIcon(a.type);
                              return (
                                <div key={a.id} className="relative mb-3">
                                  <div className="absolute left-[-2px] top-2 h-3 w-3 rounded-full border border-slate-200 bg-white" />
                                  <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                                      <Icon className="h-4 w-4 text-slate-700" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                                        <span className="font-semibold text-slate-700">{a.type}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{formatDateTime(a.at)}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-semibold">{a.by}</span>
                                      </div>
                                      <div className="mt-0.5 text-xs text-slate-800">{a.detail}</div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="docs" className="m-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Docs checklist</div>
                      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {docs.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500">No docs.</div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {docs.map((d) => (
                              <div key={d.id} className="flex items-center justify-between gap-3 p-3">
                                <div className="min-w-0 truncate text-xs font-semibold text-slate-900">{d.name}</div>
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                    d.status === "Received"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-amber-200 bg-amber-50 text-amber-900"
                                  }`}
                                >
                                  {d.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="invoices" className="m-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Invoice ledger</div>
                      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_120px_110px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          <div>Invoice</div>
                          <div>Type</div>
                          <div className="text-center">Due</div>
                          <div className="text-right">Balance</div>
                          <div>Status</div>
                        </div>
                        {allInvoices.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500">No invoices.</div>
                        ) : (
                          allInvoices.map((inv, idx) => (
                            <div
                              key={inv.id}
                              className={`grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_120px_110px] gap-2 px-3 py-2 text-xs ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-slate-900">{inv.invoiceNumber}</div>
                                {inv.lastNote && <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">{inv.lastNote}</div>}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-700">{inv.type}</div>
                              <div className="text-center text-[11px] text-slate-700">{formatShortDate(inv.dueDate)}</div>
                              <div className="text-right font-semibold text-slate-900">{formatCurrency(inv.balance)}</div>
                              <div className="text-[11px] text-slate-700">{inv.status}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-600">
                    {orderInvoices.length} open · <span className="font-semibold text-slate-900">{formatCurrency(openBalance)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Text
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-2">
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                    <Button size="sm" className="h-8 gap-2 bg-sky-700 text-white hover:bg-sky-800">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
