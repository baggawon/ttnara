import SupportTabs from "./SupportTabs";

export default function AdminSupportPage() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">고객센터 관리</h1>
      </div>
      <SupportTabs />
    </section>
  );
}
