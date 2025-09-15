import { HydrationBoundary } from "@tanstack/react-query";
import SignupView from "@/app/(main)/signup/view";
import Logo from "@/components/1_atoms/Logo";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getDehydratedQueries } from "@/helpers/query";
import { serverGet } from "@/helpers/server/get";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";

export default async function Signup() {
  const queries = await getDehydratedQueries([
    {
      queryKey: [QueryKey.signupSettings],
      queryFn: () => serverGet(ApiRoute.signupRead),
    },
  ]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="mt-6 w-full sm:w-96">
        <CardHeader className="gap-4">
          <Logo href={AppRoute.Main} size="large" />
          <CardTitle className="mt-4 text-2xl">회원 가입</CardTitle>
        </CardHeader>
        <HydrationBoundary state={{ queries, mutations: [] }}>
          <SignupView />
        </HydrationBoundary>
      </Card>
    </div>
  );
}
