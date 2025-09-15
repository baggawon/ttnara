import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
import {
  convertDate,
  forEach,
  getBoolean,
  isArray,
  isDate,
  isUseObject,
  map,
  pipe,
  removeColumnsFromObject,
} from "@/helpers/basic";
import type { TFunctionProps } from "@/helpers/basic";
import type { Dispatch, SetStateAction } from "react";
import {
  dateFormat,
  specialCharReg,
  TestEmailUser,
  UPLOAD_FILE_SIZE_MB,
  version,
} from "@/helpers/config";
import { AppRoute, BroadcastChannels, BroadcastEvents } from "@/helpers/types";
import type { AdminAppRoute, ApiRoute } from "@/helpers/types";
import { Currency } from "@/helpers/types";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import type { EasyTableHeader } from "@/components/2_molecules/Table/EasyTable";
import { utils, writeFile } from "xlsx";
import { ToastData } from "@/helpers/toastData";
import { signOut as authSignOut, getSession } from "next-auth/react";
import {
  useAdminModeStore,
  useSessionStore,
  useVersionStore,
} from "@/helpers/state";
import Decimal from "decimal.js";
import type { CellContext, Column } from "@tanstack/react-table";
import type { NextRequest } from "next/server";
import type { QueryClient } from "@tanstack/react-query";
import type { profile } from "@prisma/client";

interface FilterProps {
  column: string;
  method: "asc" | "desc";
}
interface SimpleFilterProps extends FilterProps {
  data: any[];
}

interface StringKeyObject {
  [key: string]: any;
}

export const convertId = (id?: string) => id?.replace(specialCharReg, "");

export const getDateString = (Date: Date, dateFormatter = dateFormat) =>
  dayjs(Date).format(dateFormatter);

export const encode = (s: string) => {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    out[i] = s.charCodeAt(i);
  }
  return new Uint8Array(out);
};

export const parseQueryParams = <T>(request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const returnValues: { [key: string]: any } = {};
  searchParams.forEach((value, key) => {
    let returnData: any = value;
    if (["true", "false"].includes(value)) returnData = getBoolean(value);
    if (Number(value) >= 0) returnData = Number(value);

    if (returnData !== "undefined") returnValues[key] = returnData;
  });
  return returnValues as T;
};

export const makeQueryParams = (object: object) => {
  let returnValues = "";
  if (Object.keys(object).length > 0) {
    forEach(Object.entries(object), ([key, value]) => {
      returnValues += returnValues === "" ? "?" : "&";
      returnValues += `${key}=${value}`;
    });
  }
  return returnValues;
};

export const removeColumnsFromArray = (array: object[], condition: string[]) =>
  isArray(array, ">", 0) && isArray(condition, ">", 0)
    ? array.map((item) => removeColumnsFromObject(item, condition))
    : [];
export const convertIndex = (index: number) => {
  const str = index.toString();
  if (str.length === 1) {
    return `0${str}`;
  }
  return str;
};

export const safeMath = (math: any) =>
  Number.isNaN(math) || Infinity === math ? 0 : math;

export const orderByColumnAndDelete = ({
  data,
  column,
  method,
}: SimpleFilterProps) => {
  const order = {
    asc: [-1, 1],
    desc: [1, -1],
  };
  if (!column || !method) {
    return data;
  }
  const sortResult = data.sort((a, b) => {
    const [firstMethod, firstMethod2] = order[method];
    if (a[column] < b[column]) return firstMethod!;
    if (b[column] < a[column]) return firstMethod2!;
    return 0;
  });

  return removeColumnsFromArray(sortResult, [column]);
};

export const orderByColumnMultiple = ({
  data,
  filter,
}: {
  data: any[];
  filter: FilterProps[];
}) => {
  const order = {
    asc: [-1, 1],
    desc: [1, -1],
  };
  if (
    !isArray(filter) ||
    !filter?.every(
      (filterData) =>
        filterData.column &&
        filterData.method &&
        ["asc", "desc"].includes(filterData.method)
    )
  ) {
    return data;
  }
  return data.sort((a, b) => {
    let targetMethod = 0;
    forEach(filter, ({ column, method }) => {
      const [firstMethod, firstMethod2] = order[method];
      const convertA = isDate(a[column])
        ? convertDate(a[column]).getTime()
        : a[column];
      const convertB = isDate(b[column])
        ? convertDate(b[column]).getTime()
        : b[column];
      if (convertA < convertB && targetMethod === 0)
        targetMethod = firstMethod!;
      if (convertB < convertA && targetMethod === 0)
        targetMethod = firstMethod2!;
    });
    return targetMethod;
  });
};

