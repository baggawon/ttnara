import MessageInboxView from "@/app/(app)/app/message/inbox/view";
// import { getDehydratedQueries, Hydrate } from "@/helpers/query";
// import { serverGet } from "@/helpers/server/get";
// import { ApiRoute, QueryKey } from "@/helpers/types";
// import { convertMessageData } from "@/app/(app)/app/message/inbox/utils";

// export default async function MessageInbox() {
export default function MessageInbox() {
  // const queries = await getDehydratedQueries([
  //   {
  //     queryKey: [QueryKey.message],
  //     queryFn: async () => {
  //       const data = await serverGet(ApiRoute.messageRead, {
  //         history: true,
  //         inbox: true,
  //       });
  //       return {
  //         history: convertMessageData(data.history, "to_uid"),
  //         inbox: convertMessageData(data.inbox, "from_uid"),
  //       };
  //     },
  //   },
  // ]);

  return (
    // <Hydrate state={{ queries }}>
    <MessageInboxView />
    // </Hydrate>
  );
}
