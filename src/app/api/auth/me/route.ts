import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const { user } = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}