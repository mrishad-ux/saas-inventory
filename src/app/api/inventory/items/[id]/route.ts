import { getAuthUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpdate, dbDelete, dbGet } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const { id } = await params;
    const itemId = parseInt(id, 10);
    const item = dbGet("inventory_items", (i: any) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("GET /api/inventory/items/[id] error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const { id } = await params;
    const itemId = parseInt(id, 10);
    const body = await request.json();

    const existing = dbGet("inventory_items", (i: any) => i.id === itemId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    const updated = dbUpdate("inventory_items", itemId, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.current_stock !== undefined && {
        current_stock: Number(body.current_stock),
      }),
      ...(body.minimum_stock !== undefined && {
        minimum_stock: Number(body.minimum_stock),
        minimum_stock_qty: Number(body.minimum_stock),
      }),
      ...(body.unit_price !== undefined && {
        unit_price: Number(body.unit_price),
      }),
      ...(body.supplier_id !== undefined && {
        supplier_id: body.supplier_id ? Number(body.supplier_id) : null,
      }),
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const { id } = await params;
    const itemId = parseInt(id, 10);

    const existing = dbGet("inventory_items", (i: any) => i.id === itemId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    dbDelete("inventory_items", itemId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}