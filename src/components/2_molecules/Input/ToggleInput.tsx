import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import type { ReactNode } from "react";
import { Toggle } from "@/components/ui/toggle";
import WithRegister from "@/components/2_molecules/WithRegister";

export const ToogleInput = ({
  name,
  disabled,
  validate,
  className,
  onPressedChange,
  pressed,
  id,
  isErrorVislble = true,
  watchNames,
  children,
  variant,
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  className?: string;
  onPressedChange?: (value: any) => void;
  pressed?: (value: string) => boolean;
  id?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  children?: ReactNode;
  variant?: "default" | "outline";
}) => (
  <>
    <WithRegister
      name={name}
      validate={validate}
      watchNames={watchNames}
      valueCondition={pressed}
    >
      {(field) => (
        <Toggle
          className={clsx(className, disabled && " text-gray-400")}
          pressed={field.value ?? false}
          onPressedChange={() => {
            if (onPressedChange) {
              onPressedChange(!field.value);
            } else {
              field.onChange(!field.value);
            }
          }}
          ref={field.ref}
          name={name}
          onBlur={field.onBlur}
          variant={variant}
          id={convertId(id ?? name)}
        >
          {children}
        </Toggle>
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
