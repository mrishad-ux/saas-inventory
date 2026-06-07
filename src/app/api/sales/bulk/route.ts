import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpsert } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sales } = body;

    if (!Array.isArray(sales)) {
      return NextResponse.json(
        { success: false, error: "sales must be an array" },
        { status: 400 }
      );
    }

    const results = [];
    for (const sale of sales) {
      const { sale_date, sale_type, platform, gross_amount, commission_percent, commission_amount, net_amount, settlement_status, expected_settlement_date, notes } = sale;

      if (!sale_date || !sale_type) continue;

      const result = dbUpsert(
        "sales",
        { sale_date, sale_type },
        {
          platform: platform || "",
          gross_amount: gross_amount ?? 0,
          commission_percent: commission_percent ?? 0,
          commission_amount: commission_amount ?? 0,
          net_amount: net_amount ?? (gross_amount ?? 0),
          settlement_status: settlement_status || "not_applicable",
          expected_settlement_date: expected_settlement_date || null,
          actual_settlement_date: null,
          notes: notes || "",
        }
      );
      results.push(result);
    }

    return NextResponse.json({ success: true, data: results }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales/bulk error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}