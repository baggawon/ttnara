import { PartnerBanners } from "@/components/1_atoms/PartnerBanners";

export const LeftWidgets = () => {
  return (
    <section className="min-w-[248px] max-w-[248px] h-fit hidden flex-col md:flex gap-4 sticky top-4">
      <PartnerBanners position="left" displayMode="pc" />
    </section>
  );
};
