"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FormProvider } from "react-hook-form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { validateToipcName } from "@/helpers/validate";
import { useThreadsEditHook } from "@/app/(main)/(useWidget)/board/[topic]/edit/[thread]/hook";
import SelectInput from "@/components/2_molecules/Input/Select";
import dynamic from "next/dynamic";
import { map } from "@/helpers/basic";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import type { ThreadWithProfile } from "@/app/api/threads/read";
import { useSession } from "next-auth/react";
import { CustomCheckbox } from "@/components/2_molecules/Input/CheckboxInput";
const Ckeditor5Input = dynamic(
  () => import("@/components/2_molecules/Input/Ckeditor5Input"),
  { ssr: false }
);

export const ThreadEditor = ({
  topic_url,
  thread_id,
}: {
  topic_url: string;
  thread_id: number;
}) => {
  const { methods, topicSettings, goBackList, submit } = useThreadsEditHook(
    topic_url,
    thread_id
  );

  const session = useSession();

  const handleSubmit = (data: ThreadWithProfile) => {
    return submit(data);
  };

  return (
    <FormProvider {...methods}>
      <Form onSubmit={handleSubmit}>
        <section className="w-full flex flex-col gap-6 p-0 md:p-4 max-w-5xl mx-auto">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b p-3 sm:p-6">
              <WithUseWatch name={["id"]}>
                {({ id }: ThreadWithProfile) => (
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sm:w-6 sm:h-6"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {topicSettings?.name} -
                      {id === 0 ? " 새 글 작성" : " 글 수정"}
                    </h1>
                  </div>
                )}
              </WithUseWatch>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-3 sm:p-6 flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[200px]">
                  <FormBuilder
                    name="category_id"
                    label="카테고리"
                    formClassName="w-full"
                  >
                    <SelectInput
                      name="category_id"
                      placeholder="카테고리 선택"
                      items={
                        topicSettings?.categories
                          ? map(topicSettings.categories, (category) => ({
                              label: category.name,
                              value: category.id,
                            }))
                          : []
                      }
                      buttonClassName="w-full"
                    />
                  </FormBuilder>
                </div>
                <div className="w-full flex-1">
                  <FormInput
                    name="title"
                    label="제목"
                    validate={validateToipcName}
                    placeholder="제목을 입력하세요"
                  />
                </div>
              </div>

              {session?.data?.user?.is_app_admin && (
                <FormBuilder
                  name="is_notice"
                  label="공지사항"
                  formClassName="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <CustomCheckbox name="is_notice" label="상단에 고정" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    (관리자 전용)
                  </span>
                </FormBuilder>
              )}

              <FormBuilder
                name="content"
                label={
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    본문 작성
                  </div>
                }
              >
                <Ckeditor5Input
                  name="content"
                  validate={validateToipcName}
                  useUpload
                />
              </FormBuilder>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              onClick={goBackList}
              variant="outline"
              className="px-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className=""
              >
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
              목록으로
            </Button>
            <Button
              type="submit"
              className="px-4 bg-primary hover:bg-primary/90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className=""
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              저장
            </Button>
          </div>
        </section>
      </Form>
    </FormProvider>
  );
};
