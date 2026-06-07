import { NextResponse } from "next/server";
import { initDb, exportDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const jsonData = exportDb();

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="saas-inventory-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/backup/export error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}