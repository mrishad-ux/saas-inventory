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

    const settlements = dbQuery("platform_settlements");
    settlements.sort((a: any, b: any) => b.period_to.localeCompare(a.period_to) || b.id - a.id);

    return NextResponse.json({ success: true, data: settlements });
  } catch (error) {
    console.error("GET /api/settlements error:", error);
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
    const { platform, period_from, period_to, expected_credit_date, gross_amount, estimated_commission, estimated_net, status, notes } = body;

    if (!platform || !period_from || !period_to) {
      return NextResponse.json(
        { success: false, error: "platform, period_from, and period_to are required" },
        { status: 400 }
      );
    }

    const settlement = dbCreate("platform_settlements", {
      platform,
      period_from,
      period_to,
      expected_credit_date: expected_credit_date || "",
      actual_credit_date: null,
      gross_amount: gross_amount ?? 0,
      estimated_commission: estimated_commission ?? 0,
      estimated_net: estimated_net ?? (gross_amount ?? 0),
      actual_amount_received: null,
      actual_commission: null,
      status: status || "pending",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: settlement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/settlements error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}