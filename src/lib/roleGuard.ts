import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export type Role = "admin" | "manager" | "accounts";

export function canAccess(role: string, resource: string): boolean {
  if (role === "admin") return true;

  const inventory = ["/api/inventory", "/api/stock", "/api/item-master", "/api/low-stock", "/api/reorder"];
  const sales = ["/api/sales", "/api/bulk"];
  const accounts_pages = ["/api/settlements", "/api/payments", "/api/expenses", "/api/expense-categories"];

  if (resource === "inventory" || inventory.some(r => resource.startsWith(r))) {
    return role === "manager";
  }
  if (resource === "sales" || sales.some(r => resource.startsWith(r))) {
    return role === "accounts";
  }
  if (resource === "accounts" || accounts_pages.some(r => resource.startsWith(r))) {
    return role === "accounts";
  }
  if (resource === "payroll") {
    return role === "manager";
  }
  if (resource === "staff" || resource === "suppliers" || resource === "backup") {
    return role === "admin";
  }

  return false;
}

export async function authGuard(resource: string): Promise<{ authorized: boolean; response?: NextResponse; role?: string }> {
  const { user } = await getAuthUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!canAccess(user.role, resource)) {
    return { authorized: false, response: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  }
  return { authorized: true, role: user.role };
}