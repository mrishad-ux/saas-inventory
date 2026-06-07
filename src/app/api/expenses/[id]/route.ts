import { NextRequest, NextResponse } from "next/server";
import { initDb, dbGet, dbUpdate, dbDelete } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
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

    const enriched = {
      ...expense,
      pending_amount: parseFloat((expense.amount - expense.paid_amount).toFixed(2)),
      payment_status:
        expense.paid_amount >= expense.amount ? "paid" :
        expense.paid_amount > 0 ? "partial" : "pending",
    };
    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("GET /api/expenses/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const existing = dbGet("expenses", (e: any) => e.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ["title", "category", "amount", "paid_amount", "expense_date", "supplier_id", "notes"];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updated = dbUpdate("expenses", id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/expenses/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const existing = dbGet("expenses", (e: any) => e.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }

    dbDelete("expenses", id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}