import * as React from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";

import { cn, money } from "../lib/utils";
import { MOCK_TXNS } from "../lib/mock";
import { REPS } from "../lib/reps";
import { PageHeader } from "../components/shared/PageHeader";
import { RepAvatar } from "../components/shared/RepAvatar";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";

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
  const selectedSet = React.useMemo(() => new Set(selected), [selected]);
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
            <label key={o.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted cursor-pointer">
              <Checkbox checked={selectedSet.has(o.id)} onCheckedChange={() => toggle(o.id)} />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TransactionsPage() {
  const [q, setQ] = React.useState("");
  const [repIds, setRepIds] = React.useState<string[]>([]);
  const [statuses, setStatuses] = React.useState<string[]>([]);
  const [openTxnId, setOpenTxnId] = React.useState<string | null>(null);

  const repOptions: MultiFilterOption[] = REPS.map((r) => ({ id: r.id, label: r.name }));
  const statusOptions: MultiFilterOption[] = [
    { id: "Open", label: "Open" },
    { id: "Posted", label: "Posted" },
    { id: "Disputed", label: "Disputed" },
  ];

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return MOCK_TXNS.filter((t) => {
      const matchesQuery =
        !query ||
        [t.customer, t.type, t.status, t.order ?? "", t.memo ?? ""].join(" ").toLowerCase().includes(query);

      const matchesRep = repIds.length === 0 || repIds.includes(t.repId);
      const matchesStatus = statuses.length === 0 || statuses.includes(t.status);

      return matchesQuery && matchesRep && matchesStatus;
    });
  }, [q, repIds, statuses]);

  const openTxn =
    filtered.find((t) => t.id === openTxnId) ?? MOCK_TXNS.find((t) => t.id === openTxnId) ?? null;

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
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, order, memo…" className="pl-9" />
            </div>

            <div className="flex items-center gap-2">
              <MultiSelectFilter label="Reps" options={repOptions} selected={repIds} onChange={setRepIds} />
              <MultiSelectFilter label="Status" options={statusOptions} selected={statuses} onChange={setStatuses} />
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
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setOpenTxnId(t.id)} role="button">
                    <TableCell className="text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="font-medium">{t.customer}</TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "Disputed" ? "destructive" : t.status === "Open" ? "secondary" : "outline"}
                        className="rounded-full"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(t.amount < 0 && "text-muted-foreground")}>{money(t.amount)}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex justify-end">
                        <RepAvatar repId={t.repId} size="sm" />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-muted-foreground py-10 text-center">
                      No transactions match your filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!openTxnId} onOpenChange={(v) => !v && setOpenTxnId(null)}>
        <SheetContent side="right" className="w-full sm:w-[520px] p-0">
          <SheetHeader className="px-5 py-4 space-y-1 border-b">
            <SheetTitle className="text-base">Transaction Details</SheetTitle>
            <div className="text-xs text-muted-foreground">Click outside or use the close button.</div>
          </SheetHeader>

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
