import AdminPopupListForm from "./form";

export default function AdminPopup() {
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">팝업 관리</h1>
      </div>
      <AdminPopupListForm />
    </section>
  );
}
