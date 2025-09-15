import { Button } from "@/components/ui/button";
import { AppRoute } from "@/helpers/types";
import Link from "next/link";

const AccountNavigationWidget = () => {
  return (
    <nav className="w-full flex justify-center">
      <Link href={AppRoute.Signup}>
        <Button type="button" variant="ghost">
          회원가입
        </Button>
      </Link>
      <Link href={AppRoute.Forgot}>
        <Button type="button" variant="ghost">
          아이디 및 비밀번호찾기
        </Button>
      </Link>
    </nav>
  );
};

export default AccountNavigationWidget;
