import { redirect } from "next/navigation";
import { cache } from "react";
import { handleConnect } from "@/helpers/server/prisma";
import { AppRoute } from "@/helpers/types";

const getUseTetherBoard = cache(async (): Promise<boolean> => {
  const settings = await handleConnect((prisma) =>
    prisma.tether_setting.findFirst({ select: { use_tether_board: true } })
  );
  return settings ? settings.use_tether_board : true;
});

export const isTetherEnabled = async (): Promise<boolean> => {
  return getUseTetherBoard();
};

export const requireTetherEnabled = async (): Promise<void> => {
  if (!(await isTetherEnabled())) {
    redirect(AppRoute.Main);
  }
};
