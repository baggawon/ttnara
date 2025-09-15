"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  type RefObject,
  useRef,
  type ReactNode,
  useImperativeHandle,
} from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import { Button } from "@/components/ui/button";

const defaultTitle = "확인";
const defaultDescription = "이 행동은 되돌릴 수 없습니다. 계속하시겠습니까?";

export interface FormDialogMethods {
  cancelRef: RefObject<HTMLButtonElement | null>;
  methods: UseFormReturn<any, any, undefined>;
}

function FormDialog<TFieldValues>({
  children,
  title = defaultTitle,
  description = defaultDescription,
  onConfirm,
  initialize,
  formChildren,
  dialogControllRef,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  onConfirm: (
    data: TFieldValues,
    cancelRef: RefObject<HTMLButtonElement | null>,
    methods: UseFormReturn<any, any, undefined>
  ) => void;
  initialize: () => TFieldValues;
  formChildren: ReactNode;
  dialogControllRef?: RefObject<FormDialogMethods | undefined>;
}) {
  useImperativeHandle(dialogControllRef, () => ({
    methods,
    cancelRef,
  }));

  const methods = useForm({
    defaultValues: initialize() as any,
    reValidateMode: "onSubmit",
  });

  const cancelRef = useRef<HTMLButtonElement>(null);

  const onSubmit = (data: TFieldValues) => {
    onConfirm(data, cancelRef, methods);
  };

  return (
    <FormProvider {...methods}>
      <AlertDialog>
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-left">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {formChildren}
          <Form onSubmit={onSubmit}>
            <AlertDialogFooter>
              <AlertDialogAction ref={cancelRef} className="hidden" />
              <AlertDialogCancel>취소</AlertDialogCancel>
              <Button type="submit">확인</Button>
            </AlertDialogFooter>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}

export default FormDialog;
