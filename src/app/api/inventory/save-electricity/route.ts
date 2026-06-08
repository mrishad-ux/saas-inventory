import { getAuthUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpsert } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthUser();
    if (!user || !["admin", "manager"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    initDb();
    const body = await request.json();
    const { log_date, electricity_reading } = body;
    const today = log_date || new Date().toISOString().split("T")[0];

    const log = dbUpsert(
      "inventory_logs",
      { inventory_item_id: -1, log_date: today },
      { electricity_reading: Number(electricity_reading) || 0 }
    );

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}