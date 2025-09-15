"use client";

import Form from "@/components/1_atoms/Form";
import { Input } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { validateMessageContent, validateUserName } from "@/helpers/validate";
import { FormProvider } from "react-hook-form";
import { setTestId } from "@/helpers/common";
import { Textarea } from "@/components/2_molecules/Input/FormTextarea";
import MessagePostHook from "@/app/(app)/app/message/post/hook";

export enum MessagePostFormIds {
  to_uid = "to_uid",
  contents = "contents",
  submit = "submit",
}

const MessagePost = () => {
  const { methods, trySend } = MessagePostHook();

  return (
    <div className="relative w-full sm:w-96">
      <FormProvider {...methods}>
        <Form onSubmit={trySend} className="flex gap-4 flex-col">
          <Input
            name="to_uid"
            validate={validateUserName}
            placeholder="받는 회원 닉네임"
            autoComplete="name"
            inputClassName="bg-card"
            {...setTestId(MessagePostFormIds.to_uid)}
          />
          <p className="text-xs text-slate-500">
            여러 회원에게 보낼때는 컴마(,)로 구분하세요.
          </p>
          <Textarea
            name="contents"
            validate={validateMessageContent}
            inputClassName="bg-card"
            {...setTestId(MessagePostFormIds.contents)}
          />
          <div className="relative flex gap-4 justify-center w-full text-center">
            <Button type="submit" {...setTestId(MessagePostFormIds.submit)}>
              보내기
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => window.close()}
              className="w-fit mb-4"
            >
              창닫기
            </Button>
          </div>
        </Form>
      </FormProvider>
    </div>
  );
};

export default MessagePost;
