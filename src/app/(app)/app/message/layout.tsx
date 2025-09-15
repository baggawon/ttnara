import MessageMenu from "@/components/1_atoms/MessageMenu";
import { type ReactNode } from "react";

export default function Layout(props: { children: ReactNode }) {
  return (
    <div className="w-full">
      <MessageMenu />
      <div className="w-full p-4">{props.children}</div>
    </div>
  );
}
