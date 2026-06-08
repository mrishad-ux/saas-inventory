"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigations } from "@/config/site";
import { cn } from "@/lib/utils";

type Role = "admin" | "manager" | "accounts";

const roleAllowedPaths: Record<Role, string[]> = {
  admin: ["/", "/inventory-master", "/inventory-daily", "/inventory-history",
          "/sales", "/expenses", "/payments", "/staff", "/payroll",
          "/suppliers", "/settlements", "/backup"],
  manager: ["/", "/inventory-master", "/inventory-daily", "/inventory-history", "/expenses", "/payroll"],
  accounts: ["/", "/sales", "/settlements", "/payments"],
};

export default function Navigation({ userRole }: { userRole?: string }) {
  const pathname = usePathname();

  const allowedPaths = userRole && (userRole in roleAllowedPaths)
    ? roleAllowedPaths[userRole as Role]
    : ["/"]; // fallback: dashboard only

  return (
    <nav className="flex flex-grow flex-col gap-y-1 p-2">
      {navigations
        .filter(nav => allowedPaths.includes(nav.href))
        .map((navigation) => {
          const Icon = navigation.icon;
          return (
            <Link
              key={navigation.name}
              href={navigation.href}
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800",
                pathname === navigation.href
                  ? "bg-slate-200 dark:bg-slate-800"
                  : "bg-transparent",
              )}
            >
              <Icon
                size={16}
                className="mr-2 text-slate-800 dark:text-slate-200"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {navigation.name}
              </span>
            </Link>
          );
        })}
    </nav>
  );
}