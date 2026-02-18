import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Search } from "lucide-react";

import { money } from "../lib/utils";
import { MOCK_SERVICE_ORDERS, type ServiceLine, type ServiceOrder } from "../lib/mock";
import { PageHeader } from "../components/shared/PageHeader";
import { RepAvatar } from "../components/shared/RepAvatar";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function ServicesPage() {
  const [q, setQ] = React.useState("");
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({
    [MOCK_SERVICE_ORDERS[0]?.orderNumber ?? ""]: true,
  });

  const [orders, setOrders] = React.useState<ServiceOrder[]>(MOCK_SERVICE_ORDERS);

  const [addOpen, setAddOpen] = React.useState(false);
  const [addTarget, setAddTarget] = React.useState<string | null>(null);

  const [draftDesc, setDraftDesc] = React.useState("");
  const [draftQty, setDraftQty] = React.useState<number>(1);
  const [draftRate, setDraftRate] = React.useState<number>(0);

  const filtered = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((o) => [o.orderNumber, o.customer].join(" ").toLowerCase().includes(query));
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
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order or customer…" className="pl-9 w-[300px]" />
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
                    <Button variant="outline" className="gap-2" onClick={() => openAddLine(o.orderNumber)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(o.orderNumber)} aria-label={isOpen ? "Collapse" : "Expand"}>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                            <TableCell className="font-medium">{l.description}</TableCell>
                            <TableCell className="text-right">{l.qty}</TableCell>
                            <TableCell className="text-right">{money(l.rate)}</TableCell>
                            <TableCell className="text-right">{money(l.qty * l.rate)}</TableCell>
                          </TableRow>
                        ))}
                        {o.lines.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-sm text-muted-foreground py-8 text-center">
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Service Line</DialogTitle>
          </DialogHeader>

          <div className="px-5 space-y-3">
            <div className="text-sm text-muted-foreground">
              Target order: <span className="font-medium text-foreground">{addTarget ?? "—"}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <Input value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="e.g., Storage (monthly)" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Qty</div>
                <Input type="number" value={draftQty} onChange={(e) => setDraftQty(Number(e.target.value))} min={1} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Rate</div>
                <Input type="number" value={draftRate} onChange={(e) => setDraftRate(Number(e.target.value))} min={0} />
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Line total: <span className="font-medium text-foreground">{money((Number(draftQty) || 1) * (Number(draftRate) || 0))}</span>
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
