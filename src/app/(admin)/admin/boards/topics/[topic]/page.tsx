import { BoardTopicsForm } from "./form";
type Params = Promise<{ topic: string }>;

export default async function BoardTopics(props: { params: Params }) {
  const [params] = await Promise.all([props.params]);

  const topic_id = Number(params.topic);
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <BoardTopicsForm topic_id={topic_id} />
    </section>
  );
}
