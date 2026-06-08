import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let staff = dbQuery("staff");

    if (status) {
      staff = staff.filter((s: any) => s.status === status);
    }

    staff.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, role, phone, salary_type, salary_amount, joining_date, status } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const staff = dbCreate("staff", {
      name,
      role: role || "",
      phone: phone || "",
      salary_type: salary_type || "monthly",
      salary_amount: salary_amount ?? 0,
      joining_date: joining_date || new Date().toISOString().split("T")[0],
      status: status || "active",
    });

    return NextResponse.json({ success: true, data: staff }, { status: 201 });
  } catch (error) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}