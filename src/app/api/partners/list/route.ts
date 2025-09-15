import { NextResponse } from "next/server";
import { GET as getPartners } from "./index";

export async function GET() {
  try {
    const result = await getPartners();

    if (result.result) {
      return NextResponse.json(result);
    } else {
      throw new Error("Failed to get partners data");
    }
  } catch (error) {
    console.error("Public partners list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}
