import { LevelDashboardCard } from "@/components/2_molecules/LevelDashboardCard";
import { SystemDashboardCard } from "@/components/2_molecules/SystemDashboardCard";
import { UserDashboardCard } from "@/components/2_molecules/UserDashboardCard";

export default function Dashboard() {
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <h2>대시보드</h2>
      <div className="grid gap-4 w-full grid-cols-3">
        <SystemDashboardCard />
        <LevelDashboardCard />
        <UserDashboardCard />
      </div>
    </section>
  );
}
