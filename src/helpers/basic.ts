import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import Decimal from "decimal.js";

export const getWeekdaysFromToday = () => {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const days = [];
  for (
    let i = 0, today = dayjs().set("second", 0).set("millisecond", 0);
    i < 7;
    i++
  ) {
    const day = today.add(i, "day");

    const dayOfWeek = weekdays[day.day()];
    let label = `${dayOfWeek} (${day.toDate().toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    })})`;
    if (i === 0) {
      label += " (오늘)";
    }
    days.push({
      value: day.toISOString(),
      label: label,
    });
  }
  return days;
};

export const truncateText = (text: string, length: number) => {
  return text.length > length ? text.substring(0, length) + "..." : text;
};

export function getTimeDifference(
  short: boolean = false,
  timestamp?: number
): string {
  const currentDate = new Date();
  let targetDate: Date;

  if (timestamp) {
    targetDate = new Date(timestamp);
  } else {
    const pastDate = getRandomPastDate();
    targetDate = new Date(pastDate);
  }

  const timeDiff = currentDate.getTime() - targetDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  if (daysDiff === 0) {
    return formatDate(targetDate, short ? "오늘" : "오늘 h:mm A");
  } else if (daysDiff === 1) {
    return formatDate(targetDate, short ? "어제" : "어제 h:mm A");
  } else if (daysDiff === -1) {
    return formatDate(targetDate, short ? "내일" : "내일 h:mm A");
  } else if (daysDiff > 0) {
    return `${daysDiff}일 전 ${formatDate(targetDate, short ? "" : "h:mm A")}`;
  } else if (daysDiff < 0) {
    return `${Math.abs(daysDiff)}일 후 ${formatDate(
      targetDate,
      short ? "" : "h:mm A"
    )}`;
  }

  return formatDate(targetDate, short ? "M월 d일" : "M월 d일 h:mm A");
}

function getRandomPastDate(period: string = "week"): number {
  const currentDate = new Date();
  const currentTimestamp = currentDate.getTime();
  let minTimestamp;

  if (period === "hour") {
    minTimestamp = currentTimestamp - 60 * 60 * 1000; // 1 hour
  } else if (period === "day") {
    minTimestamp = currentTimestamp - 24 * 60 * 60 * 1000; // 1 day
  } else if (period === "week") {
    minTimestamp = currentTimestamp - 7 * 24 * 60 * 60 * 1000; // 1 week
  } else if (period === "year") {
    minTimestamp = currentTimestamp - 365 * 24 * 60 * 60 * 1000; // 1 year
  } else {
    minTimestamp = currentTimestamp - 30 * 24 * 60 * 60 * 1000; // 1 month
  }

  const pastTimestamp = Math.floor(
    minTimestamp + Math.random() * (currentTimestamp - minTimestamp)
  );
  return pastTimestamp;
}

function formatDate(date: Date, format: string): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (format === "") {
    return format;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedDate = format
    .replace("h", formattedHours.toString())
    .replace("mm", formattedMinutes)
    .replace("A", period);

  return formattedDate;
}

export declare type ArrayOption = "<" | "<=" | "===" | "!==" | ">=" | ">";
const selectArrayMethod = (array: [], method: ArrayOption, length: number) => {
  const methods = {
    "<": array.length < length,
    "<=": array.length <= length,
    "===": array.length === length,
    "!==": array.length !== length,
    ">=": array.length >= length,
    ">": array.length > length,
  };
  return methods[method];
};

export const pipe = (initValue: any, ...funs: any[]) =>
  funs.reduce((value, fun) => fun(value), initValue);

export const getNestedValue = ({
  object,
  path,
}: {
  object?: object;
  path?: string;
}) => {
  if (object && path) {
    if (path === "") return object;
    const keys = path.split(/[[\].]+?/);
    const lastKey = keys.pop() as string;
    const lastObj = keys.reduce(
      (obj: { [key: string]: any }, key) => (obj[key] = obj[key] || {}),
      object
    );
    if (Object.keys(lastObj).length === 0) return undefined;
    return lastObj[lastKey];
  }
  if (object) return object;
  return undefined;
};

