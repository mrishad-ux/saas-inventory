import { NextRequest, NextResponse } from "next/server";
import { initDb, dbGet, dbQuery } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager", "accounts"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const expense = dbGet("expenses", (e: any) => e.id === id);
    if (!expense) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    const payments = dbQuery("payments", (p: any) => p.expense_id === id);
    payments.sort((a: any, b: any) => b.payment_date.localeCompare(a.payment_date) || b.id - a.id);

    return NextResponse.json({
      success: true,
      data: {
        expense,
        payments,
      },
    });
  } catch (error) {
    console.error("GET /api/expenses/[id]/payment-info error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}