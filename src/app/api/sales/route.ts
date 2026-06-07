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

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let sales = dbQuery("sales");

    if (from) {
      sales = sales.filter((s: any) => s.sale_date >= from);
    }
    if (to) {
      sales = sales.filter((s: any) => s.sale_date <= to);
    }

    sales.sort((a: any, b: any) => b.sale_date.localeCompare(a.sale_date));

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("GET /api/sales error:", error);
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
    const {
      sale_date, sale_type, platform, gross_amount,
      commission_percent, commission_amount, net_amount,
      settlement_status, expected_settlement_date, notes,
    } = body;

    if (!sale_date || !sale_type) {
      return NextResponse.json(
        { success: false, error: "sale_date and sale_type are required" },
        { status: 400 }
      );
    }

    const sale = dbCreate("sales", {
      sale_date,
      sale_type,
      platform: platform || "",
      gross_amount: gross_amount ?? 0,
      commission_percent: commission_percent ?? 0,
      commission_amount: commission_amount ?? 0,
      net_amount: net_amount ?? (gross_amount ?? 0),
      settlement_status: settlement_status || "not_applicable",
      expected_settlement_date: expected_settlement_date || null,
      actual_settlement_date: null,
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}