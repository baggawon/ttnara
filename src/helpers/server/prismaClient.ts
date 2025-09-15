import { PrismaClient } from "@prisma/client";
import { userExtension } from "@/lib/prisma/extensions";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaWithExtensions = new PrismaClient().$extends(userExtension);

export const prisma = globalForPrisma.prisma || prismaWithExtensions;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { Prisma, PrismaClient } from "@prisma/client";
