"use client";

import { FormProvider } from "react-hook-form";
import { useAdminAttendanceHook } from "./hook";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import Form from "@/components/1_atoms/Form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableSSR } from "@/components/2_molecules/Table/DataTableSSR";
import { validateNumber } from "@/helpers/validate";
import AttendanceStreakCreateSheet from "./AttendanceStreakCreateSheet";
import AttendanceStreakEditSheet from "./AttendanceStreakEditSheet";

export default function AdminAttendancePage() {
  const {
    settingMethods,
    saveSetting,
    isSavingSetting,
    columns,
    streaksData,
    setPage,
    editStreakId,
    setEditStreakId,
  } = useAdminAttendanceHook();

  const editingStreak =
    streaksData?.streaks.find((s) => s.id === editStreakId) ?? null;

  return (
    <section className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">출석체크 관리</h2>

      <Card>
        <CardHeader>
          <CardTitle>출석 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <FormProvider {...settingMethods}>
            <Form onSubmit={saveSetting} className="space-y-4 max-w-md">
              <FormBuilder name="is_enabled" label="출석체크 활성화">
                <div className="w-full">
                  <SwitchInput name="is_enabled" />
                </div>
              </FormBuilder>
              <FormInput
                name="daily_points"
                type={InputType.number}
                label="기본 출석 포인트"
                min={0}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingSetting}>
                  저장
                </Button>
              </div>
            </Form>
          </FormProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>연속 출석 보너스</CardTitle>
            <AttendanceStreakCreateSheet />
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            연속 출석이 설정한 연속일수에 도달하면 추가 보너스를 지급합니다.
            가장 큰 연속일수에 도달하면 다음 날부터 1일차로 순환합니다.
          </p>
          <DataTableSSR
            columns={columns}
            data={streaksData?.streaks ?? []}
            setPageIndexAction={setPage}
            pagination={streaksData?.pagination}
          />
        </CardContent>
      </Card>

      <AttendanceStreakEditSheet
        streak={editingStreak}
        onClose={() => setEditStreakId(null)}
      />
    </section>
  );
}
