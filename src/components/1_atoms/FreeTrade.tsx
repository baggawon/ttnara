import clsx from "clsx";
import { TetherMethods } from "@/helpers/types";
import { Users } from "lucide-react";

export const FreeTrade = ({ className }: { className?: string }) => {
  return (
    <div className={clsx("flex gap-1 items-center", className)}>
      <Users className="w-4 h-4" />
      <p>{TetherMethods.Public}</p>
    </div>
  );
};
