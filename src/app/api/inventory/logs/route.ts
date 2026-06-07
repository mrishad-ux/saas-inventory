import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate, dbUpsert } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    initDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    let logs;
    if (date) {
      logs = dbQuery("inventory_logs", (l: any) => l.log_date === date);
    } else {
      logs = dbQuery("inventory_logs");
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    initDb();
    const body = await request.json();
    const {
      inventory_item_id,
      log_date,
      opening,
      purchased,
      consumption,
      wastage,
      closing,
      notes,
    } = body;

    if (!inventory_item_id || !log_date) {
      return NextResponse.json(
        {
          success: false,
          error: "inventory_item_id and log_date are required",
        },
        { status: 400 }
      );
    }

    // Upsert: if a log already exists for this item+date, update it
    const log = dbUpsert(
      "inventory_logs",
      { inventory_item_id: Number(inventory_item_id), log_date },
      {
        opening: Number(opening) || 0,
        opening_source: "manual",
        purchased: Number(purchased) || 0,
        total:
          (Number(opening) || 0) + (Number(purchased) || 0),
        consumption: Number(consumption) || 0,
        wastage: Number(wastage) || 0,
        closing: Number(closing) || 0,
        notes: notes || "",
      }
    );

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}