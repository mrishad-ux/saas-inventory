import { NextRequest, NextResponse } from "next/server";
import { initDb, dbGet, dbDelete, dbUpdate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const payment = dbGet("payments", (p: any) => p.id === id);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    const expenseId = payment.expense_id;
    dbDelete("payments", id);

    // Subtract deleted payment from expense paid_amount
    const expense = dbGet("expenses", (e: any) => e.id === expenseId);
    if (expense) {
      dbUpdate("expenses", expenseId, {
        paid_amount: Math.max(0, parseFloat((expense.paid_amount - payment.amount).toFixed(2))),
      });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/payments/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}