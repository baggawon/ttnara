import AdminGuaranteeListForm from "./form";
import AdminGuaranteeBannerCard from "./banner";

export default function AdminGuarantee() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">공식보증업체 관리</h1>
      </div>
      <AdminGuaranteeBannerCard />
      <AdminGuaranteeListForm />
    </section>
  );
}
