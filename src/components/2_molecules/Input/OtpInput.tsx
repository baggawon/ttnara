import { InputOTP } from "@/components/ui/input-otp";
import WithRegister from "@/components/2_molecules/WithRegister";
import type { ReactNode } from "react";
import {
  ErrorMessage,
  type ValidateType,
} from "@/components/1_atoms/ErrorMessage";
import clsx from "clsx";

export const OtpInput = ({
  name,
  disabled,
  validate,
  className,
  onChange,
  pressed,
  isErrorVislble = true,
  watchNames,
  maxLength,
  children,
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  className?: string;
  onChange?: (value: any) => void;
  pressed?: (value: string) => boolean;
  id?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  maxLength: number;
  children: ReactNode;
}) => {
  return (
    <>
      <WithRegister
        name={name}
        validate={validate}
        watchNames={watchNames}
        valueCondition={pressed}
      >
        {(field) => (
          <InputOTP
            maxLength={maxLength}
            value={field.value}
            onChange={(value) => {
              if (onChange) {
                onChange(value);
              } else {
                field.onChange(value);
              }
            }}
            ref={field.ref}
            className={clsx(
              className,
              disabled && "opacity-50 pointer-events-none"
            )}
          >
            {children}
          </InputOTP>
        )}
      </WithRegister>
      {validate && (
        <ErrorMessage
          name={name}
          validate={validate}
          watchNames={watchNames}
          isErrorVislble={isErrorVislble}
        />
      )}
    </>
  );
};
