import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate, dbGet, dbUpdate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const payments = dbQuery("payments");
    payments.sort((a: any, b: any) => b.payment_date.localeCompare(a.payment_date) || b.id - a.id);

    // Enrich with expense title
    const enriched = payments.map((p: any) => {
      const expense = dbGet("expenses", (e: any) => e.id === p.expense_id);
      return {
        ...p,
        expense_title: expense ? expense.title : null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { expense_id, amount, payment_date, notes } = body;

    if (!expense_id || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "expense_id and amount are required" },
        { status: 400 }
      );
    }

    const expense = dbGet("expenses", (e: any) => e.id === expense_id);
    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    const payment = dbCreate("payments", {
      expense_id,
      amount,
      payment_date: payment_date || new Date().toISOString().split("T")[0],
      notes: notes || "",
    });

    // Update expense paid_amount — add new payment to existing paid_amount
    dbUpdate("expenses", expense_id, {
      paid_amount: parseFloat((expense.paid_amount + amount).toFixed(2)),
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}