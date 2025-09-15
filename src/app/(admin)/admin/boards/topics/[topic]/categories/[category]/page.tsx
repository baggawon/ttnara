"use client";

import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { useAdminTopicCategoriesEditHook } from "@/app/(admin)/admin/boards/topics/[topic]/categories/[category]/hook";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import {
  validateToipcName,
  validateTopicDisplayOrder,
} from "@/helpers/validate";
import { use } from "react";

type Params = Promise<{ topic: string; category: string }>;

export default function BoardTopics(props: { params: Params }) {
  const params = use(props.params);

  const { methods, topicsData, categoriesData, goBackList, editSave } =
    useAdminTopicCategoriesEditHook(
      Number(params.topic),
      Number(params.category)
    );

  return (
    <FormProvider {...methods}>
      <Form onSubmit={editSave}>
        <section className="w-full flex flex-col gap-4 p-0 md:p-4">
          <h2>
            {topicsData?.topics[0].name} 소분류{" "}
            {!categoriesData ? "추가" : "편집"}
          </h2>
          <Card>
            <CardContent className="mt-6 !grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="name"
                label="이름"
                validate={validateToipcName}
              />

              <FormTextarea name="description" label="설명" />

              <FormInput
                name="display_order"
                label="표시 순서"
                validate={validateTopicDisplayOrder}
              />

              <FormBuilder name="is_active" label="활성화">
                <div className="w-full">
                  <SwitchInput name="is_active" />
                  <CardDescription className="text-xs w-full">
                    비활성화된 주제는 사용자에게 표시되지 않습니다.
                  </CardDescription>
                </div>
              </FormBuilder>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button type="button" onClick={goBackList} variant="outline">
              목록으로
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </section>
      </Form>
    </FormProvider>
  );
}
