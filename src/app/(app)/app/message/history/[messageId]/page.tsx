import MessageHistoryView from "@/app/(app)/app/message/history/[messageId]/view";

type Params = Promise<{ messageId: string }>;
export default async function Page(props: { params: Params }) {
  const { messageId } = await props.params;
  return <MessageHistoryView messageId={messageId} />;
}
