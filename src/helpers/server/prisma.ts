import type { Prisma, PrismaClient } from "@prisma/client";
import type { DefaultArgs } from "@prisma/client/runtime/library";
import { prisma } from "@/helpers/server/prismaClient";

export interface HandleConnectOptions {
  /**
   * Re-throw the failure as a `PrismaOperationError` instead of resolving to
   * `undefined`. Use it wherever an empty result and a failed query mean
   * different things - without it a rejected query is indistinguishable from
   * "nothing matched", and the real cause never reaches the caller.
   */
  rethrow?: boolean;
  /** Short call-site name, logged so the failure is greppable in prod. */
  label?: string;
}

export class PrismaOperationError extends Error {
  constructor(
    readonly label: string,
    override readonly cause: unknown
  ) {
    super(`prisma query failed${label ? ` (${label})` : ""}`);
    this.name = "PrismaOperationError";
  }
}

export const handleConnect = async <T = any>(
  func: (
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>
  ) => Promise<T | null>,
  options?: HandleConnectOptions
) => {
  try {
    return await func(prisma);
  } catch (error) {
    console.error(
      `[prisma] query failed${options?.label ? ` (${options.label})` : ""}`,
      error
    );
    if (options?.rethrow) {
      throw new PrismaOperationError(options.label ?? "", error);
    }
  }
};
