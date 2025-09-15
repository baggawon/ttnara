"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminRanksCreateHook } from "@/app/(admin)/admin/ranks/create/hook";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { InputType } from "@/components/2_molecules/Input/FormInput";
import { validateNumber, validateRankName } from "@/helpers/validate";

export default function RanksCreatePage() {
  const { methods, goBack, submit } = useAdminRanksCreateHook();

  return (
    <FormProvider {...methods}>
      <Form onSubmit={submit}>
        <section className="w-full flex flex-col gap-4 p-0 md:p-4">
          <Card>
            <CardHeader>
              <CardTitle>신규 랭크 추가</CardTitle>
            </CardHeader>
            <CardContent className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <FormInput name="name" label="이름" validate={validateRankName} />
              <FormInput
                name="rank_level"
                type={InputType.number}
                label="랭크 레벨"
                min={1}
                validate={(value) => validateNumber({ value, min: 1 })}
              />
              <FormInput
                name="min_trade_count"
                type={InputType.number}
                label="최소 거래 횟수"
                min={0}
                max={10000000}
                validate={(value) => validateNumber({ value, positive: true })}
              />
              <FormTextarea name="description" label="설명" />
              <FormBuilder name="is_active" label="활성화">
                <div className="w-full">
                  <SwitchInput name="is_active" />
                </div>
              </FormBuilder>
            </CardContent>
            <CardFooter>
              <div className="flex justify-between w-full gap-2">
                <Button type="button" onClick={goBack} variant="outline">
                  목록으로
                </Button>
                <Button type="submit">저장</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </Form>
    </FormProvider>
  );
}
