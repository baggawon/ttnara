"use client";

import { forEach, getBooleanString } from "@/helpers/basic";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import React, { cloneElement, isValidElement, useMemo, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";

const WithUseWatch = ({
  name,
  nameExact,
  displayValidate,
  children,
  clearColumn,
  control,
  clearFunction,
  subName,
  subNameExact,
  subControl,
  disabled,
}: {
  name?: string[];
  nameExact?: boolean;
  displayValidate?: (...value: any) => boolean;
  children: any;
  clearColumn?: string;
  control?: any;
  clearFunction?: (values: any) => boolean;
  subName?: string[];
  subNameExact?: boolean;
  subControl?: any;
  disabled?: boolean;
}) => {
  const { control: defaultControl, setValue, getValues } = useFormContext();
  const first = useRef(true);

  const getDefaultValues = () => {
    if (!name) return getValues();
    else {
      const returnValues: { [key: string]: string | number } = {};
      forEach(name, (nameItem) => {
        returnValues[nameItem] = getValues(nameItem);
      });
      return returnValues;
    }
  };
  const watchValues = useWatch({
    control: control ?? defaultControl,
    defaultValue: getDefaultValues(),
    ...(name && { name, exact: nameExact ?? true }),
    disabled,
  } as any);

  const subWatchValues = useWatch({
    control: subControl ?? defaultControl,
    ...(subName && { name: subName }),
    disabled: !subName,
    exact: subNameExact ?? true,
  } as any);

  const values = useMemo(() => {
    let returnValues: { [key: string]: string | number } = {};
    if (!name) returnValues = watchValues;
    else
      forEach(name, (item, index) => {
        returnValues[item.replaceAll(".", "_")] = watchValues[index] ?? "";
        const isBoolean =
          typeof returnValues[item.replaceAll(".", "_")] === "boolean";

        if (isBoolean) {
          returnValues[item.replaceAll(".", "_")] = getBooleanString(
            watchValues[index]
          );
        }
      });
    if (subName)
      forEach(subName, (item, index) => {
        returnValues[item.replaceAll(".", "_")] = subWatchValues[index] ?? "";
        const isBoolean =
          typeof returnValues[item.replaceAll(".", "_")] === "boolean";

        if (isBoolean) {
          returnValues[item.replaceAll(".", "_")] = getBooleanString(
            subWatchValues[index]
          );
        }
      });
    return returnValues;
  }, [name, watchValues, subName, subWatchValues]);

  useEffectFunctionHook({
    Function: () => {
      const { needClear, isAbleClear } = {
        needClear:
          clearColumn && getValues(clearColumn) !== "" && first.current,
        isAbleClear:
          !clearFunction || (!!clearFunction && clearFunction(values)),
      };

      if (needClear) {
        if (isAbleClear) setValue(clearColumn!, "");
        first.current = false;
      }
    },
    dependency: [watchValues, clearColumn],
  });

  const returnChildren = () => {
    let returnValue;
    if (isValidElement(children)) {
      returnValue = cloneElement(children, values);
    }
    if (typeof children === "function") {
      returnValue = children(values);
    }
    return returnValue;
  };

  return (
    <>
      {((displayValidate && displayValidate(values)) || !displayValidate) &&
        returnChildren()}
    </>
  );
};

export default WithUseWatch;
