import { Prisma } from "@prisma/client";
import { forEach, map } from "@/helpers/basic";
import { QueryKey } from "@/helpers/types";
import { userUpdateEmitter, type UserUpdateEvent } from "@/lib/eventEmitter";

const userExtension = Prisma.defineExtension((client) => {
  const makeExtension = async (
    prismaProps: any,
    events: { queryKey: QueryKey; userIds?: string[] }[]
  ) => {
    const { args, query } = prismaProps;
    const result = await query(args);

    try {
      if (userUpdateEmitter.listenerCount("userUpdate") > 0) {
        // Ensure we're sending the complete data structure
        forEach(events, ({ queryKey, userIds }) => {
          if (typeof userIds === "undefined") {
            const completeData: UserUpdateEvent = {
              userId: "관리자",
              data: {
                queryKey,
              },
            };

            userUpdateEmitter.emit("userUpdate", completeData);
          } else {
            forEach(userIds, (userId) => {
              const completeData = {
                userId,
                data: {
                  queryKey,
                },
              };

              userUpdateEmitter.emit("userUpdate", completeData);
            });
          }
        });
      }
    } catch (error) {
      console.error("Error emitting user update:", error);
    }
    return result;
  };
  return client.$extends({
    query: {
      user: {
        update: (prismaProps) =>
          makeExtension(prismaProps, [
            {
              queryKey: QueryKey.account,
              userIds: [prismaProps.args.where.id!],
            },
            {
              queryKey: QueryKey.session,
              userIds: [prismaProps.args.where.id!],
            },
          ]),
      },
      profile: {
        update: (prismaProps) =>
          makeExtension(prismaProps, [
            {
              queryKey: QueryKey.account,
              userIds: [prismaProps.args.where.uid!],
            },
            {
              queryKey: QueryKey.session,
              userIds: [prismaProps.args.where.uid!],
            },
          ]),
      },
      tether: {
        create: (prismaProps) =>
          makeExtension(prismaProps, [
            { queryKey: QueryKey.tethers },
            { queryKey: QueryKey.summaryThreads },
          ]),
        update: (prismaProps) =>
          makeExtension(prismaProps, [
            { queryKey: QueryKey.tethers },
            { queryKey: QueryKey.summaryThreads },
          ]),
      },
      tether_proposal: {
        update: (prismaProps) =>
          makeExtension(prismaProps, [
            { queryKey: QueryKey.tethers },
            { queryKey: QueryKey.summaryThreads },
          ]),
      },
      alarm: {
        create: (prismaProps) =>
          makeExtension(prismaProps, [
            {
              queryKey: QueryKey.alarms,
              userIds: [prismaProps.args.data.user_id!],
            },
          ]),
      },
      message_inbox: {
        createMany: (prismaProps) =>
          makeExtension(prismaProps, [
            {
              queryKey: QueryKey.account,
              userIds: map(
                prismaProps.args.data as Prisma.message_inboxCreateManyInput[],
                (data) => data.to_uid
              ),
            },
            { queryKey: QueryKey.message },
          ]),
        update: (prismaProps) =>
          makeExtension(prismaProps, [
            {
              queryKey: QueryKey.account,
              userIds: [prismaProps.args.where.to_uid! as string],
            },
          ]),
      },
    },
  });
});

export { userExtension };
