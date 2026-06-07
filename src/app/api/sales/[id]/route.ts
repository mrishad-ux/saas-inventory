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
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const sale = dbGet("sales", (s: any) => s.id === id);
    if (!sale) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("GET /api/sales/[id] error:", error);
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
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const existing = dbGet("sales", (s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "sale_date", "sale_type", "platform", "gross_amount",
      "commission_percent", "commission_amount", "net_amount",
      "settlement_status", "expected_settlement_date",
      "actual_settlement_date", "notes",
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updated = dbUpdate("sales", id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/sales/[id] error:", error);
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
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
    }

    const existing = dbGet("sales", (s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Sale not found" }, { status: 404 });
    }

    dbDelete("sales", id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/sales/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}