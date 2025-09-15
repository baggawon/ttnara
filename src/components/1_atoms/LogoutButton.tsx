"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/helpers/common";
import { LogOut } from "lucide-react";

export const LogoutButton = () => {
  return (
    <Button
      type="button"
      onClick={() => signOut()}
      className="text-xs p-2 h-fit noto-sans-kr"
    >
      로그아웃
      <LogOut className="h-4 w-4 ml-2" />
    </Button>
  );
};
