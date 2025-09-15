"use client";

import {
  ErrorMessage,
  type ValidateType,
} from "@/components/1_atoms/ErrorMessage";
import { type ReactNode, useState } from "react";
import WithRegister from "@/components/2_molecules/WithRegister";
import clsx from "clsx";

export const StarInput = ({
  name,
  disabled,
  validate,
  className,
  onChange,
  pressed,
  isErrorVislble = true,
  watchNames,
}: {
  name: string;
  disabled?: boolean;
  label?: ReactNode;
  validate?: ValidateType;
  className?: string;
  onChange?: (value: any) => void;
  pressed?: (value: string) => boolean;
  isErrorVislble?: boolean;
  watchNames?: string[];
}) => {
  const [hover, setHover] = useState(0);
  const handleMouseEnter = (index: number) => {
    setHover(index);
  };

  const handleMouseLeave = () => {
    setHover(0);
  };

  return (
    <>
      <WithRegister
        name={name}
        validate={validate}
        watchNames={watchNames}
        valueCondition={pressed}
      >
        {(field) => (
          <div
            className={clsx(
              "flex justify-center mb-6",
              className,
              disabled && "opacity-50 pointer-events-none"
            )}
            ref={field.ref}
            id={name}
            onBlur={field.onBlur}
          >
            {[1, 2, 3, 4, 5].map((index) => (
              <button
                key={index}
                className="focus:outline-none mx-1"
                onClick={() => {
                  if (onChange) {
                    onChange(index);
                  } else {
                    field.onChange(index);
                  }
                }}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
              >
                <svg
                  className="w-10 h-10"
                  fill={
                    index <= (hover || Number(field.value))
                      ? "#FFD700"
                      : "#E5E7EB"
                  }
                  viewBox="0 0 24 24"
                  stroke={
                    index <= (hover || Number(field.value))
                      ? "#FFD700"
                      : "#D1D5DB"
                  }
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>
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