export const orderByColumn = ({ data, column, method }: SimpleFilterProps) => {
  const order = {
    asc: [-1, 1],
    desc: [1, -1],
  };
  const [method1, method2] = order[method];
  return data.sort((a, b) => {
    const convertA = isDate(a[column])
      ? convertDate(a[column]).getTime()
      : a[column];
    const convertB = isDate(b[column])
      ? convertDate(b[column]).getTime()
      : b[column];
    if (convertA < convertB) return method1!;
    if (convertB < convertA) return method2!;
    return 0;
  });
};

export const onCheckBox = ({
  event,
  tableSelectedList,
  setTableSelectedList,
  selectOnlyOne,
}: {
  event: any;
  tableSelectedList: string[];
  setTableSelectedList: Dispatch<SetStateAction<never[]>>;
  selectOnlyOne?: boolean;
}) => {
  const Id = event.target.id;
  if (Id !== false) {
    const tableSelectedListTemp = isArray(tableSelectedList, ">", 0)
      ? [...tableSelectedList]
      : [];
    if (tableSelectedListTemp.includes(Id)) {
      setTableSelectedList(
        tableSelectedListTemp.filter((item) => item !== Id) as never[]
      );
    } else {
      setTableSelectedList(
        selectOnlyOne
          ? ([Id] as never[])
          : ([...tableSelectedListTemp, Id] as never[])
      );
    }
  }
};

export const isUseColumn = (object: any) =>
  (object !== undefined &&
    object !== null &&
    !Number.isNaN(object) &&
    object !== "") ||
  typeof object === "boolean";

export const RemoveUnUseElements = {
  start: (object: any, type?: string, keys?: string[]): any => {
    if (typeof object === "object" && object !== null && object !== undefined) {
      if (isArray(object, "===", 0)) {
        return type !== "emptyArray" && [];
      }
      if (isArray(object, ">", 0)) {
        return object
          .map((item) => RemoveUnUseElements.start(item, type, keys))
          .filter((item) => isUseColumn(item) || isUseObject(item));
      }
      return RemoveUnUseElements.objectTreeShaking(object, type, keys);
    }
    if (isUseColumn(object)) return object;
    return undefined;
  },
  objectTreeShaking: (object: any, type?: string, keys?: string[]) => {
    const returnObject: StringKeyObject = {};
    forEach(Object.entries(object), ([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        value !== undefined &&
        ((type === "tiny" && !keys?.includes(key)) || type !== "tiny")
      ) {
        if (isDate(value)) {
          returnObject[key] = convertDate(value);
        } else if (isArray(value, "===", 0)) {
          if (type !== "emptyArray") returnObject[key] = [];
        } else if (isArray(value, ">", 0)) {
          returnObject[key] = map(value, (item) =>
            RemoveUnUseElements.start(item, type, keys)
          ).filter((item) => isUseColumn(item) || isUseObject(item));
        } else
          returnObject[key] = RemoveUnUseElements.objectTreeShaking(
            value,
            type,
            keys
          );
      } else if (isDate(value)) {
        returnObject[key] = convertDate(value);
      } else if (isUseColumn(value)) {
        returnObject[key] = value;
      }
      if (
        (type === "tiny" && keys?.includes(key)) ||
        (!isUseColumn(returnObject[key]) && !isUseObject(returnObject[key]))
      )
        delete returnObject[key];
    });
    return Object.keys(returnObject).length > 0 ? returnObject : undefined;
  },
};

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

