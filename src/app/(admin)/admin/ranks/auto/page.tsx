"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { useAdminRanksAutoCreateHook } from "./hook";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import { validateNumber } from "@/helpers/validate";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// this page takes max rank number and max trade count
// then it creates ranks from 1 to max rank number with trade count from 0 to max trade count
// with sensible increment at each rank in between
export default function RanksAutoCreatePage() {
  const {
    methods,
    submit,
    goBack,
    simulate,
    simulatedRanks,
    hasSimulated,
    chartData,
  } = useAdminRanksAutoCreateHook();

  return (
    <FormProvider {...methods}>
      <Form onSubmit={submit}>
        <section className="flex flex-col gap-4 p-0 md:p-4">
          <Card>
            <CardHeader>
              <CardTitle>자동 랭크 추가</CardTitle>
            </CardHeader>
            <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <FormInput
                name="maxRank"
                label="최대 랭크 수"
                type={InputType.number}
                validate={(value) => validateNumber({ value, min: 1 })}
              />
              <FormInput
                name="maxTradeCount"
                label="최대 거래 횟수"
                type={InputType.number}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <FormBuilder name="progressionType" label="진행 유형">
                <SelectInput
                  name="progressionType"
                  items={[
                    { value: "linear", label: "선형" },
                    { value: "convex", label: "오목" },
                    { value: "concave", label: "볼록" },
                  ]}
                  buttonClassName="w-full"
                />
              </FormBuilder>
              <WithUseWatch name={["progressionType"]}>
                {({
                  progressionType,
                }: {
                  progressionType: "linear" | "convex" | "concave";
                }) => (
                  <FormInput
                    name="progressionRate"
                    label="진행 속도"
                    type={InputType.number}
                    min={1}
                    max={5}
                    step={0.1}
                    disabled={progressionType === "linear"}
                    validate={(value) =>
                      validateNumber({ value, min: 1, max: 5 })
                    }
                  />
                )}
              </WithUseWatch>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full gap-2">
                <Button type="button" onClick={goBack} variant="outline">
                  목록으로
                </Button>
                <Button
                  type="button"
                  onClick={() => simulate(methods.getValues())}
                >
                  계산
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>랭크 생성 시뮬레이션</CardTitle>
            </CardHeader>
            <CardContent className="mt-6">
              {!hasSimulated ? (
                <div className="text-center text-muted-foreground">
                  계산 버튼을 클릭하여 시뮬레이션 결과를 확인하세요
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {simulatedRanks.map((rank, index) => (
                        <div
                          key={rank.rank_level}
                          className="p-4 border rounded-lg"
                        >
                          <div className="font-semibold">
                            랭크 {rank.rank_level}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            필요 거래 횟수:{" "}
                            {rank.min_trade_count.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                      {methods.getValues().maxRank > 9 &&
                        "* 전체 랭크 중 처음 3개, 중간 3개, 마지막 3개의 랭크만 표시됩니다"}
                    </div>
                  </div>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ left: 50, right: 20, top: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="x"
                          label={{
                            value: "랭크 레벨",
                            position: "insideBottom",
                            offset: -10,
                          }}
                          tickFormatter={(value) =>
                            Math.round(value).toString()
                          }
                        />
                        <YAxis
                          dataKey="y"
                          label={{
                            value: "최소 거래 횟수",
                            angle: -90,
                            position: "insideLeft",
                            offset: -20,
                          }}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip
                          formatter={(value: number) => value.toLocaleString()}
                          labelFormatter={(label) =>
                            `Rank ${Math.round(label)}`
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey="y"
                          stroke="#8884d8"
                          dot={false}
                          name="Required Trades"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-end">
                <ConfirmDialog
                  title="랭크 자동 생성"
                  description="시뮬레이션대로 자동을 진행하시겠습니까? 기존의 랭크를 모두 삭제합니다."
                  onConfirm={() => submit(methods.getValues())}
                >
                  <Button type="button" disabled={!hasSimulated}>
                    저장
                  </Button>
                </ConfirmDialog>
              </div>
            </CardFooter>
          </Card>
        </section>
      </Form>
    </FormProvider>
  );
}
