import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "manager")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const items = dbQuery("inventory_items");
    const lowStock = items.filter((i: any) => i.current_stock <= i.minimum_stock);
    lowStock.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    return NextResponse.json({ success: true, data: lowStock });
  } catch (error) {
    console.error("GET /api/inventory/low-stock error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}