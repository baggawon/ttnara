import { SystemControlPanel } from "./SystemControlPanel";

export default function SystemControlPage() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2>거래 시스템 제어</h2>
        <p className="text-sm text-muted-foreground">
          P2P 거래 시스템의 비상 제어 도구입니다. 각 작업은 모든 사용자에게 즉시
          영향을 주므로 신중하게 사용해주세요.
        </p>
      </div>

      <SystemControlPanel />
    </section>
  );
}
