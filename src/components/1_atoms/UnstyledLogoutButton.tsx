"use client";

import clsx from "clsx";
import { signOut } from "@/helpers/common";
import { LogOut } from "lucide-react";

export const UnstyledLogoutButton = ({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) => {
  const testSignOut = () => {
    alert("fake logout");
  };
  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={clsx("flex items-start gap-2", className)}
    >
      로그아웃
    </button>
  );
};
