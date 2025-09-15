import type { ReactNode } from "react";
import { RightWidgets } from "@/components/3_organisms/RightWidgets";
import { LeftWidgets } from "@/components/3_organisms/LeftWidgets";

export default function Layout(props: { children: ReactNode }) {
  return (
    <>
      <div className="flex gap-4 w-full">
        {/* TODO: 미리보기 위젯 */}
        <LeftWidgets />
        <div className="w-full flex flex-col gap-4">{props.children}</div>
        <RightWidgets />
      </div>
    </>
  );
}
