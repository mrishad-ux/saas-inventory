import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const categories = dbQuery("expense_categories");
    categories.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("GET /api/expense-categories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { label, value } = body;

    if (!label || !value) {
      return NextResponse.json(
        { success: false, error: "label and value are required" },
        { status: 400 }
      );
    }

    // Check if value already exists
    const existing = dbQuery("expense_categories", (c: any) => c.value === value);
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Category with this value already exists" },
        { status: 409 }
      );
    }

    const maxSort = dbQuery("expense_categories").reduce((max: number, c: any) => Math.max(max, c.sort_order || 0), 0);

    const category = dbCreate("expense_categories", {
      label,
      value,
      is_custom: true,
      sort_order: maxSort + 1,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/expense-categories error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}