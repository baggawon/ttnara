import "@/app/globals.css";
import "@/app/fonts.css";
import Providers from "@/components/1_atoms/Provider";
import { version } from "@/helpers/config";
import { Inter } from "next/font/google";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/common/theme-provider";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `테더나라 - 테더 P2P 거래`,
  description: `테더(USDT) 실시간 시세 확인, 빗썸 기준 김치 프리미엄 분석, 테더 P2P·손대손 거래 지원 커뮤니티입니다. 테더 구매·판매, 재정거래 정보까지 테더나라에서 확인하세요.`,
  keywords: [
    "테더시세",
    "테더 p2p 거래",
    "usdt직거래",
    "테더otc거래",
    "김프재정거래",
  ],
};

export default function Layout(props: PropsWithChildren) {
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
          {/* <div className="w-screen h-screen fixed top-0 left-0 overflow-y-auto overflow-x-hidden"> */}
          <Providers>{props.children}</Providers>
          {/* </div> */}
        </ThemeProvider>
        <Script src="/__ENV.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
