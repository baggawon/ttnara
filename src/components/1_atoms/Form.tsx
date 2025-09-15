"use client";

import React from "react";
import type {
  FieldErrors,
  FieldValues,
  UseFormHandleSubmit,
} from "react-hook-form";
import { useFormContext } from "react-hook-form";

import clsx from "clsx";
import { DEBOUNCE_MILISECOND } from "@/helpers/config";
import debounce from "@/helpers/debounce";

const Form = ({
  children,
  onSubmit,
  onError,
  className,
  handleSubmit,
}: {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  onError?: (error: FieldErrors<FieldValues>) => void;
  className?: string;
  handleSubmit?: UseFormHandleSubmit<FieldValues>;
}) => {
  const { handleSubmit: originalHandleSubmit } = useFormContext(); // retrieve all hook methods
  return (
    <form
      onSubmit={
        !handleSubmit
          ? originalHandleSubmit(
              debounce(onSubmit, DEBOUNCE_MILISECOND),
              onError
            )
          : handleSubmit(debounce(onSubmit, DEBOUNCE_MILISECOND), onError)
      }
      className={clsx(className)}
    >
      {children}
    </form>
  );
};

export default Form;
