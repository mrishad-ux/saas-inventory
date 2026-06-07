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

    const staff = dbGet("staff", (s: any) => s.id === id);
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("GET /api/staff/[id] error:", error);
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

    const existing = dbGet("staff", (s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = ["name", "role", "phone", "salary_type", "salary_amount", "joining_date", "status"];
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updated = dbUpdate("staff", id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/staff/[id] error:", error);
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

    const existing = dbGet("staff", (s: any) => s.id === id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Staff not found" }, { status: 404 });
    }

    dbDelete("staff", id);
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/staff/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}