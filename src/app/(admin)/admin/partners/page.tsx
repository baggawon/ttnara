import AdminPartnersListForm from "./form";

export default function AdminPartners() {
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">협력사 관리</h1>
      </div>
      <AdminPartnersListForm />
    </section>
  );
}
