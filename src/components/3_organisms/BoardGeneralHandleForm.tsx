"use client";

import type { thread_setting } from "@prisma/client";
import clsx from "clsx";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SelectInput from "@/components/2_molecules/Input/Select";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Button } from "@/components/ui/button";
import {
  validateAllowedExtensions,
  validateNumberInRange,
} from "@/helpers/validate";
import { FormProvider } from "react-hook-form";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { useAdminThreadGeneralEditHook } from "@/app/(admin)/admin/boards/general/hook";

export const BoardGeneralHandleForm = ({
  className,
}: {
  className?: string;
}) => {
  const { methods, submit } = useAdminThreadGeneralEditHook();

  return (
    <FormProvider {...methods}>
      <Form onSubmit={submit} className={clsx("w-full", className)}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>기본 설정</CardTitle>
              <CardDescription className="text-xs w-full">
                모든 게시판에 상시 적용되는 공통 설정입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              <FormBuilder name="default_topic_id" label="기본 게시판">
                <SelectInput
                  name="default_topic_id"
                  items={[]}
                  buttonClassName="w-full"
                  placeholder="-----------------"
                />
              </FormBuilder>
              <FormInput
                type={InputType.number}
                name="post_delete_days"
                label="오래된 글 삭제 기준 (일)"
                required
                min={0}
                max={365}
                validate={(value) => validateNumberInRange(value, 0, 365)}
                formClassName="!gap-0 [&>div:first-child]:mb-4 [&>div:last-child]:mt-2"
                isOuterChildren
              >
                <div className="w-full">
                  <CardDescription className="text-xs w-full">
                    0이면 무제한
                  </CardDescription>
                </div>
              </FormInput>

              <FormInput
                type={InputType.number}
                name="post_search_limit"
                label="글 최대 검색수 제한"
                required
                min={0}
                max={10000}
                defaultValue={10000}
                step={1}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="post_interval_seconds"
                label="글 작성 간격 (초)"
                required
                min={0}
                max={30}
                validate={(value) => validateNumberInRange(value, 0, 30)}
                formClassName="!gap-0 [&>div:first-child]:mb-4 [&>div:last-child]:mt-2"
                isOuterChildren
              >
                <div className="w-full">
                  <CardDescription className="text-xs w-full">
                    0이면 무제한
                  </CardDescription>
                </div>
              </FormInput>
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>글 설정 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                새 게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <WithUseWatch
                name={["min_thread_title_length", "max_thread_title_length"]}
              >
                {({
                  min_thread_title_length,
                  max_thread_title_length,
                }: thread_setting) => (
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
                }: thread_setting) => (
                  <>
                    <FormInput
                      type={InputType.number}
                      name="max_thread_content_length"
                      label="본문 최대 길이"
                      required
                      min={2}
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
              <WithUseWatch
                name={[
                  "min_thread_comment_length",
                  "max_thread_comment_length",
                ]}
              >
                {({
                  min_thread_comment_length,
                  max_thread_comment_length,
                }: thread_setting) => (
                  <>
                    <FormInput
                      type={InputType.number}
                      name="max_thread_comment_length"
                      label="댓글 최대 길이"
                      required
                      min={2}
                      max={300}
                      validate={(value) =>
                        validateNumberInRange(
                          value,
                          min_thread_comment_length,
                          300
                        )
                      }
                    />
                    <FormInput
                      type={InputType.number}
                      name="min_thread_comment_length"
                      label="댓글 최소 길이"
                      required
                      min={1}
                      max={299}
                      validate={(value) =>
                        validateNumberInRange(
                          value,
                          1,
                          max_thread_comment_length
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
              <CardTitle>게시판 접근 권한 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                새 게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <FormInput
                type={InputType.number}
                name="level_read"
                label="글 읽기 레벨"
                required
                min={0}
                max={100}
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />
              <FormInput
                type={InputType.number}
                name="level_create"
                label="글 작성 레벨"
                required
                min={1}
                max={100}
                validate={(value) => validateNumberInRange(value, 1, 100)}
              />
              <FormInput
                type={InputType.number}
                name="level_comment"
                label="댓글 작성 레벨"
                required
                min={1}
                max={100}
                defaultValue={1}
                validate={(value) => validateNumberInRange(value, 1, 100)}
              />
              <FormInput
                type={InputType.number}
                name="level_download"
                label="파일 다운로드 레벨"
                required
                min={1}
                max={100}
                defaultValue={1}
                validate={(value) => validateNumberInRange(value, 1, 100)}
              />
              <FormInput
                type={InputType.number}
                name="level_moderator"
                label="게시판 관리자 레벨"
                required
                min={1}
                max={100}
                defaultValue={10}
                validate={(value) => validateNumberInRange(value, 1, 100)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>파일 설정 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                새 게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
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
              <FormInput
                type={InputType.number}
                name="max_file_size_mb"
                label="파일 최대 크기 (MB, 개별)"
                required
                min={1}
                max={10}
                validate={(value) => validateNumberInRange(value, 1, 10)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>부가 기능 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                새 게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormBuilder name="use_thumbnail" label="게시판 썸네일 표시">
                <div className="w-full">
                  <SwitchInput name="use_thumbnail" />
                </div>
              </FormBuilder>
              <FormBuilder name="use_anonymous" label="게시판 익명 적용">
                <div className="w-full">
                  <SwitchInput name="use_anonymous" />
                </div>
              </FormBuilder>
              <FormBuilder name="use_upvote" label="추천 기능 허용">
                <div className="w-full">
                  <SwitchInput name="use_upvote" />
                </div>
              </FormBuilder>
              <FormBuilder name="use_downvote" label="비추천 기능 허용">
                <div className="w-full">
                  <SwitchInput name="use_downvote" />
                </div>
              </FormBuilder>
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>페이지네이션 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                새 게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <FormInput
                type={InputType.number}
                name="thread_page_size"
                label="페이지당 글 갯수"
                required
                min={10}
                max={50}
                defaultValue={20}
                validate={(value) => validateNumberInRange(value, 10, 50)}
              />
              <FormInput
                type={InputType.number}
                name="thread_page_nav_size"
                label="페이지 버튼 표시 갯수"
                required
                min={3}
                max={10}
                defaultValue={5}
                validate={(value) => validateNumberInRange(value, 3, 10)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>게시글 보존 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                게시글 수정/삭제를 방지하는 기준입니다. <br />새 게시판을 만들
                때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                type={InputType.number}
                name="thread_disable_edit"
                label="수정 방지 댓글 수"
                required
                min={0}
                max={20}
                defaultValue={1}
                validate={(value) => validateNumberInRange(value, 0, 20)}
              />
              <FormInput
                type={InputType.number}
                name="thread_disable_delete"
                label="삭제 방지 댓글 수"
                required
                min={0}
                max={20}
                defaultValue={1}
                validate={(value) => validateNumberInRange(value, 0, 20)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>포인트 설정 기본값</CardTitle>
              <CardDescription className="text-xs w-full">
                게시판 참여시 제공하거나 차감되는 포인트입니다. <br />새
                게시판을 만들 때 기본값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <FormInput
                type={InputType.number}
                name="points_per_post_create"
                label="글 작성"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_post_read"
                label="글 읽기"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_comment_create"
                label="댓글 작성"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_file_download"
                label="파일 다운로드 차감"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_upvote"
                label="글 추천"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_downvote"
                label="글 비추천"
                required
                min={0}
                max={10000}
                defaultValue={0}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
            </CardContent>
          </Card>
        </div>
        <Button className="w-full sm:w-fit" type="submit">
          저장
        </Button>
      </Form>
    </FormProvider>
  );
};
