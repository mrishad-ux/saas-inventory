import { getAuthUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate, dbUpdate } from "@/lib/db";

export async function GET() {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const items = dbQuery("inventory_items");
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const body = await request.json();
    const {
      name,
      category,
      unit,
      current_stock,
      minimum_stock,
      unit_price,
      supplier_id,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Name and category are required" },
        { status: 400 }
      );
    }

    const item = dbCreate("inventory_items", {
      name,
      category,
      unit: unit || "kg",
      current_stock: Number(current_stock) || 0,
      minimum_stock: Number(minimum_stock) || 0,
      minimum_stock_qty: Number(minimum_stock) || 0,
      unit_price: Number(unit_price) || 0,
      supplier_id: supplier_id ? Number(supplier_id) : null,
      is_mayo: name.toLowerCase().includes("mayo"),
      sort_order: 0,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}