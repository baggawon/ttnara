import { NextResponse } from "next/server";
import { GET as initializeDataGET } from "@/app/api/initialize/data";

export const ResponseValues = <T>() => ({
  json: async (json: T) => {
    const { data } = await initializeDataGET();

    const response = NextResponse.json(json);
    response.cookies.set("site_settings", JSON.stringify(data), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/",
      sameSite: "lax",
    });
    return response;
  },
});
