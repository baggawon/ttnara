import AdminUserViewForm from "./form";

type Params = Promise<{ user_id: string }>;

export default async function AdminUserView(props: { params: Params }) {
  const [params] = await Promise.all([props.params]);

  const user_id = String(params.user_id);
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <AdminUserViewForm user_id={user_id} />
    </section>
  );
}