export const isArray = <T>(
  array: any,
  method: ArrayOption = ">=",
  length = 0
): array is Array<T> =>
  array &&
  Array.isArray(array) &&
  selectArrayMethod(array as [], method, length);

export type TFunctionProps<T> = (object: T, index: number) => any;
export type TFunctionFilterProps<T> = (
  object: T,
  index: number,
  totalCount: number
) => any;
export const forEach = <T>(array: T[] | T, func: TFunctionProps<T>) => {
  if (isArray(array, ">", 0)) {
    for (let count = 0, total = array.length; count < total; count += 1) {
      const result = func(array[count]!, count);
      if (result === "break") break;
    }
  }
  if (typeof array === "number") {
    for (let count = 0; count < array; count += 1) {
      const result = func(count as any, count);
      if (result === "break") break;
    }
  }
};

export const map = <T>(array: T[] | T, func: TFunctionProps<T>) => {
  let returnValues = [];
  if (isArray(array, ">", 0)) {
    returnValues = new Array(array.length);
    for (let count = 0, total = array.length; count < total; count += 1) {
      returnValues[count] = func(array[count] as T, count);
    }
  }
  if (typeof array === "number") {
    returnValues = new Array(array);
    for (let count = 0; count < array; count += 1) {
      returnValues[count] = func(count as any, count);
    }
  }
  return returnValues;
};

export const filterMap = <T>(array: T[], func: TFunctionProps<T>) => {
  const returnValues = [];
  if (isArray(array, ">", 0)) {
    for (let count = 0, total = array.length; count < total; count += 1) {
      const result = func(array[count]!, count);
      if (result || result === 0)
        returnValues.push(result === true ? array[count] : result);
    }
  }
  return returnValues;
};

export const removeColumnsFromObject = <T>(object: T, condition: string[]) => {
  const returnValue: any = {};
  if (
    typeof object === "object" &&
    object &&
    Object.keys(object).length > 0 &&
    condition &&
    isArray(condition, ">", 0)
  ) {
    forEach(Object.entries(object), ([key, value]) => {
      const index = condition.findIndex(
        (item) => item.includes(key) && item.includes("[")
      );
      if (index > -1) {
        const bigCase = condition[index].indexOf("[");
        const mainKey = condition[index].slice(0, bigCase);
        const subKeyItem = condition[index].slice(
          bigCase + 1,
          condition[index].length - 1
        );
        const subKeys = subKeyItem.split(",");
        returnValue[mainKey] = removeColumnsFromObject(value, subKeys);
      } else if (!condition.includes(key))
        returnValue[key] = structuredClone(value);
    });
  } else {
    return object;
  }
  return returnValue;
};

export const sleep = (second: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, second * 1000);
  });

export const makeNested = ({
  object,
  path,
  value,
  force,
  method,
  duplicateCheck,
}: {
  object?: object;
  path?: string;
  value?: any;
  force?: boolean;
  method?: "push";
  duplicateCheck?: string[];
}) => {
  const keys = path ? path.split(/[[\].]+?/) : [];
  const lastKey = path ? (keys.pop() as string) : "self";
  const lastObj = path
    ? keys.reduce(
        (obj: { [key: string]: any }, key) => (obj[key] = obj[key] || {}),
        object ?? {}
      )
    : { self: object };
  if (method === "push") {
    if (!lastObj[lastKey]) lastObj[lastKey] = [value];
    else if (
      (duplicateCheck &&
        !lastObj[lastKey].find((item: any) =>
          duplicateCheck.every((checkKey) => item[checkKey] === value[checkKey])
        )) ||
      (!duplicateCheck && !lastObj[lastKey].find((item: any) => item === value))
    )
      lastObj[lastKey].push(value);
  } else if (!lastObj[lastKey] || force) {
    lastObj[lastKey] = value;
  }
};

export const isDate = (value: any): value is Date =>
  (typeof value === "object" &&
    value !== null &&
    typeof value.getTime === "function" &&
    !isNaN(value)) ||
  (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(value) &&
    dayjs(value).isValid());

