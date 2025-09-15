"use client";

import React, { useState } from "react";
import {
  QueryClientProvider,
  QueryClient,
  QueryErrorResetBoundary,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import useLoading from "@/helpers/customHook/useLoading";
import Loader from "@/components/1_atoms/Loader";
import { Toaster } from "@/components/ui/toaster";
import VersionManage from "@/components/1_atoms/VersionManage";
import ViewPortCalculator from "@/components/1_atoms/ViewPortCalculator";
import SessionManage from "@/components/1_atoms/SessionManage";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PriceProvider from "@/helpers/customHook/usePriceProvider";
import SubscribeSSE from "@/components/1_atoms/SubscribeSSE";
import SessionWrapper from "@/components/1_atoms/SessionWrapper";
function Providers({ children }: React.PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
          },
        },
      })
  );
  const { loading } = useLoading();
  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            onError={() => {
              window.location.reload();
            }}
            fallbackRender={({ resetErrorBoundary }) => (
              <Card className="w-[300px] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <CardHeader>
                  <CardTitle>연결에 문제가 있습니다.</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center">
                  <Button onClick={() => window.location.reload()}>
                    다시 시도
                  </Button>
                </CardContent>
              </Card>
            )}
          >
            <SessionWrapper>
              <PriceProvider>{children}</PriceProvider>
              <ReactQueryDevtools initialIsOpen={false} />
              {loading && (
                <div className="top-0 left-0 fixed z-[9999] w-screen h-screen bg-black/20">
                  <Loader />
                </div>
              )}
              <Toaster />
              <VersionManage />
              <ViewPortCalculator />
              <SessionManage />
              <SubscribeSSE />
            </SessionWrapper>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}

export default Providers;