export const searchValueFromObject = (object: any) => {
  const start = (object: any): any => {
      if (
        typeof object === "object" &&
        object !== null &&
        object !== undefined
      ) {
        if (isDate(object)) {
          return pipe(object, convertDate, getDateString);
        }
        if (isArray(object, "===", 0)) {
          return "";
        }
        if (isArray(object, ">", 0)) {
          return map(object, (item) => start(item))
            .filter((item) => isUseColumn(item) || isUseObject(item))
            .join(" ");
        }
        return objectCollapse(object);
      }
      if (isUseColumn(object)) {
        return object;
      }
      return "";
    },
    objectCollapse = (object: any) => {
      const returnObject: StringKeyObject = {};
      forEach(Object.entries(object), ([key, value]) => {
        if (
          typeof value === "object" &&
          value !== null &&
          value !== undefined
        ) {
          if (!returnObject[key]) {
            if (isDate(value)) {
              returnObject[key] = pipe(value, convertDate, getDateString);
            } else if (isArray(value, ">", 0)) {
              returnObject[key] = value
                .map((item) => start(item))
                .filter((item) => isUseColumn(item) || isUseObject(item))
                .join(" ");
            } else returnObject[key] = objectCollapse(value);
          } else if (isUseColumn(value)) returnObject[key] = value;
          if (
            !isUseColumn(returnObject[key]) &&
            !isUseObject(returnObject[key])
          )
            delete returnObject[key];
        } else if (isUseColumn(value)) {
          returnObject[key] = value;
        }
      });
      if (Object.keys(returnObject).length > 0) {
        const result = Object.entries(returnObject)
          .map(([, value]) => value)
          .join(" ")
          .toLowerCase();
        return result;
      }
      return "";
    };
  return start(object);
};

// export const getChildrenHeight = (wrapper:HTMLElement) => {
//   let height = 0;
//   forEach(wrapper?.children, (children) => {
//     if (children?.clientHeight) height += Number(children.clientHeight);
//   });
//   return height;
// };

// export const setParentHeight = (wrapper: HTMLElement) => {
//   if (wrapper.id === 'collapseWrapper') {
//     // eslint-disable-next-line no-param-reassign
//     wrapper.style = `${getChildrenHeight(wrapper)}px`;
//     if (wrapper?.parentElement?.parentElement) {
//       // eslint-disable-next-line no-param-reassign
//       wrapper.parentElement.parentElement.style = `${getChildrenHeight(
//         wrapper.parentElement.parentElement
//       )}px`;
//     }
//   }
//   if (wrapper.parentElement) setParentHeight(wrapper.parentElement);
// };

export const arraySplitter = (array: any[], groupSize = 10) => {
  const returnValues: any[] = [];
  if (isArray(array, ">", 0)) {
    forEach(new Array(Math.ceil(array.length / groupSize)), (index) => {
      const result = array.slice(
        Math.round(index * groupSize),
        Math.round((index + 1) * groupSize)
      );
      if (isArray(result, ">", 0)) returnValues.push(result);
    });
  }
  return returnValues;
};

export const writeErrorMessage = (text: string, error: string) =>
  error === "" ? `${text}` : ` ${text}`;

export const convertTimeString = (date: string) =>
  dayjs(date).format(dateFormat);

export const delay = (second: number) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(2), (second ?? 1) * 1000);
  });
};

export const reducePromises = <T>(array: T[], callback: TFunctionProps<T>) =>
  array.reduce(
    (prevPrms, currElem, index) =>
      (prevPrms as any).then(async (prevRes: any[]) => {
        const currRes = await callback(currElem, index);
        return [...prevRes, currRes];
      }),
    Promise.resolve([])
  );

export const waitForCondition = (condition: (data?: any) => boolean) =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      if (condition()) {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);
  });

