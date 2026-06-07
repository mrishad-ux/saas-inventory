"use client";

import { TopNav } from "@/components/nav";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/inventory-master": "Item Master",
  "/inventory-daily": "Daily Stock Entry",
  "/inventory-history": "Stock History",
  "/sales": "Sales",
  "/expenses": "Expenses",
  "/payments": "Payments",
  "/staff": "Staff",
  "/payroll": "Payroll",
  "/suppliers": "Suppliers",
  "/settlements": "Settlements",
  "/backup": "Backup & Restore",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <TopNav title={pageTitles[pathname] || "RishArt"} />
      <main>{children}</main>
    </>
  );
}