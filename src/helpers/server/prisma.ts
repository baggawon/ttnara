import type { Prisma, PrismaClient } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { prisma } from "@/helpers/server/prismaClient";

export const handleConnect = async <T = any>(
  func: (
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
  ) => Promise<T | null>
) => {
  try {
    await prisma.$connect();
    const data = await func(prisma);
    await prisma.$disconnect();
    return data;
  } catch (error) {
    console.log("error", error);
    await prisma.$disconnect();
  }
};
