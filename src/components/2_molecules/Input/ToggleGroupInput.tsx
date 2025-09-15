import clsx from "clsx";
import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import { ErrorMessage } from "@/components/1_atoms/ErrorMessage";
import { convertId } from "@/helpers/common";
import type { ReactNode } from "react";
import WithRegister from "@/components/2_molecules/WithRegister";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export { ToggleGroupItem };
export const ToggleGroupInput = ({
  name,
  disabled,
  validate,
  className,
  onValueChange,
  value,
  id,
  isErrorVislble = true,
  watchNames,
  children,
  type,
  orientation,
  variant,
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  className?: string;
  onValueChange?: (value: any) => void;
  value?: (value: string) => boolean;
  id?: string;
  isErrorVislble?: boolean;
  watchNames?: string[];
  children: ReactNode;
  variant?: "default" | "outline";
  type?: "single" | "multiple";
  orientation?: "horizontal" | "vertical";
}) => (
  <>
    <WithRegister
      name={name}
      validate={validate}
      watchNames={watchNames}
      valueCondition={value}
    >
      {(field) => (
        <ToggleGroup
          className={clsx(className, disabled && " text-gray-400")}
          value={field.value ?? false}
          onValueChange={(newValue: any) => {
            const convertNewValue = newValue.split("*&*")[0];
            if (onValueChange) {
              onValueChange(convertNewValue);
            } else {
              field.onChange(convertNewValue);
            }
          }}
          ref={field.ref}
          onBlur={field.onBlur}
          id={convertId(id ?? name)}
          type={type ?? "single"}
          disabled={disabled}
          orientation={orientation}
          variant={variant}
        >
          {children}
        </ToggleGroup>
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
