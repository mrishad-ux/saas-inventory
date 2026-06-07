import { NextRequest, NextResponse } from "next/server";
import { initDb, dbGet, dbUpdate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb();
    const { id } = await params;
    const itemId = parseInt(id, 10);
    const item = dbGet("platform_settlements", (s: any) => s.id === itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Settlement not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("GET /api/settlements/[id] error:", error);
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

    const existing = dbGet("platform_settlements", (s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Settlement not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      "status", "actual_amount_received", "actual_commission",
      "actual_credit_date", "expected_credit_date", "notes",
      "platform", "period_from", "period_to", "gross_amount",
      "estimated_commission", "estimated_net",
    ];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // If status is changing to "received" and no actual_credit_date set, set it to today
    if (updates.status === "received" && !existing.actual_credit_date && !updates.actual_credit_date) {
      updates.actual_credit_date = new Date().toISOString().split("T")[0];
    }

    const updated = dbUpdate("platform_settlements", id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/settlements/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}