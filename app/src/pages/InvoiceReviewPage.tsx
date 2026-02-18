import * as React from "react";
import { Search } from "lucide-react";

import { money } from "../lib/utils";
import { MOCK_INVOICES } from "../lib/mock";
import { PageHeader } from "../components/shared/PageHeader";
import { RepAvatar } from "../components/shared/RepAvatar";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function InvoiceReviewPage() {
  const [q, setQ] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(MOCK_INVOICES[0]?.id ?? null);

  const rows = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return MOCK_INVOICES;
    return MOCK_INVOICES.filter((r) =>
      [r.invoiceNumber, r.customer, r.status].some((x) => x.toLowerCase().includes(query))
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
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices…" className="pl-9 w-[260px]" />
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
                        className={active ? "bg-muted/50" : undefined}
                        onClick={() => setSelectedId(r.id)}
                        role="button"
                      >
                        <TableCell>
                          <div className="font-medium">{r.invoiceNumber}</div>
                          <div className="text-xs text-muted-foreground">{r.customer}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.status === "Needs Review" ? "secondary" : r.status === "Ready" ? "outline" : "destructive"}
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
                      <TableCell colSpan={3} className="text-sm text-muted-foreground py-8 text-center">
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
                <div className="text-xs text-muted-foreground mt-1">Placeholder details / actions.</div>
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
                      <div className="text-lg font-semibold">{selected.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">{selected.customer}</div>
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
                      • DOP confirmed<br />• Charges validated<br />• Notes reconciled
                    </div>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="text-sm font-medium">Notes</div>
                    <div className="text-sm text-muted-foreground mt-2">Placeholder for internal notes / customer comms.</div>
                  </div>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="text-sm font-medium">Next actions</div>
                  <div className="text-sm text-muted-foreground mt-2">Add the real invoice workflow components here.</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Select an invoice to review.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
