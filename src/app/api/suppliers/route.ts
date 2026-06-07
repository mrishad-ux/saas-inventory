import { NextResponse } from "next/server";
import { initDb, dbQuery } from "@/lib/db";

export async function GET() {
  try {
    initDb();
    const suppliers = dbQuery("suppliers");
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}