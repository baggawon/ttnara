import type { Metadata } from "next";
import { NavigationManager } from "@/app/(admin)/admin/navigation/NavigationManager";
import { buildPageTitle } from "@/helpers/server/brandSettings";

export const generateMetadata = async (): Promise<Metadata> => ({
  title: await buildPageTitle("메뉴 관리"),
});

export default function Page() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div>
        <h2>메뉴 관리</h2>
        <p className="text-sm text-muted-foreground">
          상단 메뉴와 모바일 하단 메뉴를 직접 추가/수정/삭제하고 순서를 변경할
          수 있습니다.
        </p>
      </div>
      <NavigationManager />
    </section>
  );
}
