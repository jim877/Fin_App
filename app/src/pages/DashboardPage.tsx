import * as React from "react";
import { AlertTriangle, BadgeDollarSign, CalendarDays, ClipboardCheck, PackageSearch } from "lucide-react";

import { money } from "../lib/utils";
import { MOCK_COLLECTIONS } from "../lib/mock";
import { PageHeader } from "../components/shared/PageHeader";
import { LinkChip } from "../components/shared/LinkChip";
import { RepAvatar } from "../components/shared/RepAvatar";

import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

type DateView = "day" | "week" | "month" | "ytd";

export function DashboardPage() {
  const [view, setView] = React.useState<DateView>("week");

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

            <TabsContent value="day" className="mt-4">
              <div className="text-sm text-muted-foreground">Day view placeholder — hook up your chart/trend logic here.</div>
            </TabsContent>
            <TabsContent value="week" className="mt-4">
              <div className="text-sm text-muted-foreground">Week view placeholder — hook up your chart/trend logic here.</div>
            </TabsContent>
            <TabsContent value="month" className="mt-4">
              <div className="text-sm text-muted-foreground">Month view placeholder — hook up your chart/trend logic here.</div>
            </TabsContent>
            <TabsContent value="ytd" className="mt-4">
              <div className="text-sm text-muted-foreground">YTD view placeholder — hook up your chart/trend logic here.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageSearch className="h-4 w-4" />
                  Storage Gap
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Orders missing storage allocation / mismatch.</div>
              </div>
              <LinkChip to="/services" label="Storage" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold">7</div>
                <div className="text-xs text-muted-foreground mt-1">orders flagged</div>
              </div>
              <Badge variant="secondary" className="rounded-full">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Needs attention
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Unconfirmed DOP
                </CardTitle>
                <div className="text-xs text-muted-foreground mt-1">Delivered orders pending confirmation.</div>
              </div>
              <LinkChip to="/invoice-review" label="Invoice Prep" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold">12</div>
                <div className="text-xs text-muted-foreground mt-1">orders pending</div>
              </div>
              <Badge variant="outline" className="rounded-full">
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                Review today
              </Badge>
            </div>
          </CardContent>
        </Card>

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
                      <TableCell className="text-muted-foreground">{it.reason}</TableCell>
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
                <div className="font-medium">Reminder: SO-10477</div>
                <div className="text-xs text-muted-foreground">Customer non-responsive</div>
              </div>
              <LinkChip to="/transactions" label="Collections" />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="font-medium">Confirm DOP for 4 orders</div>
                <div className="text-xs text-muted-foreground">Invoice prep queue</div>
              </div>
              <LinkChip to="/invoice-review" label="Invoice Prep" />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
              <div>
                <div className="font-medium">Storage allocation mismatch</div>
                <div className="text-xs text-muted-foreground">2 orders flagged</div>
              </div>
              <LinkChip to="/services" label="Storage" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
