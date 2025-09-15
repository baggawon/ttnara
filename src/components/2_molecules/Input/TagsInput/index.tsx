"use client";

import type { ValidateType } from "@/components/1_atoms/ErrorMessage";
import WithRegister from "@/components/2_molecules/WithRegister";
import { WithContext as ReactTags } from "react-tag-input";
import { useFormContext } from "react-hook-form";
import { map } from "@/helpers/basic";
import "./TagsInput.css";
import clsx from "clsx";
import type { Tag } from "react-tag-input/types/components/SingleTag";

// const KeyCodes = {
//   comma: 188,
//   enter: 13,
// };

export function TagsInput({
  placeholder = "새로운 아이템을 추가해주세요.",
  validate,
  name,
  watchNames,
  disabled,
  suggestions,
  keepList,
  useDragDrop,
}: {
  name: string;
  placeholder?: string;
  validate?: ValidateType;
  watchNames?: string[];
  disabled?: boolean;
  suggestions?: string[];
  keepList?: string[];
  useDragDrop?: boolean;
}) {
  const { getValues, setValue } = useFormContext(); // retrieve all hook methods

  const handleDelete = (i: number) => {
    if (!keepList?.includes(getValues(`${name}.${i}`))) {
      setValue(
        name,
        getValues(name).filter((tagName: string, index: number) => index !== i)
      );
    }
  };

  const handleAddition = (tag: Tag) => {
    setValue(name, [...getValues(name), tag.id]);
  };

  const handleDrag = (tag: Tag, currPos: number, newPos: number) => {
    const newTags = getValues(name).slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag.id);

    // re-render
    setValue(name, newTags);
  };

  const handleTagClick = (index: number) => {
    console.log("The tag at index " + index + " was clicked");
  };

  return (
    <WithRegister name={name} validate={validate} watchNames={watchNames}>
      {(field) => (
        <div
          className={clsx(
            "w-full",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          <ReactTags
            tags={map(field.value, (schema) => ({
              id: schema,
              text: schema,
            }))}
            {...(suggestions && {
              suggestions: map(suggestions, (schema) => ({
                id: schema,
                text: schema,
              })),
            })}
            // delimiters={[KeyCodes.comma, KeyCodes.enter]}
            handleDelete={handleDelete}
            handleAddition={handleAddition}
            handleDrag={handleDrag}
            allowDragDrop={useDragDrop ?? false}
            handleTagClick={handleTagClick}
            inputFieldPosition="bottom"
            placeholder={placeholder}
            autocomplete
            inputProps={{
              disabled: disabled as any,
            }}
          />
        </div>
      )}
    </WithRegister>
  );
}
