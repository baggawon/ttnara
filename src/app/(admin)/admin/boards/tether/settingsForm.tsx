"use client";

import clsx from "clsx";
import { FormProvider } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validateAllowedExtensions,
  validateNumberInRange,
} from "@/helpers/validate";
import { useAdminTetherSettingsHook } from "@/app/(admin)/admin/boards/tether/settingsHook";

export const TetherSettingsForm = ({ className }: { className?: string }) => {
  const { methods, submit } = useAdminTetherSettingsHook();

  return (
    <FormProvider {...methods}>
      <Form onSubmit={submit} className={clsx("w-full", className)}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>거래 게시판 사용 여부</CardTitle>
              <CardDescription className="text-xs w-full">
                끄면 거래 게시판, 실시간 거래/랭킹 위젯, 거래 포인트, 거래 관리,
                KYC 인증, 거래 요청 알림 설정이 모두 숨겨지고 직접 접근 시
                홈으로 리다이렉트됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormBuilder name="use_tether_board" label="사용">
                <div className="w-full">
                  <SwitchInput name="use_tether_board" />
                </div>
              </FormBuilder>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader>
              <CardTitle>글 설정</CardTitle>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WithUseWatch
                name={["min_thread_title_length", "max_thread_title_length"]}
              >
                {({
                  min_thread_title_length,
                  max_thread_title_length,
                }: any) => (
                  <>
                    <FormInput
                      type={InputType.number}
                      name="max_thread_title_length"
                      label="제목 최대 길이"
                      required
                      min={2}
                      max={200}
                      validate={(value) =>
                        validateNumberInRange(
                          value,
                          min_thread_title_length,
                          200
                        )
                      }
                    />
                    <FormInput
                      type={InputType.number}
                      name="min_thread_title_length"
                      label="제목 최소 길이"
                      required
                      min={1}
                      max={199}
                      validate={(value) =>
                        validateNumberInRange(value, 1, max_thread_title_length)
                      }
                    />
                  </>
                )}
              </WithUseWatch>

              <WithUseWatch
                name={[
                  "min_thread_content_length",
                  "max_thread_content_length",
                ]}
              >
                {({
                  min_thread_content_length,
                  max_thread_content_length,
                }: any) => (
                  <>
                    <FormInput
                      type={InputType.number}
                      name="max_thread_content_length"
                      label="본문 최대 길이"
                      required
                      min={1}
                      max={10000}
                      validate={(value) =>
                        validateNumberInRange(
                          value,
                          min_thread_content_length,
                          10000
                        )
                      }
                    />
                    <FormInput
                      type={InputType.number}
                      name="min_thread_content_length"
                      label="본문 최소 길이"
                      required
                      min={1}
                      max={9999}
                      validate={(value) =>
                        validateNumberInRange(
                          value,
                          1,
                          max_thread_content_length
                        )
                      }
                    />
                  </>
                )}
              </WithUseWatch>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader>
              <CardTitle>파일 설정</CardTitle>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormBuilder name="use_upload_file" label="파일 업로드 허용">
                <div className="w-full">
                  <SwitchInput name="use_upload_file" />
                </div>
              </FormBuilder>
              <FormInput
                type={InputType.number}
                name="max_upload_items"
                label="최대 업로드 수"
                required
                min={0}
                max={10}
                validate={(value) => validateNumberInRange(value, 0, 10)}
              />
              <FormInput
                name="allowed_file_extensions"
                label="허용된 파일 확장자, 쉼표로 구분"
                required
                validate={validateAllowedExtensions}
              />
              <div>
                <FormInput
                  type={InputType.number}
                  name="max_file_size_mb"
                  label="파일 최대 크기 (MB, 개별)"
                  required
                  min={1}
                  max={20}
                  validate={(value) => validateNumberInRange(value, 1, 20)}
                />
                <CardDescription className="text-xs w-full mt-1">
                  1~20MB까지 설정 가능합니다.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-2 mb-4">
          <Button type="submit">저장</Button>
        </div>
      </Form>
    </FormProvider>
  );
};
