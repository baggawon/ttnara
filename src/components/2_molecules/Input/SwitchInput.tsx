"use client";

import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import type { ReactNode } from "react";
import WithRegister from "@/components/2_molecules/WithRegister";
import { Switch } from "@/components/ui/switch";

export const SwitchInput = ({
  name,
  disabled,
  validate,
  className,
  onCheckedChange,
  pressed,
  id,
  isErrorVislble = true,
  watchNames,
  children,
  defaultChecked = false,
  onChecked,
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  className?: string;
  onCheckedChange?: (value: any) => void;
  pressed?: (value: string) => boolean;
  id?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  children?: ReactNode;
  onChecked?: (value: any) => boolean;
  defaultChecked?: boolean;
}) => (
  <>
    <WithRegister
      name={name}
      validate={validate}
      watchNames={watchNames}
      valueCondition={pressed}
    >
      {(field) => (
        <Switch
          className={clsx(className, disabled && " text-gray-400")}
          defaultChecked={defaultChecked}
          checked={onChecked ? onChecked(field.value) : (field.value ?? false)}
          onCheckedChange={() => {
            if (onCheckedChange) {
              onCheckedChange(!field.value);
            } else {
              field.onChange(!field.value);
            }
          }}
          ref={field.ref}
          name={name}
          onBlur={field.onBlur}
          id={convertId(id ?? name)}
          disabled={disabled}
        >
          {children}
        </Switch>
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
