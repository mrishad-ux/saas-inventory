import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpsert } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    initDb();
    const body = await request.json();
    const { log_date, gas_changed } = body;
    const today = log_date || new Date().toISOString().split("T")[0];

    // We store gas_changed on a dummy inventory_log for date
    // Use a special inventory_item_id of 0 for gas
    const log = dbUpsert(
      "inventory_logs",
      { inventory_item_id: 0, log_date: today },
      { gas_changed: gas_changed === true || gas_changed === "true" }
    );

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}