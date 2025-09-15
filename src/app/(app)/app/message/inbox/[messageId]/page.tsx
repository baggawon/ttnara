import MessageInboxDetailView from "@/app/(app)/app/message/inbox/[messageId]/view";

type Params = Promise<{ messageId: string }>;
export default async function Page(props: { params: Params }) {
  const { messageId } = await props.params;
  return <MessageInboxDetailView messageId={messageId} />;
}
