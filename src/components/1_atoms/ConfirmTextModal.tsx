"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import type { ReactNode, RefObject } from "react";
import { useImperativeHandle, useRef, useState } from "react";
import { FormText } from "@/components/1_atoms/FormText";
import { EasyDialog } from "@/components/1_atoms/EasyModal";

export interface ConfirmTextModalMethods {
  open: boolean;
  setOpen: (value: boolean) => void;
  isValid: () => boolean;
}

const ConfirmTextModal = ({
  title,
  modalControllRef,
  describe,
  confirmText,
  submit,
}: {
  title: string;
  modalControllRef: RefObject<ConfirmTextModalMethods>;
  describe: ReactNode;
  confirmText: string;
  submit: () => void;
}) => {
  useImperativeHandle(modalControllRef, () => ({
    open,
    setOpen,
    isValid: () => valid.current,
  }));

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const isSubmit = useRef(false);
  const valid = useRef(false);

  useEffectFunctionHook({
    Function: () => {
      if (!open) {
        valid.current = false;
        setError("");
        setInput("");
        isSubmit.current = false;
      }
    },
    dependency: [open],
  });

  const validateDeleteText = (text?: string) => {
    const target = text ?? input;
    if (isSubmit.current) {
      if (target === confirmText) {
        setError("");
      } else {
        setError("입력하신 내용이 올바르지 않습니다.");
      }
    }
  };

  const validateAndDelete = () => {
    isSubmit.current = true;
    validateDeleteText();
    if (input === confirmText) {
      valid.current = true;
      submit();
      setOpen(false);
    }
  };
  return (
    <EasyDialog
      button={<Button type="button" className="hidden" />}
      title={title}
      open={open}
      setOpen={setOpen}
    >
      <div className="w-full flex flex-col [&>p]:text-left [&>p]:text-gray-500">
        {describe}
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            validateDeleteText(e.target.value);
          }}
          placeholder={confirmText}
          className="mt-4"
        />

        {error !== "" && <FormText>{error}</FormText>}
        <div className="w-full text-center mt-4 flex justify-center gap-4">
          <Button
            variant="outline"
            type="button"
            className="w-[104px]"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            className="w-[104px]"
            onClick={() => validateAndDelete()}
          >
            확인
          </Button>
        </div>
      </div>
    </EasyDialog>
  );
};

export default ConfirmTextModal;
