"use client";

import React, { cloneElement, isValidElement } from "react";
import { useSessionStore } from "@/helpers/state";
import { validData } from "@/helpers/common";
import { isArray } from "@/helpers/basic";

const AuthGuard = ({ children, ...props }: any) => {
  const returnChildren = () => {
    let returnValue;
    if (isValidElement(children)) {
      returnValue = cloneElement(children, props);
    }
    if (typeof children === "function") {
      returnValue = children(props);
    }
    return returnValue;
  };

  const validProps = Object.values(props).every((prop: any) => {
    if (prop?.updateDate) {
      return validData(prop.updateDate);
    } else if (isArray(prop, "===", 1)) {
      return validData(prop[0]);
    }
    return validData(prop);
  });
  if (!validProps) {
    useSessionStore.getState().logoutRequest();
  }

  return validProps ? returnChildren() : <></>;
};

export default AuthGuard;