export const isUseObject = (object: any): object is object =>
  typeof object === "object" &&
  object !== undefined &&
  object !== null &&
  !Number.isNaN(object) &&
  Object.keys(object)?.length > 0;

export const initialMultiNested = ({
  object,
  path,
  value,
}: {
  object?: object;
  path: string[];
  value?: any;
}) => {
  if (object && isArray(path, ">", 0) && value !== undefined)
    forEach(path, (pathString) =>
      makeNested({ object, path: pathString, value })
    );
};

export const propsCheker = (props: object, checkList: string[]) => {
  const keys = Object.keys(props);
  return checkList.every((keyword) => keys.includes(keyword));
};

export const convertDate = (data: any) => new Date(data);

export const dateUpdater = (object: any) => {
  const start = (object: any): any => {
    if (typeof object === "object" && object !== null) {
      if (isDate(object)) {
        return convertDate(object);
      }
      if (isArray(object, "===", 0)) {
        return [];
      }
      if (isArray(object, ">", 0)) {
        return object.map((item: any) => start(item));
      }
      return objectUpdater(object);
    }
    if (isDate(object)) {
      return convertDate(object);
    }
    return object;
  };
  const objectUpdater = (object: any) => {
    const returnObject: { [key: string]: any } = {};
    forEach(Object.entries(object), ([key, value]) => {
      if (isDate(value)) {
        returnObject[key] = convertDate(value);
      } else if (typeof value === "object" && value !== null) {
        if (isArray(value, "===", 0)) {
          returnObject[key] = [];
        } else if (isArray(value, ">", 0)) {
          returnObject[key] = value.map((item) => start(item));
        } else returnObject[key] = objectUpdater(value);
      } else returnObject[key] = value;
    });
    if (Object.keys(returnObject).length === 0) {
      return isDate(object) ? convertDate(object) : object;
    }
    return returnObject;
  };
  return start(object);
};

const isDecimal = (value: any): value is Decimal => Decimal.isDecimal(value);

export const decimalUpdater = (object: any, useString?: boolean) => {
  const start = (object: any): any => {
    if (typeof object === "object" && object !== null) {
      if (isDecimal(object)) {
        return useString ? String(object.toNumber()) : object.toNumber();
      }
      if (isArray(object, "===", 0)) {
        return [];
      }
      if (isArray(object, ">", 0)) {
        return object.map((item: any) => start(item));
      }
      return objectUpdater(object);
    }
    if (isDecimal(object)) {
      return useString ? String(object.toNumber()) : object.toNumber();
    }
    return object;
  };
  const objectUpdater = (object: any) => {
    const returnObject: { [key: string]: any } = {};
    forEach(Object.entries(object), ([key, value]) => {
      if (isDecimal(value)) {
        returnObject[key] = useString
          ? String(value.toNumber())
          : value.toNumber();
      } else if (typeof value === "object" && value !== null) {
        if (isArray(value, "===", 0)) {
          returnObject[key] = [];
        } else if (isArray(value, ">", 0)) {
          returnObject[key] = value.map((item) => start(item));
        } else returnObject[key] = objectUpdater(value);
      } else returnObject[key] = value;
    });
    if (Object.keys(returnObject).length === 0) {
      if (isDecimal(object)) {
        return useString ? String(object.toNumber()) : object.toNumber();
      }
      return object;
    }
    if (isDecimal(returnObject)) {
      useString ? String(returnObject.toNumber()) : returnObject.toNumber();
    }
    return returnObject;
  };
  return start(object);
};

export const getProfileString = (column: string) =>
  `${column ? ` ${column}` : ""}`;

export const combineArray = <T>(array: T[][]) => {
  const returnArray: T[] = [];
  forEach(array, (item) => Array.prototype.push.apply(returnArray, item));
  return returnArray;
};

