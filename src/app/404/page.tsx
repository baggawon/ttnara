import Logo from "@/components/1_atoms/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppRoute } from "@/helpers/types";
import Link from "next/link";

export default function Page() {
  return (
    <div className="absolute w-full sm:w-fit left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <Card>
        <CardHeader>
          <Logo href={AppRoute.Main} size="large" />
        </CardHeader>
        <CardContent className="text-center flex flex-col gap-4">
          페이지를 찾을 수 없습니다.
          <Button type="button" className="w-fit mx-auto">
            <Link href={AppRoute.Main}>메인으로</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
