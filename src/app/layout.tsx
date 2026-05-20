import "@/app/globals.css";
import "@/app/fonts.css";
import Providers from "@/components/1_atoms/Provider";
import { BrandProvider } from "@/components/1_atoms/BrandProvider";
import { getBrandSettings } from "@/helpers/server/brandSettings";
import { version } from "@/helpers/config";
import { Inter } from "next/font/google";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/common/theme-provider";
const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return {
    title: brand.siteTitle,
    description: brand.siteDescription,
    keywords: brand.siteKeywords,
    icons: brand.faviconUrl
      ? {
          icon: brand.faviconUrl,
          shortcut: brand.faviconUrl,
          apple: brand.appleIconUrl ?? brand.faviconUrl,
        }
      : undefined,
  };
}

export default async function Layout(props: PropsWithChildren) {
  const brand = await getBrandSettings();
  return (
    <html lang="ko" translate="no" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <address hidden>{version}</address>
          <BrandProvider brand={brand}>
            <Providers>{props.children}</Providers>
          </BrandProvider>
        </ThemeProvider>
        <Script src="/__ENV.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