export const makeRandomString = (length: number) => {
  let result = "";
  const characters = "0123456789";
  const charactersLength = characters.length;
  for (let count = 0; count < length; count += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const isTestUser = (email: string) => email === TestEmailUser;

const waitLoginRoute = () =>
  waitForCondition(() => {
    if (
      typeof window !== "undefined" &&
      typeof window.location?.reload === "function"
    ) {
      if (!window.location.href.includes(AppRoute.Main)) {
        window.location?.reload();
      }
      return true;
    }
    return false;
  });

export const postJson = async <B>(
  url: ApiRoute,
  data?: B,
  restore?: () => void
) => {
  try {
    const useAdmin = useAdminModeStore.getState().on;
    let json: any;
    const body = data
      ? {
          ...data,
          version,
          ...(useAdmin && { useAdmin: true }),
        }
      : { version, ...(useAdmin && { useAdmin: true }) };

    if (process.env.NODE_ENV === "test") {
      const load = await import(`app${url}`);
      json = await load.POST(body);
    } else {
      const result = await fetch(url, {
        method: "post",
        body: JSON.stringify(body),
        headers: [["Content-Type", "application/json"]],
      });
      json = await result.json();
    }
    const parse = await parseFetchResult(json, restore);
    return parse;
  } catch (error) {
    restore?.();
    console.log(error);
    throw error;
  }
};

export const postFormData = async (
  url: ApiRoute,
  data: FormData,
  restore?: () => void
) => {
  try {
    const useAdmin = useAdminModeStore.getState().on;
    let json: any;

    data.append("version", version);
    if (useAdmin) data.append("useAdmin", "true");

    if (process.env.NODE_ENV === "test") {
      const load = await import(`app${url}`);
      json = await load.POST(data);
    } else {
      const result = await fetch(url, {
        method: "post",
        body: data,
      });
      json = await result.json();
    }
    const parse = await parseFetchResult(json, restore);
    return parse;
  } catch (error) {
    restore?.();
    console.log(error);
    throw error;
  }
};

export const get = async (url: ApiRoute, option?: any) => {
  try {
    const useAdmin = useAdminModeStore.getState().on;
    let json: any;
    const params = option?.query
      ? {
          ...option.query,
          version,
          ...(useAdmin && { useAdmin: true }),
        }
      : {
          version,
          ...(useAdmin && { useAdmin: true }),
        };

    if (process.env.NODE_ENV === "test") {
      const load = await import(`app${url}`);
      json = await load.GET(params);
    } else {
      const concatUrl = `${url}${makeQueryParams(params)}`;
      const result = await fetch(concatUrl, option);
      json = await result.json();
    }
    const parse = await parseFetchResult(json);
    return parse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getSpan = (
  start: number,
  remain: number,
  currentIndex: number
) => ({
  isDisplay: start >= currentIndex || remain + start - currentIndex <= 0,
  startIndex: start === currentIndex,
  remainCount: remain + start - currentIndex,
});

export const isString = (value: any): value is string =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  typeof value === "string";

export const isStringArray = (value: any): value is string[] =>
  isArray(value) && !value.some((item) => !isString(item));

export const convertDurationDay = (date: Date) => {
  const timeDiff = dayjs.duration(dayjs().diff(dayjs(date))).format("M.D.H");
  const [month, day, hour] = map(timeDiff.split("."), (string) =>
    Number(string)
  );
  const isToday = month === 0 && day === 0 && hour < dayjs().hour();
  const countDay = Math.floor((hour - dayjs().hour()) / 24 + 1 + day);
  let returnText = `${countDay}일 전`;
  if (month > 0) {
    returnText = `${month}개월 전`;
  } else if (countDay > 6) {
    returnText = `${Math.floor(countDay / 7)}주 전`;
  }
  return isToday ? `오늘` : returnText;
};

export const getJsonFromStream = async <T>(
  stream?: ReadableStreamDefaultReader<Uint8Array>
) => {
  const bodyStream = stream;
  let body = "";
  while (bodyStream && true) {
    const { done, value } = await bodyStream.read();
    if (done) break;
    body += new TextDecoder().decode(value);
  }
  const data: T | undefined = body !== "" ? JSON.parse(body) : undefined;
  return data;
};

export const getLabelFromColumns = (
  columns: CustomColumDef[],
  accessorKey: string,
  value: any
) => {
  const column = columns.find((column) => column.accessorKey === accessorKey);
  return column?.option?.[value].label ?? "";
};

export const parseFetchResult = async (result: any, restore?: () => void) => {
  const parse = {
    hasMessage: result?.message as string | undefined,
    isSuccess: result?.result as boolean,
    hasData: result?.result && result?.data,
    hasStatus: result?.status,
    noAuth:
      typeof result?.message === "string" &&
      [
        ToastData.noAuth,
        ToastData.blocked,
        ToastData.waitConfirm,
        ToastData.inactive,
      ].includes(result!.message),
    oldVersion: result?.message === ToastData.oldVersion,
  };

  if (parse.noAuth) {
    const status = useSessionStore.getState();
    if (!status.needLogout) status.logoutRequest();
  }
  if (parse.oldVersion) useVersionStore.getState().openRequest();
  if (!parse.isSuccess) restore?.();
  return parse;
};

export const extensionCondition = (result: any) => ({
  hasPermission: typeof result?.hasPermission === "boolean",
});

export interface HistoryTableProps {
  type: string;
  headers: EasyTableHeader[];
  name: string;
  data: any[];
}

export const excelDownload = async (
  name?: string,
  tableData?: {
    type: string;
    headers: EasyTableHeader[];
    name: string;
    data: any[];
  }[]
) => {
  if (tableData && tableData.length > 0) {
    const wb = utils.book_new();

    forEach(tableData, (table) => {
      const makeXlsxData = map(table.data, (value) => {
        const result: any[] = [];
        forEach(table.headers, (header) => {
          result.push(value[header.id]);
        });
        return result;
      });
      const headers = map(table.headers, (header) => header.label);
      const dataWS = utils.json_to_sheet([headers, ...makeXlsxData], {
        skipHeader: true,
      });
      utils.book_append_sheet(wb, dataWS, table.name);
    });
    writeFile(
      wb,
      `${dayjs().format("YYYYMMDD")}_${convertId(name ?? "")}.xlsx`
    );
  }
};

export const signOut = async () => {
  const session = await getSession();
  if (session?.user) {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(BroadcastChannels.Auth);
      channel.postMessage(BroadcastEvents.SignOut);
    }
    await authSignOut();
    await waitLoginRoute();
  }
};

export const pipeToParam = (url: string) =>
  `${url}?${
    typeof window !== undefined && window.location.href.split("?")?.[1]
      ? window.location.href.split("?")?.[1]
      : ""
  }`;

export const allowFileSize = (size: number) =>
  size / 1024 ** 2 < UPLOAD_FILE_SIZE_MB;

export const dividCommaDecimal = (score: number) =>
  Number(score.toFixed(2)).toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });

export const convertFileSize = (size: number) => {
  let returnValue;
  const condition: {
    [key: string]: () => number;
  } = {
    bytes: () => size,
    KB: () => size / 1024,
    MB: () => size / 1024 ** 2,
    GB: () => size / 1024 ** 3,
    TB: () => size / 1024 ** 4,
  };
  forEach(Object.keys(condition), (unit) => {
    const calculateFunction = condition[unit];
    if (calculateFunction() < 1000 && calculateFunction() > 1) {
      returnValue = `${dividCommaDecimal(calculateFunction())} ${unit}`;
      return "break";
    }
    return undefined;
  });
  return returnValue;
};

export const getFileData = (file: File) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  lastModified: file.lastModified,
});

