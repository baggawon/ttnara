import type { ReactNode } from "react";
import { AdminTopNavigation } from "@/components/3_organisms/AdminTopNavigation";

export const dynamic = "force-dynamic";

export default function Layout(props: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <AdminTopNavigation />
      <div className="flex-1 h-full w-full mx-auto px-3 sm:px-6 lg:px-8 pb-6">
        {props.children}
      </div>
    </main>
  );
}
