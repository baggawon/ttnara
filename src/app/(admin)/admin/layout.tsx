import type { ReactNode } from "react";
import MainFooterWidget from "@/components/1_atoms/MainFooterWidget";
import { AdminTopNavigation } from "@/components/3_organisms/AdminTopNavigation";

export default function Layout(props: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <AdminTopNavigation />
      <div className="flex-1 h-full w-full mx-auto">{props.children}</div>
    </main>
  );
}
