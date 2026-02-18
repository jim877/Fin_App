// Central place for mock data so shells stay clean.

export type CollectionsItem = {
  order: string;
  balance: number;
  reason: "Customer non-responsive" | "Delivered not paid" | "Flagged: collection concern";
  repId: string;
};

export const MOCK_COLLECTIONS: CollectionsItem[] = [
  { order: "SO-10421", balance: 12800, reason: "Delivered not paid", repId: "r2" },
  { order: "SO-10477", balance: 5400, reason: "Customer non-responsive", repId: "r4" },
  { order: "SO-10513", balance: 9200, reason: "Flagged: collection concern", repId: "r1" },
];

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  customer: string;
  status: "Needs Review" | "Ready" | "On Hold";
  amount: number;
  repId: string;
};

export const MOCK_INVOICES: InvoiceRow[] = [
  { id: "i1", invoiceNumber: "INV-8831", customer: "Northwind", status: "Needs Review", amount: 12650, repId: "r1" },
  { id: "i2", invoiceNumber: "INV-8832", customer: "Acme Co", status: "Ready", amount: 8040, repId: "r2" },
  { id: "i3", invoiceNumber: "INV-8833", customer: "Globex", status: "On Hold", amount: 15900, repId: "r3" },
];

export type Txn = {
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

export const MOCK_TXNS: Txn[] = [
  { id: "t1", date: "2026-02-02", customer: "Northwind", type: "Invoice", amount: 12650, status: "Open", repId: "r1", order: "SO-10421", memo: "Delivered, awaiting payment" },
  { id: "t2", date: "2026-02-01", customer: "Acme Co", type: "Payment", amount: -8040, status: "Posted", repId: "r2", order: "SO-10411", memo: "ACH received" },
  { id: "t3", date: "2026-01-30", customer: "Globex", type: "Invoice", amount: 15900, status: "Disputed", repId: "r3", order: "SO-10398", memo: "Customer disputes service line" },
  { id: "t4", date: "2026-01-28", customer: "Initech", type: "Credit", amount: -1200, status: "Posted", repId: "r4", memo: "Credit issued" },
  { id: "t5", date: "2026-01-27", customer: "Umbrella", type: "Invoice", amount: 9200, status: "Open", repId: "r1", order: "SO-10513", memo: "Flagged: collection concern" },
];

export type ServiceLine = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

export type ServiceOrder = {
  orderNumber: string;
  customer: string;
  repId: string;
  lines: ServiceLine[];
};

export const MOCK_SERVICE_ORDERS: ServiceOrder[] = [
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
