"use server";

import { makeQueryParams } from "@/helpers/common";
import { version } from "@/helpers/config";
import type { ApiRoute } from "@/helpers/types";
import { headers } from "next/headers";

export const serverGet = async (route: ApiRoute, params?: any) => {
  const headersList = await headers();
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "Platypus:3000"
      : headersList.get("host");
  const forwardedProto = headersList.get("x-forwarded-proto");

  // x-forwarded-proto 헤더가 있으면 사용하고, 없으면 환경에 따라 기본값 설정
  const protocol =
    process.env.NODE_ENV === "production" ? "http" : forwardedProto;

  const response = await fetch(
    `${protocol}://${baseUrl}${route}${makeQueryParams({ ...(params && params), version })}`,
    {
      headers: Object.fromEntries(headersList),
      cache: "no-store",
    }
  );

  if (response.ok) {
    const json = await response.json();
    if (json?.data) return json.data;
  }
  return null;
};
