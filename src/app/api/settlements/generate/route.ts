import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get all sales with pending settlement status, grouped by platform
    const pendingSales = dbQuery(
      "sales",
      (s: any) => s.settlement_status === "pending" && (s.sale_type === "swiggy" || s.sale_type === "zomato")
    );

    // Group by platform and week
    const groups: Record<string, any[]> = {};
    for (const sale of pendingSales) {
      const date = new Date(sale.sale_date);
      // Get Monday of the week
      const dayOfWeek = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const key = `${sale.platform || sale.sale_type}_${monday.toISOString().split("T")[0]}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(sale);
    }

    const created = [];
    for (const [key, sales] of Object.entries(groups)) {
      const firstSale = sales[0];
      const dates = sales.map((s: any) => new Date(s.sale_date));
      const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));

      // Get Monday of the earliest sale's week
      const dayOfWeek = minDate.getDay();
      const periodFrom = new Date(minDate);
      periodFrom.setDate(minDate.getDate() - ((dayOfWeek + 6) % 7));

      // Get Sunday of the latest sale's week
      const lastDayOfWeek = maxDate.getDay();
      const periodTo = new Date(maxDate);
      periodTo.setDate(maxDate.getDate() + (6 - ((lastDayOfWeek + 6) % 7)));

      const grossAmount = sales.reduce((sum: number, s: any) => sum + (s.gross_amount || 0), 0);
      const commissionAmount = sales.reduce((sum: number, s: any) => sum + (s.commission_amount || 0), 0);
      const netAmount = sales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);

      const platform = firstSale.platform || firstSale.sale_type;
      const platformKey = firstSale.sale_type;

      // Check if settlement already exists for this period+platform
      const existing = dbQuery(
        "platform_settlements",
        (s: any) =>
          s.platform === platformKey &&
          s.period_from === periodFrom.toISOString().split("T")[0] &&
          s.period_to === periodTo.toISOString().split("T")[0]
      );

      if (existing.length > 0) continue;

      const settlement = dbCreate("platform_settlements", {
        platform: platformKey,
        period_from: periodFrom.toISOString().split("T")[0],
        period_to: periodTo.toISOString().split("T")[0],
        expected_credit_date: "",
        actual_credit_date: null,
        gross_amount: parseFloat(grossAmount.toFixed(2)),
        estimated_commission: parseFloat(commissionAmount.toFixed(2)),
        estimated_net: parseFloat(netAmount.toFixed(2)),
        actual_amount_received: null,
        actual_commission: null,
        status: "pending",
        notes: `Auto-generated from ${sales.length} pending sales`,
      });

      created.push(settlement);
    }

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/settlements/generate error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}