"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import { useAdminTopicsEditHook } from "@/app/(admin)/admin/boards/topics/[topic]/hook";
import { FormProvider } from "react-hook-form";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  FormBuilder,
  FormInput,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import {
  validateAllowedExtensions,
  validateNumberInRange,
  validateToipcName,
  validateToipcURL,
} from "@/helpers/validate";
import clsx from "clsx";

export const BoardTopicsForm = ({ topic_id }: { topic_id: number }) => {
  const { methods, topicsData, threadSettingsData, goBackList, submit } =
    useAdminTopicsEditHook(topic_id);

  return (
    <FormProvider {...methods}>
      <h2>
        {!topicsData
          ? "게시판 추가"
          : `${topicsData.topics[0].name} 게시판 수정`}
      </h2>
      <Form onSubmit={submit} className={clsx("w-full")}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>게시판 기본 설정</CardTitle>
              <CardDescription className="text-xs w-full">
                게시판의 이름과 URL, 설명을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormInput
                name="name"
                label="이름"
                minLength={2}
                maxLength={100}
                required
                autoComplete="off"
                validate={validateToipcName}
              />
              <FormInput
                name="url"
                label="URL"
                minLength={1}
                maxLength={100}
                required
                autoComplete="off"
                validate={validateToipcURL}
              />
              <FormTextarea name="description" label="설명" />
              <FormInput
                type={InputType.number}
                name="display_order"
                label="표시 순서"
                required
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />
              <FormBuilder name="is_active" label="활성화">
                <div className="w-full">
                  <SwitchInput name="is_active" />
                  <CardDescription className="text-xs w-full">
                    게시판을 비활성화하면 사용자에게 표시되지 않습니다
                  </CardDescription>
                </div>
              </FormBuilder>
              <FormBuilder name="single_comment_only" label="단일 댓글만 허용">
                <div className="w-full">
                  <SwitchInput name="single_comment_only" />
                  <CardDescription className="text-xs w-full">
                    유저가 게시글에 댓글을 하나만 작성할 수 있습니다.
                  </CardDescription>
                </div>
              </FormBuilder>
            </CardContent>
          </Card>
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>위젯 설정</CardTitle>
              <CardDescription className="text-xs w-full">
                게시판을 위젯에 등록하거나 상단 메뉴에 노출합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormBuilder name="show_quickmenu" label="빠른 메뉴 표시">
                <div className="w-full">
                  <SwitchInput name="show_quickmenu" />
                  <CardDescription className="text-xs w-full">
                    상단 메뉴에 표시합니다
                  </CardDescription>
                </div>
              </FormBuilder>

              <FormBuilder name="preview_on_homepage" label="미리보기">
                <div className="w-full">
                  <SwitchInput name="preview_on_homepage" />
                  <CardDescription className="text-xs w-full">
                    이 게시판의 최신글을 미리보기로 노출합니다
                  </CardDescription>
                </div>
              </FormBuilder>

              <FormBuilder name="fullview_on_homepage" label="게시판 위젯 등록">
                <div className="w-full">
                  <SwitchInput name="fullview_on_homepage" />
                  <CardDescription className="text-xs w-full">
                    게시판 위젯에 등록합니다
                  </CardDescription>
                </div>
              </FormBuilder>
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>글 설정</CardTitle>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

              <WithUseWatch
                name={[
                  "min_thread_comment_length",
                  "max_thread_comment_length",
                ]}
              >
                {({
                  min_thread_comment_length,
                  max_thread_comment_length,
                }: any) => (
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
              <CardTitle>게시판 접근 권한</CardTitle>
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
                min={0}
                max={100}
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />

              <FormInput
                type={InputType.number}
                name="level_comment"
                label="댓글 레벨"
                required
                min={0}
                max={100}
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />

              <FormInput
                type={InputType.number}
                name="level_download"
                label="다운로드 레벨"
                required
                min={0}
                max={100}
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />

              <FormInput
                type={InputType.number}
                name="level_moderator"
                label="주제 관리권한 레벨"
                required
                min={0}
                max={100}
                validate={(value) => validateNumberInRange(value, 0, 100)}
              />
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
              <CardTitle>페이지네이션</CardTitle>
            </CardHeader>
            <CardContent className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <FormInput
                type={InputType.number}
                name="thread_page_size"
                label="페이지당 글 갯수"
                required
                min={10}
                max={50}
                validate={(value) => validateNumberInRange(value, 10, 50)}
              />
              <FormInput
                type={InputType.number}
                name="thread_page_nav_size"
                label="페이지 버튼 표시 갯수"
                required
                min={3}
                max={10}
                validate={(value) => validateNumberInRange(value, 3, 10)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2">
            <CardHeader>
              <CardTitle>게시글 보존</CardTitle>
              <CardDescription className="text-xs w-full">
                게시글 수정/삭제를 방지하는 기준입니다.
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
                validate={(value) => validateNumberInRange(value, 0, 20)}
              />

              <FormInput
                type={InputType.number}
                name="thread_disable_delete"
                label="삭제 방지 댓글 수"
                required
                min={0}
                max={20}
                validate={(value) => validateNumberInRange(value, 0, 20)}
              />
            </CardContent>
          </Card>
          <Card className="mb-2 col-span-1 sm:col-span-full">
            <CardHeader>
              <CardTitle>포인트 설정</CardTitle>
              <CardDescription className="text-xs w-full">
                게시판 참여시 제공하거나 차감되는 포인트입니다.
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
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_post_read"
                label="글 읽기"
                required
                min={0}
                max={10000}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_comment_create"
                label="댓글 작성"
                required
                min={0}
                max={10000}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_file_download"
                label="파일 다운로드 차감"
                required
                min={0}
                max={10000}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_upvote"
                label="글 추천"
                required
                min={0}
                max={10000}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
              <FormInput
                type={InputType.number}
                name="points_per_downvote"
                label="글 비추천"
                required
                min={0}
                max={10000}
                validate={(value) => validateNumberInRange(value, 0, 10000)}
              />
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={goBackList} variant="outline">
            목록으로
          </Button>
          <Button type="submit">저장</Button>
        </div>
      </Form>
    </FormProvider>
  );
};
