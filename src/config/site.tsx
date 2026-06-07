import {
  Gauge, Package, ClipboardList, History, ShoppingCart,
  Receipt, Users, Banknote, Truck, FileSpreadsheet, Shield, CreditCard,
  type LucideIcon,
} from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "RishArt Inventory",
  description: "Lord Of Wraps / RishArt — Restaurant Inventory Management",
};

export const navigations: Navigation[] = [
  { icon: Gauge, name: "Dashboard", href: "/" },
  { icon: Package, name: "Item Master", href: "/inventory-master" },
  { icon: ClipboardList, name: "Daily Stock", href: "/inventory-daily" },
  { icon: History, name: "Stock History", href: "/inventory-history" },
  { icon: ShoppingCart, name: "Sales", href: "/sales" },
  { icon: Receipt, name: "Expenses", href: "/expenses" },
  { icon: CreditCard, name: "Payments", href: "/payments" },
  { icon: Users, name: "Staff", href: "/staff" },
  { icon: Banknote, name: "Payroll", href: "/payroll" },
  { icon: Truck, name: "Suppliers", href: "/suppliers" },
  { icon: FileSpreadsheet, name: "Settlements", href: "/settlements" },
  { icon: Shield, name: "Backup", href: "/backup" },
];
