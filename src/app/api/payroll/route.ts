import { NextRequest, NextResponse } from "next/server";
import { initDb, dbQuery, dbCreate } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");

    let payrolls = dbQuery("payroll");

    if (staffId) {
      const idNum = parseInt(staffId, 10);
      if (!isNaN(idNum)) {
        payrolls = payrolls.filter((p: any) => p.staff_id === idNum);
      }
    }

    // Join with staff names
    const staffList = dbQuery("staff");
    const staffMap = new Map(staffList.map((s: any) => [s.id, s]));

    const enriched = payrolls.map((p: any) => ({
      ...p,
      staff_name: staffMap.get(p.staff_id)?.name || "Unknown",
    }));

    enriched.sort((a: any, b: any) => b.payment_date.localeCompare(a.payment_date) || b.id - a.id);

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("GET /api/payroll error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const { user } = await getAuthUser();
    if (!user || (user.role !== "admin" && user.role !== "accounts")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { staff_id, payment_date, days_worked, basic_amount, bonus, deduction, net_amount, status, notes } = body;

    if (!staff_id || !payment_date) {
      return NextResponse.json(
        { success: false, error: "staff_id and payment_date are required" },
        { status: 400 }
      );
    }

    const payroll = dbCreate("payroll", {
      staff_id,
      payment_date,
      days_worked: days_worked ?? 0,
      basic_amount: basic_amount ?? 0,
      bonus: bonus ?? 0,
      deduction: deduction ?? 0,
      net_amount: net_amount ?? 0,
      status: status || "unpaid",
      notes: notes || "",
    });

    return NextResponse.json({ success: true, data: payroll }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payroll error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}