import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpdate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "items must be an array of {id, sort_order}" },
        { status: 400 }
      );
    }

    const results = [];
    for (const item of items) {
      const { id, sort_order } = item;
      if (id !== undefined && sort_order !== undefined) {
        const updated = dbUpdate("inventory_items", id, { sort_order });
        results.push(updated);
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("POST /api/inventory/reorder error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}