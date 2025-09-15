import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  AdminAppRoute,
  ApiRoute,
  AppRoute,
  AuthRootUrls,
} from "@/helpers/types";
import { isCuid } from "@paralleldrive/cuid2";

const noAuthUrls = [AppRoute.Signup, AppRoute.Login, AppRoute.ForgotPassword];

export const parseSiteSettings = (setCookie) => {
  if (!setCookie) return null;

  try {
    // 정규식으로 site_settings 쿠키 값 추출
    const match = setCookie.match(/site_settings=([^;]*)/);
    const encodedValue = match ? match[1] : null;

    // URL 디코딩
    const decodedValue = decodeURIComponent(encodedValue);

    return decodedValue;
  } catch (error) {
    console.error("Error parsing site settings cookie:", error);
    return null;
  }
};

export default withAuth(
  function middleware(req) {
    const targetUrl = new URL(req.url).pathname;
    const shouldRunMiddleware =
      targetUrl.startsWith("/app/") ||
      targetUrl.startsWith("/admin/") ||
      targetUrl.startsWith("/board/tether/") ||
      targetUrl.startsWith("/api/") ||
      (!targetUrl.startsWith("/sitemap/") &&
        targetUrl !== "/sitemap.xml" &&
        !targetUrl.startsWith("/_next/") &&
        targetUrl !== "/favicon.ico");

    if (!shouldRunMiddleware) {
      return NextResponse.next();
    }

    if (targetUrl.startsWith("/api")) {
      const origin = req.headers.get("origin");
      const response = NextResponse.next();

      const allowedOrigins = [
        "https://테더나라.com",
        "https://www.테더나라.com",
        "https://xn--910bw5ci5ee37a.com",
        "https://www.xn--910bw5ci5ee37a.com",
        "https://xn--o79ak3ejvsh0c.com",
        "https://www.xn--o79ak3ejvsh0c.com",
        process.env.NEXTAUTH_URL,
      ];
      response.headers.set(
        "Access-Control-Allow-Origin",
        allowedOrigins.includes(origin) ? origin : process.env.NEXTAUTH_URL
      );
      response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      return response;
    }
    try {
      let siteSettings = req.cookies.get("site_settings");

      if (!siteSettings?.value) {
        const siteSettingsValue = parseSiteSettings(siteSettings);
        siteSettings = { value: siteSettingsValue };
      }

      if (siteSettings?.value) {
        const settings = JSON.parse(siteSettings.value);

        if (!settings.allow_login && !targetUrl.includes(AppRoute.Main)) {
          return NextResponse.redirect(new URL(AppRoute.Main, req.url));
        }

        if (
          settings.maintenance_mode &&
          !targetUrl.includes(AppRoute.Error404) &&
          !targetUrl.includes(ApiRoute.initialize)
        ) {
          return NextResponse.redirect(new URL(AppRoute.Error404, req.url));
        }

        if (
          settings.allow_user_registration === false &&
          targetUrl.includes(AppRoute.Signup) &&
          !targetUrl.includes(ApiRoute.signup)
        ) {
          return NextResponse.redirect(new URL(AppRoute.Main, req.url));
        }
      }
    } catch (_) {}

    const isAuthPageWithNoAuth =
      !req.nextauth.token &&
      Object.values(AuthRootUrls).some((url) => targetUrl.includes(url));

    const isAdminPageWithNoAuth =
      (!req.nextauth.token?.is_app_admin || !req.nextauth.token) &&
      targetUrl.includes(AuthRootUrls.admin);

    const isPageWithAuth = req.nextauth.token && noAuthUrls.includes(targetUrl);

    const isNeedDisplay =
      targetUrl !== AppRoute.AccountSetting &&
      targetUrl !== AppRoute.Tether &&
      req.nextauth.token &&
      isCuid(req.nextauth.token.displayname) &&
      req.nextauth.token.displayname.length === 24;

    const isAppPageWithAdminAuth =
      req.nextauth.token?.is_app_admin &&
      targetUrl.includes(AuthRootUrls.app) &&
      !targetUrl.startsWith(`${AuthRootUrls.app}/message`) &&
      !targetUrl.startsWith(`${AuthRootUrls.app}/settings`);

    if (isAuthPageWithNoAuth || isAdminPageWithNoAuth || isPageWithAuth) {
      return NextResponse.redirect(new URL(AppRoute.Main, req.url));
    }
    if (isAppPageWithAdminAuth) {
      return NextResponse.redirect(new URL(AdminAppRoute.Dashboard, req.url));
    }

    if (isNeedDisplay) {
      return NextResponse.redirect(new URL(AppRoute.AccountSetting, req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const targetUrl = new URL(req.url).pathname;

        if (targetUrl.startsWith("/api")) {
          return true;
        }

        const isAuthPageWithNoAuth =
          !token &&
          Object.values(AuthRootUrls).some((url) => targetUrl.includes(url));

        const isAdminPageWithNoAuth =
          (!token?.is_app_admin || !token) &&
          targetUrl.includes(AuthRootUrls.admin);

        const isPageWithAuth =
          token &&
          noAuthUrls.includes(targetUrl) &&
          !req.nextUrl.search.includes("callbackUrl");

        const isAppPageWithAdminAuth =
          token?.is_app_admin &&
          targetUrl.includes(AuthRootUrls.app) &&
          !targetUrl.startsWith(`${AuthRootUrls.app}/message`) &&
          !targetUrl.startsWith(`${AuthRootUrls.app}/settings`);

        if (
          isAuthPageWithNoAuth ||
          isPageWithAuth ||
          isAdminPageWithNoAuth ||
          isAppPageWithAdminAuth
        ) {
          return false;
        }
        return true;
      },
    },
  }
);
