import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/app", "/404", "/api"],
      },
    ],
    sitemap: "https://ttnara.com/sitemap.xml",
  };
}
