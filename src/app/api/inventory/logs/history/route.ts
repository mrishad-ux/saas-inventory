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

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let logs = dbQuery("inventory_logs");

    if (from) {
      logs = logs.filter((l: any) => l.log_date >= from);
    }
    if (to) {
      logs = logs.filter((l: any) => l.log_date <= to);
    }

    // Join with item names
    const items = dbQuery("inventory_items");
    const itemMap = new Map(items.map((i: any) => [i.id, i]));

    const enriched = logs.map((log: any) => ({
      ...log,
      item_name: itemMap.get(log.inventory_item_id)?.name || "Unknown",
    }));

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const log of enriched) {
      if (!grouped[log.log_date]) {
        grouped[log.log_date] = [];
      }
      grouped[log.log_date].push(log);
    }

    // Convert to sorted array
    const result = Object.entries(grouped)
      .map(([date, logs]) => ({ date, logs }))
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("GET /api/inventory/logs/history error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}