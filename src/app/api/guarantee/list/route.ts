import { NextResponse } from "next/server";
import { GET as getGuarantee } from "./index";

export async function GET() {
  try {
    const result = await getGuarantee();

    if (result.result) {
      return NextResponse.json(result);
    } else {
      throw new Error("Failed to get guarantee data");
    }
  } catch (error) {
    console.error("Public guarantee list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guarantee" },
      { status: 500 }
    );
  }
}
