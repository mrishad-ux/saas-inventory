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

    const payroll = dbGet("payroll", (p: any) => p.id === id);
    if (!payroll) {
      return NextResponse.json({ success: false, error: "Payroll record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payroll });
  } catch (error) {
    console.error("GET /api/payroll/[id] error:", error);
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

    const existing = dbGet("payroll", (p: any) => p.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Payroll record not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ["staff_id", "payment_date", "days_worked", "basic_amount", "bonus", "deduction", "net_amount", "status", "notes"];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updated = dbUpdate("payroll", id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/payroll/[id] error:", error);
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

    const existing = dbGet("payroll", (p: any) => p.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Payroll record not found" }, { status: 404 });
    }

    dbDelete("payroll", id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/payroll/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}