import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

import { handleConnect } from "@/helpers/server/prisma";

interface Step {
  label: string;
  count: number;
  color: string;
}

export async function RealVerificationFunnelCard() {
  const result = await handleConnect(async (prisma) => {
    const [total, phone, email, kyc] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { phone_is_validated: true } }),
      prisma.profile.count({ where: { email_is_validated: true } }),
      prisma.profile.count({ where: { kyc_id: { not: null } } }),
    ]);
    return { total, phone, email, kyc };
  });

  const total = result?.total ?? 0;
  const steps: Step[] = [
    { label: "전체 사용자", count: result?.total ?? 0, color: "#6366f1" },
    { label: "휴대폰 인증", count: result?.phone ?? 0, color: "#0ea5e9" },
    { label: "이메일 인증", count: result?.email ?? 0, color: "#10b981" },
    { label: "KYC 완료", count: result?.kyc ?? 0, color: "#f59e0b" },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> 인증 현황
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          전체 사용자 대비 인증 비율
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        {total === 0 ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            사용자 데이터가 없습니다.
          </div>
        ) : (
          <ul className="flex h-full flex-col justify-between gap-4 text-sm">
            {steps.map((step) => {
              const pct = total > 0 ? (step.count / total) * 100 : 0;
              return (
                <li key={step.label} className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 font-medium">{step.label}</span>
                    <span className="text-lg font-bold tabular-nums">
                      {step.count.toLocaleString()}
                    </span>
                    <span className="w-14 text-right text-xs text-muted-foreground">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: step.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
