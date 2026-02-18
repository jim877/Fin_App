import type { ComponentType } from "react";
import {
  Boxes,
  CircleDollarSign,
  CreditCard,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListOrdered,
  Percent,
  Settings2,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  route?: string;
  count: number;
};

/**
 * Unified sections list for the app sidebar. Same order on all pages with Settings last.
 * Counts can be updated by consumers (e.g. dashboard) for badge display.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/", count: 0 },
  { id: "transactions", label: "Transactions", icon: ListOrdered, route: "/transactions", count: 27 },
  { id: "estimates", label: "Estimates", icon: ClipboardList, route: "/estimates", count: 0 },
  { id: "services", label: "Services", icon: Wrench, route: "/services", count: 2 },
  { id: "billingPrep", label: "Billing Prep", icon: ClipboardCheck, route: "/billing-prep", count: 0 },
  { id: "billing", label: "Billing", icon: CreditCard, route: "/billing", count: 3 },
  { id: "review", label: "Review", icon: FileText, route: "/invoice-review", count: 3 },
  { id: "storage", label: "Storage", icon: Boxes, route: "/storage", count: 2 },
  { id: "collections", label: "Collections", icon: CircleDollarSign, route: "/collections", count: 4 },
  { id: "referralFees", label: "Referral Fees", icon: Users, route: "/referral-fees", count: 1 },
  { id: "commissions", label: "Commissions", icon: Percent, route: "/commissions", count: 1 },
  { id: "payables", label: "Payables", icon: Wallet, route: "/payables", count: 5 },
  { id: "settings", label: "Settings", icon: Settings2, route: "/settings", count: 0 },
];

export const routeToNavId: Record<string, string> = {
  "/": "dashboard",
  "/transactions": "transactions",
  "/estimates": "estimates",
  "/services": "services",
  "/billing-prep": "billingPrep",
  "/billing": "billing",
  "/invoice-review": "review",
  "/storage": "storage",
  "/collections": "collections",
  "/commissions": "commissions",
  "/referral-fees": "referralFees",
  "/payables": "payables",
  "/settings": "settings",
};

export function getSectionLabel(id: string): string {
  return NAV_ITEMS.find((n) => n.id === id)?.label ?? id;
}