export const randomStringNumber = (length: number) => {
  const characters = "0123456789";
  let result = "";
  for (let count = 0; count < length; count += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const randomStringPassword = (length: number) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let count = 0; count < length; count += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const getBoolean = (value: any) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return false;
};

export const getYesOrNo = (value: any) => {
  if (typeof value === "string") {
    if (value === "yes") return true;
    if (value === "no") return false;
  }
};

export const getBooleanString = (value: boolean) => (value ? "true" : "false");

export const isDifference = (
  A: any,
  B: any,
  option?: { uidNames?: string[]; ignoreColumns?: string[] }
) => {
  const start = (
      A: any,
      B: any,
      option?: { uidNames?: string[]; ignoreColumns?: string[] }
    ) => {
      let isDifference = false;
      if (
        (isUseObject(A) || isArray(A)) &&
        (isUseObject(B) || isArray(B)) &&
        (!option?.uidNames || isArray(option?.uidNames, ">", 0)) &&
        (!option?.ignoreColumns || isArray(option?.ignoreColumns, ">", 0))
      ) {
        isDifference = compareAtoB(A, B, option) || compareAtoB(B, A, option);
      } else {
        isDifference = A !== B;
      }
      return isDifference;
    },
    compareAtoB = (
      A: any,
      B: any,
      option?: { uidNames?: string[]; ignoreColumns?: string[] }
    ): any => {
      if (
        typeof A === "object" &&
        A !== null &&
        A !== undefined &&
        typeof B === "object" &&
        B !== null &&
        B !== undefined
      ) {
        if (isArray(A) && isArray(B)) {
          if (isArray(A, "===", 0) && isArray(B, "===", 0)) {
            return false;
          }
          if (A.length !== B.length) {
            return true;
          }
          return map(A as any[], (Aitem, index) =>
            option?.uidNames
              ? option.uidNames.reduce((total, uidName) => {
                  return (
                    total ||
                    compareAtoB(
                      Aitem,
                      B[
                        (B as any[]).findIndex(
                          (Bitem) => Bitem[uidName] === Aitem[uidName]
                        )
                      ],
                      option
                    )
                  );
                }, false)
              : compareAtoB(Aitem, B[index], option)
          ).reduce((total, current) => total || current, false);
        }
        return compareObjectAtoB(A, B, option);
      }
      return A !== B;
    },
    compareObjectAtoB = (
      A: any,
      B: any,
      option?: { uidNames?: string[]; ignoreColumns?: string[] }
    ): any => {
      let isDifference = false;
      if (Object.keys(A).length === Object.keys(B).length)
        forEach(Object.entries(A), ([key, value]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            value !== undefined &&
            (!option?.ignoreColumns ||
              (option?.ignoreColumns && !option?.ignoreColumns.includes(key)))
          ) {
            if (
              isDate(value) &&
              isDate(B?.[key]) &&
              convertDate(value).getTime() !== convertDate(B?.[key]).getTime()
            ) {
              isDifference = true;
              return "break";
            }
            if (isArray(value) && isArray(B?.[key])) {
              if (value.length !== B[key].length) {
                isDifference = true;
                return "break";
              }
              if (isArray(value, "===", 0) && isArray(B?.[key], "===", 0)) {
                return undefined;
              }
              isDifference =
                isDifference ||
                map(value as any[], (item, index) =>
                  option?.uidNames
                    ? option.uidNames.reduce((total, uidName) => {
                        return (
                          total ||
                          compareAtoB(
                            item,
                            B[key][
                              (B[key] as any[]).findIndex(
                                (Bitem) => Bitem[uidName] === item[uidName]
                              )
                            ],
                            option
                          )
                        );
                      }, false)
                    : compareAtoB(item, B[key][index], option)
                ).reduce((total, current) => total || current, false);
            } else {
              isDifference =
                isDifference || compareObjectAtoB(value, B?.[key], option);
            }
          } else {
            isDifference = isDifference || value !== B?.[key];
          }
          return undefined;
        });
      else if (
        !option?.ignoreColumns ||
        (option?.ignoreColumns &&
          option?.ignoreColumns.every(
            (column) =>
              !Object.keys(A).includes(column) &&
              !Object.keys(B).includes(column)
          ))
      ) {
        isDifference = true;
      }
      return isDifference;
    };
  return start(A, B, option);
};

export const now = () => dayjs().tz("Asia/Seoul");
