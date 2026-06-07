import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let expenses = dbQuery("expenses");

    if (from) {
      expenses = expenses.filter((e: any) => e.expense_date >= from);
    }
    if (to) {
      expenses = expenses.filter((e: any) => e.expense_date <= to);
    }

    expenses.sort((a: any, b: any) => b.expense_date.localeCompare(a.expense_date) || b.id - a.id);

    const enriched = expenses.map((e: any) => ({
      ...e,
      pending_amount: parseFloat((e.amount - e.paid_amount).toFixed(2)),
      payment_status:
        e.paid_amount >= e.amount ? "paid" :
        e.paid_amount > 0 ? "partial" : "pending",
    }));
    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, amount, paid_amount, expense_date, supplier_id, notes } = body;

    if (!title || !category || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "title, category, and amount are required" },
        { status: 400 }
      );
    }

    const expense = dbCreate("expenses", {
      title,
      category,
      amount,
      paid_amount: paid_amount ?? 0,
      expense_date: expense_date || new Date().toISOString().split("T")[0],
      supplier_id: supplier_id ?? null,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}