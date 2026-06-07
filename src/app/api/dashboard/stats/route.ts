import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbSum, dbCount } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date(today);

    // Start of current month
    const monthStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Today's sales totals
    const todaySales = dbQuery("sales", (s: any) => s.sale_date === today);
    const todaySalesTotal = todaySales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);

    // Month sales total
    const monthSales = dbQuery("sales", (s: any) => s.sale_date >= monthStart);
    const monthSalesTotal = monthSales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);

    // Pending expenses count (where paid_amount < amount)
    const pendingExpensesCount = dbCount(
      "expenses",
      (e: any) => e.paid_amount < e.amount
    );

    // Low stock count
    const lowStockCount = dbCount(
      "inventory_items",
      (i: any) => i.current_stock <= i.minimum_stock
    );

    // Active Staff
    const activeStaff = dbCount(
      "staff",
      (s: any) => s.status === "active"
    );

    // Today's expenses total
    const todayExpensesTotal = dbSum(
      "expenses",
      "amount",
      (e: any) => e.expense_date === today
    );

    // Recent sales (last 5)
    const recentSales = dbQuery("sales")
      .sort((a: any, b: any) => b.sale_date.localeCompare(a.sale_date) || b.id - a.id)
      .slice(0, 5);

    // Recent expenses (last 5)
    const recentExpenses = dbQuery("expenses")
      .sort((a: any, b: any) => b.expense_date.localeCompare(a.expense_date) || b.id - a.id)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        todaySalesTotal: parseFloat(todaySalesTotal.toFixed(2)),
        monthSalesTotal: parseFloat(monthSalesTotal.toFixed(2)),
        pendingExpensesCount,
        lowStockCount,
        todayExpensesTotal: parseFloat(todayExpensesTotal.toFixed(2)),
        activeStaff,
        recentSales,
        recentExpenses,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}