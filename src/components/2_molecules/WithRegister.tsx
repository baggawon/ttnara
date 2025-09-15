import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import type { ChangeHandler, RefCallBack } from "react-hook-form";
import { forEach, getBoolean, isArray } from "@/helpers/basic";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";

interface Props {
  onChange: (value: any) => void;
  onBlur: ChangeHandler;
  ref: RefCallBack;
  name: string;
  value: any;
}

const WithRegister = ({
  name,
  validate,
  valueCondition,
  watchNames,
  children,
}: {
  name: string;
  validate?: ValidateType;
  valueCondition?: (value: string) => boolean;
  watchNames?: string[];
  children: (value: Props) => ReactNode;
}) => {
  const { getValues, register, setValue } = useFormContext(); // retrieve all hook methods
  const rules = {
    validate: (value: any) => {
      if (isArray(watchNames, ">", 0)) {
        const returnValues = { [name]: value };
        forEach(watchNames, (watchName) => {
          returnValues[watchName] = getValues(watchName);
        });
        return !validate!(returnValues);
      } else return !validate!(value);
    },
  };
  const field = register(name, {
    ...(validate && rules),
  });

  const getValue = (props: any) => {
    let value = props[name.replaceAll(".", "_")];
    if (["true", "false"].includes(value)) value = getBoolean(value);
    return value;
  };
  const convertChangeValue = (changeValue: any) => {
    if (changeValue?.target) {
      return changeValue.target.value;
    } else {
      return changeValue;
    }
  };
  return (
    <>
      <WithUseWatch name={[name]}>
        {(props: any) => {
          const value = valueCondition
            ? valueCondition(getValue(props))
            : (getValue(props) ?? false);
          return children({
            onChange: (changeValue) =>
              setValue(field.name, convertChangeValue(changeValue)),
            onBlur: field.onBlur,
            ref: field.ref,
            name: field.name,
            value,
          });
        }}
      </WithUseWatch>
    </>
  );
};

export default WithRegister;
