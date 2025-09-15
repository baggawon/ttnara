import { Button } from "@/components/ui/button";
import { AppRoute } from "@/helpers/types";
import Link from "next/link";

const ForgotNavigationWidget = () => {
  return (
    <nav className="w-full flex justify-center">
      <Link href={AppRoute.Login}>
        <Button type="button" variant="ghost">
          로그인
        </Button>
      </Link>
      <Link href={AppRoute.Signup}>
        <Button type="button" variant="ghost">
          회원가입
        </Button>
      </Link>
    </nav>
  );
};

export default ForgotNavigationWidget;