export const convertToSelectOptions = (data: object) =>
  map(Object.entries(data), ([value, label]) => ({
    value,
    label,
  }));

export const getNumber = (value: any) => value ?? 0;

export const setTestId = (id: string) => ({
  ...(process.env.NODE_ENV === "test" && {
    "data-testid": id,
  }),
});

export const convertDataToDecimal = (data: any) => {
  forEach(Object.entries(data), ([key, value]) => {
    if (typeof value === "number") {
      (data as any)[key] = new Decimal(value);
    }
  });
  return data;
};

export const elipsisCondition = (text: any, length: number) => [
  "whitespace-nowrap",
  text &&
    String(text).replace(/<[^>]*>?/g, "")?.length > length &&
    "text-ellipsis w-[300px] overflow-hidden",
  ((text && String(text)?.length < 8) || !text) && "w-[100px]",
];

export const getNickname = (name?: string) => name?.split("*&*")?.[0] ?? name;

export const getNameId = (name?: string) => name?.split("*&*")?.[1] ?? name;

export const lazyUpdate = (callback: () => void, time = 0) => {
  setTimeout(() => {
    callback();
  }, time);
};

export const getLocaleString = (value: any) => {
  const isZero = Number(value) === 0 || Number.isNaN(Number(value));
  return isZero ? "" : Number(value).toLocaleString("ko-KR");
};

export const getFixedString = (value: any) => {
  const isZero = Number(value) === 0 || Number.isNaN(Number(value));
  return isZero ? "" : value;
};

export const getExcludeColumnByObject = (object: any) => {
  let returnValues = "";
  forEach(Object.entries(object), ([key, value]) => {
    returnValues += returnValues === "" ? key : `,${key}`;
    if (
      typeof value === "object" &&
      value !== null &&
      value !== undefined &&
      !isDate(value)
    ) {
      returnValues += `[${getExcludeColumnByObject(value)}]`;
    }
  });
  return returnValues;
};

export const validData = <T>(data: any): data is T =>
  !Object.values(ToastData).includes(data);

export const goPureRoute = (route: AdminAppRoute) => {
  const [protocol, _, host] = window.location.href.split("/");
  window.location.href = `${protocol}//${host}${route}`;
};

