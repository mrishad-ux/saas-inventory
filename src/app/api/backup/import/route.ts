import { NextRequest, NextResponse } from "next/server";
import { initDb, importDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body || !body.users || !body.nextId) {
      return NextResponse.json(
        { success: false, error: "Invalid backup data. Must contain 'users' and 'nextId'." },
        { status: 400 }
      );
    }

    const jsonStr = JSON.stringify(body);
    const result = importDb(jsonStr);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Failed to import data. Invalid format." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { message: "Data imported successfully" } });
  } catch (error) {
    console.error("POST /api/backup/import error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}