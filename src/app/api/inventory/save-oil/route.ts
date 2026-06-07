import { NextRequest, NextResponse } from "next/server";
import { initDb, dbUpsert } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    initDb();
    const body = await request.json();
    const { log_date, l1, l2, r1, r2, mayo, sauces } = body;
    const today = log_date || new Date().toISOString().split("T")[0];

    const log = dbUpsert(
      "inventory_logs",
      { inventory_item_id: -2, log_date: today },
      {
        oil_l1_packets: Number(l1) || 0,
        oil_l2_packets: Number(l2) || 0,
        oil_r1_packets: Number(r1) || 0,
        oil_r2_packets: Number(r2) || 0,
        oil_mayo_packets: Number(mayo) || 0,
        oil_sauces_packets: Number(sauces) || 0,
      }
    );

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}