export const screenshotsRoute = () => {
  const [protocol, _, host] = window.location.href.split("/");
  return `${protocol}//${host}/screenshots/`;
};

export const convertToNumber = (value: any): number => {
  if (value !== 0 && !value) return 0;
  if (value?.toNumber) return value.toNumber();
  return Number(value);
};

export const decimalToNumber = (value: any): number =>
  typeof value?.toNumber === "function" ? value.toNumber() : Number(value);

export const getConvertValue = (props: CellContext<any, any>) =>
  (props.column?.columnDef as any)?.convertValue(props.getValue());

export const getColumnHeaderTitle = (column: Column<any, any>) =>
  (column?.columnDef as any)?.headerTitle ?? "";

export const stringView = (value: string) => (value === "" ? "-" : value);

export const convertNumberFromBigint = (value: any) => {
  const returnValues: any = {};
  forEach(Object.entries(value), ([key, data]) => {
    returnValues[key] =
      typeof (data as any)?.toNumber === "function"
        ? (data as any).toNumber()
        : data;
  });
  return returnValues;
};

export const makeRandomText = ({
  frontText = "",
  possibleLetter = "0123456789",
  length = 6,
}) => {
  let text = frontText;
  for (let count = 0; count < length; count++) {
    text += possibleLetter.charAt(
      Math.floor(Math.random() * possibleLetter.length)
    );
  }
  return text;
};

/* eslint-disable no-console */
export const withLogging = ({ msg, type }: { msg: string; type: string }) => {
  if (process.env.NODE_ENV !== "production") {
    switch (type) {
      case "error":
        console.error(msg);
        break;
      case "info":
        console.info(msg);
        break;
      case "log":
        console.log(msg);
        break;
      default:
        console.log(msg);
    }
  }
};

export const extractTextFromHtml = (html: string) => {
  return html
    .replace(/<[^>]+>/g, " ") // HTML 태그를 공백으로 변경
    .replace(/&nbsp;/g, " ") // &nbsp; 처리
    .replace(/&amp;/g, "&") // &amp; 처리
    .replace(/&lt;/g, "<") // &lt; 처리
    .replace(/&gt;/g, ">") // &gt; 처리
    .replace(/&quot;/g, '"') // &quot; 처리
    .replace(/\s+/g, " ") // 연속된 공백을 하나로
    .trim(); // 앞뒤 공백 제거
};

export const cleanFormData = (
  props: any,
  keys: {
    keysToNullify?: string[];
    keysToNumber?: string[];
    keysToString?: string[];
  }
) => {
  if (keys.keysToNullify) {
    forEach(keys.keysToNullify, (key) => {
      if (props[key] === "" || props[key] === undefined || props[key] === -1) {
        props[key] = null;
      } else if (props[key] !== null) {
        props[key] = Number(props[key]);
      }
    });
  }
  if (keys.keysToString) {
    forEach(keys.keysToString, (key) => {
      if (props[key] === "" || props[key] === undefined || props[key] === -1) {
        props[key] = null;
      } else if (props[key] !== null) {
        props[key] = String(props[key]);
      }
    });
  }

  if (keys.keysToNumber) {
    forEach(keys.keysToNumber, (key) => {
      // console.log(`key: ${key}, value: ${props[key]}`);
      props[key] = Number(props[key]);
    });
  }
};

export const refreshCache = (queryClient: QueryClient, queryKey?: string) => {
  queryClient
    .getQueryCache()
    .getAll()
    .forEach((query) => {
      if (queryKey) {
        if (
          JSON.stringify(query.queryKey).includes(`"${queryKey}":`) ||
          JSON.stringify(query.queryKey) === `["${queryKey}"]`
        ) {
          queryClient.invalidateQueries({
            queryKey: query.queryKey,
            exact: true,
          });
        }
      } else {
        queryClient.invalidateQueries({
          queryKey: query.queryKey,
          exact: true,
        });
      }
    });
};

export const getCoin = (currency: Currency) => {
  if (currency === Currency.테더) return "테더";
  if (currency === Currency.트론) return "트론";
  return currency;
};

export const getDisplayname = (
  profile: Pick<profile, "displayname" | "is_app_admin"> | null | undefined
) => {
  if (profile?.is_app_admin) return "관리자";
  if (profile?.displayname) return profile.displayname;
  return "";
};
