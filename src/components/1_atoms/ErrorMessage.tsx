"use client";

import { useController, useFormContext, useWatch } from "react-hook-form";
import { FormText } from "@/components/1_atoms/FormText";
import { memo, useMemo } from "react";
import { forEach, getBooleanString, isArray } from "@/helpers/basic";

export type ValidateType = (...value: any) => string | undefined;

export const ErrorMessage = memo(
  ({
    name,
    validate,
    message,
    isErrorVislble,
    watchNames,
  }: {
    name: string;
    validate?: ValidateType;
    blur?: boolean;
    message?: string;
    isErrorVislble: boolean;
    watchNames?: string[];
  }) => {
    const { control, getValues } = useFormContext(); // retrieve all hook methods

    const {
      formState: { submitCount },
    } = useController({
      name,
      control,
    });

    const getDefaultValues = () => {
      if (!watchNames) return getValues(name);
      else {
        const returnValues: { [key: string]: string | number } = {};
        forEach([name, ...watchNames], (nameItem) => {
          returnValues[nameItem] = getValues(nameItem);
        });
        return returnValues;
      }
    };
    const watchValues = useWatch({
      control: control,
      defaultValue: getDefaultValues(),
      name,
      ...(isArray(watchNames, ">", 0) && {
        name: [name, ...watchNames],
      }),
      exact: true,
    } as any);

    const values = useMemo(() => {
      let returnValues: { [key: string]: string | number } = {};
      if (!watchNames) returnValues = watchValues;
      else
        forEach([name, ...watchNames], (item, index) => {
          returnValues[item.replaceAll(".", "_")] =
            watchValues[index] === 0 ? 0 : watchValues[index] || "";
          const isBoolean = typeof watchValues[index] === "boolean";

          if (isBoolean) {
            returnValues[item.replaceAll(".", "_")] = getBooleanString(
              watchValues[index]
            );
          }
        });
      return returnValues;
    }, [name, watchValues, watchNames]);

    const error =
      (validate || (message && !values)) &&
      (message ?? (validate && validate(values)));

    return (
      <>
        {isErrorVislble && error && submitCount > 0 && (
          <FormText>{error}</FormText>
        )}
      </>
    );
  }
);

ErrorMessage.displayName = "ErrorMessage";
