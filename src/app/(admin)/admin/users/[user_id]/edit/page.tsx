import AdminUserEditForm from "./form";

type Params = Promise<{ user_id: string }>;

export default async function AdminUserEdit(props: { params: Params }) {
  const [params] = await Promise.all([props.params]);

  const user_id = String(params.user_id);
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <AdminUserEditForm user_id={user_id} />
    </section>
  );
}
