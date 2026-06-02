"use client";

import type { category } from "@prisma/client";
import type { topicCategoriesUpdateProps } from "@/app/api/admin_di2u3k2j/topics/categories/update";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { FormTextarea } from "@/components/2_molecules/Input/FormTextarea";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { postJson } from "@/helpers/common";
import { categoryDefault } from "@/helpers/defaultValue";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute } from "@/helpers/types";
import {
  validateToipcName,
  validateTopicDisplayOrder,
} from "@/helpers/validate";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: number;
  // null → create mode, a row → edit mode.
  category: category | null;
  onSaved?: () => void;
}

export const CategorySheet = ({
  open,
  onOpenChange,
  topicId,
  category,
  onSaved,
}: Props) => {
  const { toast } = useToast();
  const isEdit = !!category;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<category>({
    defaultValues: categoryDefault({ topic_id: topicId }),
    reValidateMode: "onSubmit",
  });

  // Reset the form whenever the sheet opens or the target row changes so stale
  // values from a previous open never leak in.
  useEffect(() => {
    if (!open) return;
    methods.reset(
      category ? { ...category } : categoryDefault({ topic_id: topicId })
    );
  }, [open, category, topicId, methods]);

  const submit = async (props: category) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: topicCategoriesUpdateProps = {
        ...props,
        topic_id: topicId,
      };
      forEach(["description"], (key) => {
        if (
          (payload as any)[key] === "" ||
          (payload as any)[key] === undefined
        ) {
          (payload as any)[key] = null;
        }
      });
      payload.display_order = Number(payload.display_order);

      const { isSuccess, hasMessage } =
        await postJson<topicCategoriesUpdateProps>(
          ApiRoute.adminTopicCategoriesUpdate,
          payload
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        onSaved?.();
        onOpenChange(false);
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsSubmitting(false);
  };

  const handleError = () => {
    toast({ id: ToastData.unknown, type: "error" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md p-0 flex flex-col"
        // Only the X button or footer 취소 may close this — suppress click-outside
        // and ESC so an accidental click doesn't discard the form.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>소분류 {isEdit ? "편집" : "추가"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "선택한 소분류를 수정합니다."
              : "새로운 소분류를 추가합니다."}
          </SheetDescription>
        </SheetHeader>

        <FormProvider {...methods}>
          <Form
            onSubmit={submit}
            onError={handleError}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
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
                    비활성화된 소분류는 사용자에게 표시되지 않습니다.
                  </CardDescription>
                </div>
              </FormBuilder>
            </div>

            <SheetFooter className="px-6 py-4 border-t bg-background gap-2 sm:gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isEdit ? "수정" : "저장"}
              </Button>
            </SheetFooter>
          </Form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
};
