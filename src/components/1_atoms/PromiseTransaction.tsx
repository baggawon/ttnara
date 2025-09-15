import clsx from "clsx";
import { TetherMethods } from "@/helpers/types";
import { Handshake } from "lucide-react";

export const PromiseTransaction = ({ className }: { className?: string }) => {
  return (
    <div className={clsx("flex gap-1 items-center", className)}>
      <Handshake className="w-5 h-5" />
      <p>{TetherMethods.Promise}</p>
    </div>
  );
};
