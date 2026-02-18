# Source Code (Single File Shell Suite)

Paste this into `src/App.tsx` (or your chosen entry file). Assumes:
- `react-router-dom`
- `lucide-react`
- shadcn/ui components available at `@/components/ui/*`

```tsx
// App.tsx
// Drop this into src/App.tsx (or wherever your app entry is) and run.
// This is a single-file "shell suite" for:
// - Dashboard Shell
// - Invoice Review
// - Transactions
// - Services

import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  Download,
  ExternalLink,
  CalendarDays,
  AlertTriangle,
  BadgeDollarSign,
  PackageSearch,
  ClipboardCheck,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

// shadcn/ui (adjust paths if your repo differs)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ---------------------------------- utils --------------------------------- */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

type DateView = "day" | "week" | "month" | "ytd";

type Rep = {
  id: string;
  name: string;
  initials: string;
  colorClass: string; // tailwind bg-* class
};

const REPS: Rep[] = [
  { id: "r1", name: "Ava Kim", initials: "AK", colorClass: "bg-rose-500" },
  { id: "r2", name: "Noah Patel", initials: "NP", colorClass: "bg-sky-500" },
  {
    id: "r3",
    name: "Mia Rivera",
    initials: "MR",
    colorClass: "bg-emerald-500",
  },
  {
    id: "r4",
    name: "Leo Chen",
    initials: "LC",
    colorClass: "bg-violet-500",
  },
];

function RepAvatar({ repId, size = "md" }: { repId: string; size?: "sm" | "md" }) {
  const rep = REPS.find((r) => r.id === repId) ?? REPS[0];
  const s = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold shadow-sm",
        s,
        rep.colorClass
      )}
      title={rep.name}
      aria-label={rep.name}
    >
      {rep.initials}
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-2xl font-semibold tracking-tight">{title}</div>
        {subtitle ? (
          <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

/* -------------------------------- app shell -------------------------------- */

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    to: "/invoice-review",
    label: "Invoice Review",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: <ArrowLeftRight className="h-4 w-4" />,
  },
  { to: "/services", label: "Services", icon: <Wrench className="h-4 w-4" /> },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
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
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            <Separator />

            <nav className="p-2 space-y-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )
                  }
                  end={item.to === "/"}
                >
                  <div className="shrink-0">{item.icon}</div>
                  {!collapsed ? <div className="truncate">{item.label}</div> : null}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto p-3">
              <div
                className={cn(
                  "rounded-2xl border p-3 text-xs text-muted-foreground",
                  collapsed && "hidden"
                )}
              >
                Tip: Each widget has a “chip” that navigates to the linked page.
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1">
          <div className="px-6 py-6 max-w-[1400px] mx-auto">
            <div className="mb-4 text-xs text-muted-foreground">
              Route:{" "}
              <span className="font-medium text-foreground">
                {location.pathname}
              </span>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------ Dashboard Shell ----------------------------- */

type CollectionsItem = {
  order: string;
  balance: number;
  reason:
    | "Customer non-responsive"
    | "Delivered not paid"
    | "Flagged: collection concern";
  repId: string;
};

const MOCK_COLLECTIONS: CollectionsItem[] = [
  { order: "SO-10421", balance: 12800, reason: "Delivered not paid", repId: "r2" },
  { order: "SO-10477", balance: 5400, reason: "Customer non-responsive", repId: "r4" },
  { order: "SO-10513", balance: 9200, reason: "Flagged: collection concern", repId: "r1" },
];

function LinkChip({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-1"
      aria-label={`Open ${label}`}
      title={`Open ${label}`}
    >
      <Badge variant="secondary" className="rounded-full">
        {label} <ExternalLink className="h-3 w-3 ml-1" />
      </Badge>
    </button>
  );
}

function DashboardPage() {
  const [view, setView] = useState<DateView>("week");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Shell"
        subtitle="Widgets-only shell with date view control (Day / Week / Month / YTD)."
        right={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              {view.toUpperCase()}
            </Badge>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance View</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={view} onValueChange={(v) => setView(v as DateView)}>
            <TabsList className="grid grid-cols-4 w-full md:w-[420px]">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="ytd">YTD</TabsTrigger>
            </TabsList>

            {/* Placeholder tab bodies (swap in charts later) */}
            <TabsContent value="day" className="mt-4">
              <div className="text-sm text-muted-foreground">
                Day view placeholder — hook up your chart/trend logic here.
              </div>
            </TabsContent>
            <TabsContent value="week" className="mt-4">
              <div className="text-sm text-muted-foreground">
                Week view placeholder — hook up your chart/trend logic here.
              </div>
            </TabsContent>
            <TabsContent value="month" className="mt-4">
              <div className="text-sm text-muted-foreground">
                Month view placeholder — hook up your chart/trend logic here.
              </div>
            </TabsContent>
            <TabsContent value="ytd" className="mt-4">
              <div className="text-sm text-muted-foreground">
                YTD view placeholder — hook up your chart/trend logic here.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Storage Gap */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageSearch className="h-4 w-4" />
                  Storage Gap
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Orders missing storage allocation / mismatch.
                </div>
              </div>
              <LinkChip to="/services" label="Storage" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold">7</div>
                <div className="text-xs text-muted-foreground mt-1">
                  orders flagged
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Needs attention
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Unconfirmed DOP */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Unconfirmed DOP
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Delivered orders pending confirmation.
                </div>
              </div>
              <LinkChip to="/invoice-review" label="Invoice Prep" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold">12</div>
                <div className="text-xs text-muted-foreground mt-1">
                  orders pending
                </div>
              </div>
              <Badge variant="outline" className="rounded-full">
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Review today
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Collections Alert */}
        <Card className="rounded-2xl md:col-span-2 xl:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4" />
                  Collections Alert
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Trending toward collections due to non-payment.
                </div>
              </div>
              <LinkChip to="/transactions" label="Collections" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Rep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_COLLECTIONS.map((it) => (
                    <TableRow key={it.order}>
                      <TableCell className="font-medium">{it.order}</TableCell>
                      <TableCell>{money(it.balance)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {it.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex justify-end">
                          <RepAvatar repId={it.repId} size="sm" />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders placeholder */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Reminders</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">
                Placeholder reminders — add chips to linked pages as needed.
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              3 items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="font-medium">Follow up on SO-10477</div>
                <div className="text-xs text-muted-foreground">
                  Customer non-responsive
                </div>
              </div>
              <LinkChip to="/transactions" label="Collections" />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="font-medium">Confirm DOP for 4 orders</div>
                <div className="text-xs text-muted-foreground">
                  Invoice prep queue
                </div>
              </div>
              <LinkChip to="/invoice-review" label="Invoice Prep" />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="font-medium">Storage allocation mismatch</div>
                <div className="text-xs text-muted-foreground">
                  2 orders flagged
                </div>
              </div>
              <LinkChip to="/services" label="Storage" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------ Invoice Review ------------------------------ */

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  customer: string;
  status: "Needs Review" | "Ready" | "On Hold";
  amount: number;
  repId: string;
};

const MOCK_INVOICES: InvoiceRow[] = [
  {
    id: "i1",
    invoiceNumber: "INV-8831",
    customer: "Northwind",
    status: "Needs Review",
    amount: 12650,
    repId: "r1",
  },
  {
    id: "i2",
    invoiceNumber: "INV-8832",
    customer: "Acme Co",
    status: "Ready",
    amount: 8040,
    repId: "r2",
  },
  {
    id: "i3",
    invoiceNumber: "INV-8833",
    customer: "Globex",
    status: "On Hold",
    amount: 15900,
    repId: "r3",
  },
];

function InvoiceReviewPage() {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_INVOICES[0]?.id ?? null
  );

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return MOCK_INVOICES;
    return MOCK_INVOICES.filter((r) =>
      [r.invoiceNumber, r.customer, r.status].some((x) =>
        x.toLowerCase().includes(query)
      )
    );
  }, [q]);

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoice Review"
        subtitle="Shell for invoice prep / review workflow."
        right={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoices…"
                className="pl-9 w-[260px]"
              />
            </div>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Rep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const active = r.id === selectedId;
                    return (
                      <TableRow
                        key={r.id}
                        className={cn(active && "bg-muted/50")}
                        onClick={() => setSelectedId(r.id)}
                        role="button"
                      >
                        <TableCell>
                          <div className="font-medium">{r.invoiceNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.customer}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "Needs Review"
                                ? "secondary"
                                : r.status === "Ready"
                                ? "outline"
                                : "destructive"
                            }
                            className="rounded-full"
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex justify-end">
                            <RepAvatar repId={r.repId} size="sm" />
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-sm text-muted-foreground py-8 text-center"
                      >
                        No matches.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Review Panel</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Placeholder details / actions.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Mark Ready</Button>
                <Button>Open Review</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">
                        {selected.invoiceNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selected.customer}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RepAvatar repId={selected.repId} />
                      <Badge variant="secondary" className="rounded-full">
                        {money(selected.amount)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="text-sm font-medium">Checks</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      • DOP confirmed
                      <br />
                      • Charges validated
                      <br />
                      • Notes reconciled
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="text-sm font-medium">Notes</div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Placeholder for internal notes / customer comms.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="text-sm font-medium">Next actions</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Add the real invoice workflow components here.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select an invoice to review.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------- Transactions ------------------------------- */

type Txn = {
  id: string;
  date: string; // ISO-ish
  customer: string;
  type: "Payment" | "Invoice" | "Credit" | "Adjustment";
  amount: number;
  status: "Open" | "Posted" | "Disputed";
  repId: string;
  order?: string;
  memo?: string;
};

const MOCK_TXNS: Txn[] = [
  {
    id: "t1",
    date: "2026-02-02",
    customer: "Northwind",
    type: "Invoice",
    amount: 12650,
    status: "Open",
    repId: "r1",
    order: "SO-10421",
    memo: "Delivered, awaiting payment",
  },
  {
    id: "t2",
    date: "2026-02-01",
    customer: "Acme Co",
    type: "Payment",
    amount: -8040,
    status: "Posted",
    repId: "r2",
    order: "SO-10411",
    memo: "ACH received",
  },
  {
    id: "t3",
    date: "2026-01-30",
    customer: "Globex",
    type: "Invoice",
    amount: 15900,
    status: "Disputed",
    repId: "r3",
    order: "SO-10398",
    memo: "Customer disputes service line",
  },
  {
    id: "t4",
    date: "2026-01-28",
    customer: "Initech",
    type: "Credit",
    amount: -1200,
    status: "Posted",
    repId: "r4",
    memo: "Credit issued",
  },
  {
    id: "t5",
    date: "2026-01-27",
    customer: "Umbrella",
    type: "Invoice",
    amount: 9200,
    status: "Open",
    repId: "r1",
    order: "SO-10513",
    memo: "Flagged: collection concern",
  },
];

type MultiFilterOption = { id: string; label: string };

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: MultiFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const allSelected = selected.length === options.length && options.length > 0;
  const noneSelected = selected.length === 0;

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  function selectAll() {
    onChange(options.map((o) => o.id));
  }

  function clearAll() {
    onChange([]);
  }

  const summary = allSelected ? "All" : noneSelected ? "Any" : `${selected.length}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {label}
          <Badge variant="secondary" className="rounded-full">
            {summary}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-3" align="end">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{label}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select all
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="max-h-[240px] overflow-auto space-y-2 pr-1">
          {options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selectedSet.has(o.id)}
                onCheckedChange={() => toggle(o.id)}
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TransactionsPage() {
  const [q, setQ] = useState("");
  const [repIds, setRepIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [openTxnId, setOpenTxnId] = useState<string | null>(null);

  const repOptions: MultiFilterOption[] = REPS.map((r) => ({ id: r.id, label: r.name }));
  const statusOptions: MultiFilterOption[] = [
    { id: "Open", label: "Open" },
    { id: "Posted", label: "Posted" },
    { id: "Disputed", label: "Disputed" },
  ];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return MOCK_TXNS.filter((t) => {
      const matchesQuery =
        !query ||
        [t.customer, t.type, t.status, t.order ?? "", t.memo ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesRep = repIds.length === 0 || repIds.includes(t.repId);
      const matchesStatus = statuses.length === 0 || statuses.includes(t.status);

      return matchesQuery && matchesRep && matchesStatus;
    });
  }, [q, repIds, statuses]);

  const openTxn =
    filtered.find((t) => t.id === openTxnId) ??
    MOCK_TXNS.find((t) => t.id === openTxnId) ??
    null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="Filterable list + detail drawer. Export button lives in the page header."
        right={
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export (placeholder)
          </Button>
        }
      />

      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-[380px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search customer, order, memo…"
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <MultiSelectFilter
                label="Reps"
                options={repOptions}
                selected={repIds}
                onChange={setRepIds}
              />
              <MultiSelectFilter
                label="Status"
                options={statusOptions}
                selected={statuses}
                onChange={setStatuses}
              />
              <Button
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setRepIds([]);
                  setStatuses([]);
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Rep</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => setOpenTxnId(t.id)}
                    role="button"
                  >
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="font-medium">{t.customer}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          t.status === "Disputed"
                            ? "destructive"
                            : t.status === "Open"
                            ? "secondary"
                            : "outline"
                        }
                        className="rounded-full"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(t.amount < 0 && "text-muted-foreground")}>
                      {money(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex justify-end">
                        <RepAvatar repId={t.repId} size="sm" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-sm text-muted-foreground py-10 text-center"
                    >
                      No transactions match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail drawer (single X; not duplicated) */}
      <Sheet open={!!openTxnId} onOpenChange={(v) => !v && setOpenTxnId(null)}>
        <SheetContent side="right" className="w-full sm:w-[520px] p-0">
          <div className="p-5 border-b flex items-start justify-between gap-3">
            <SheetHeader className="space-y-1">
              <SheetTitle className="text-base">Transaction Details</SheetTitle>
              <div className="text-xs text-muted-foreground">
                Click outside or use the close button.
              </div>
            </SheetHeader>

            {/* Only one close button */}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>

          <ScrollArea className="h-[calc(100vh-76px)]">
            <div className="p-5 space-y-4">
              {openTxn ? (
                <>
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">{openTxn.customer}</div>
                        <div className="text-sm text-muted-foreground">
                          {openTxn.type} • {openTxn.date}
                        </div>
                        {openTxn.order ? (
                          <div className="text-sm mt-2">
                            <Badge variant="outline" className="rounded-full">
                              {openTxn.order}
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <RepAvatar repId={openTxn.repId} />
                        <Badge variant="secondary" className="rounded-full">
                          {money(openTxn.amount)}
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="font-medium">{openTxn.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Memo</div>
                        <div className="font-medium">{openTxn.memo ?? "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="text-sm font-medium">Actions</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline">Add Note</Button>
                      <Button variant="outline">Mark Disputed</Button>
                      <Button>Open Full Record</Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No transaction selected.</div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* --------------------------------- Services -------------------------------- */

type ServiceLine = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

type ServiceOrder = {
  orderNumber: string;
  customer: string;
  repId: string;
  lines: ServiceLine[];
};

const MOCK_SERVICE_ORDERS: ServiceOrder[] = [
  {
    orderNumber: "SO-10421",
    customer: "Northwind",
    repId: "r2",
    lines: [
      { id: "l1", description: "Delivery", qty: 1, rate: 250 },
      { id: "l2", description: "Install", qty: 2, rate: 180 },
    ],
  },
  {
    orderNumber: "SO-10513",
    customer: "Umbrella",
    repId: "r1",
    lines: [{ id: "l3", description: "Storage (monthly)", qty: 1, rate: 600 }],
  },
];

function ServicesPage() {
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [MOCK_SERVICE_ORDERS[0]?.orderNumber ?? ""]: true,
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(MOCK_SERVICE_ORDERS);

  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<string | null>(null);

  const [draftDesc, setDraftDesc] = useState("");
  const [draftQty, setDraftQty] = useState<number>(1);
  const [draftRate, setDraftRate] = useState<number>(0);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((o) =>
      [o.orderNumber, o.customer].join(" ").toLowerCase().includes(query)
    );
  }, [q, orders]);

  function toggleExpand(orderNumber: string) {
    setExpanded((prev) => ({ ...prev, [orderNumber]: !prev[orderNumber] }));
  }

  function openAddLine(orderNumber: string) {
    const exists = orders.some((o) => o.orderNumber === orderNumber);
    if (!exists) return;

    setAddTarget(orderNumber);
    setDraftDesc("");
    setDraftQty(1);
    setDraftRate(0);
    setAddOpen(true);
  }

  function saveAddLine() {
    if (!addTarget) return;
    const desc = draftDesc.trim();
    if (!desc) return;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.orderNumber !== addTarget) return o;
        const newLine: ServiceLine = {
          id: `l_${Date.now()}`,
          description: desc,
          qty: Math.max(1, Number(draftQty) || 1),
          rate: Math.max(0, Number(draftRate) || 0),
        };
        return { ...o, lines: [...o.lines, newLine] };
      })
    );

    setAddOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Services"
        subtitle="Expandable orders + working “+Add” line item modal."
        right={
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order or customer…"
              className="pl-9 w-[300px]"
            />
          </div>
        }
      />

      <div className="space-y-3">
        {filtered.map((o) => {
          const isOpen = !!expanded[o.orderNumber];
          const total = o.lines.reduce((sum, l) => sum + l.qty * l.rate, 0);

          return (
            <Card key={o.orderNumber} className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <RepAvatar repId={o.repId} />
                    <div>
                      <CardTitle className="text-base">
                        {o.orderNumber} • {o.customer}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        {o.lines.length} line(s) • Total {money(total)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => openAddLine(o.orderNumber)}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpand(o.orderNumber)}
                      aria-label={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isOpen ? (
                <CardContent className="pt-2">
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Line Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {o.lines.map((l) => (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium">
                              {l.description}
                            </TableCell>
                            <TableCell className="text-right">{l.qty}</TableCell>
                            <TableCell className="text-right">
                              {money(l.rate)}
                            </TableCell>
                            <TableCell className="text-right">
                              {money(l.qty * l.rate)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {o.lines.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-sm text-muted-foreground py-8 text-center"
                            >
                              No service lines yet.
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              ) : null}
            </Card>
          );
        })}

        {filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No orders match your search.
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Add line modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Service Line</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Target order:{" "}
              <span className="font-medium text-foreground">
                {addTarget ?? "—"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <Input
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="e.g., Storage (monthly)"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Qty</div>
                <Input
                  type="number"
                  value={draftQty}
                  onChange={(e) => setDraftQty(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Rate</div>
                <Input
                  type="number"
                  value={draftRate}
                  onChange={(e) => setDraftRate(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Line total:{" "}
              <span className="font-medium text-foreground">
                {money((Number(draftQty) || 1) * (Number(draftRate) || 0))}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAddLine}>Save Line</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------- App ----------------------------------- */

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="space-y-3">
      <div className="text-2xl font-semibold">404</div>
      <div className="text-sm text-muted-foreground">That page doesn’t exist.</div>
      <Button onClick={() => navigate("/")}>Go home</Button>
    </div>
  );
}

function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/invoice-review" element={<InvoiceReviewPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
```
