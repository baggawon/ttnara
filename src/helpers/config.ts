import { SearchType } from "@/helpers/types";

export let version = "";

async function fetchVersion() {
  version = (await import("../../package.json")).version;
}
fetchVersion();

export const PAGESIZES = [5, 10, 20, 50, 100];

export const specialCharReg = /[^a-zA-Z0-9ㄱ-힣]/g;

export const dateFormat = "YYYY.MM.DD";

export const DEBOUNCE_MILISECOND = 100;

export const REQUEST_LIMIT_MINUTE = 1;

export const VALIDATE_LIMIT_MINUTE = 30;

export const TestEmailUser = "honggildong@gmail.com";

export const MAXNUMBER = 100000000000000;

export const signoutText = "동의합니다";

export const isAbleLoginCondition = () => ({
  is_active: true,
});

export const UPLOAD_FILE_LIMIT = 15;

export const UPLOAD_FILE_SIZE_MB = 10;

export const uploadTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export const bettingId = "bettingId";

export const DECIMAL_LIMIT = 9;

export const SHORT_DECIMAL_LIMIT = 2;

export const MOBILE_WIDTH = 768;

export const colorData: { [key: string]: string } = {
  c: "bg-green-300",
  x: "bg-gray-300",
  t: "bg-violet-300",
  n: "bg-red-300",
  y: "bg-blue-300",
};

export const admins = ["admin", "superAdmin"];

export const PAGINAGION_SIZE = 10;

export const canWriteTopics = ["freedom", "tips"];

export const searchItems = [
  {
    value: SearchType.제목,
    label: "제목",
  },
  {
    value: SearchType.내용,
    label: "내용",
  },
  {
    value: SearchType.제목_내용,
    label: "제목+내용",
  },
  {
    value: SearchType.회원아이디,
    label: "회원아이디",
  },
  {
    value: SearchType.글쓴이,
    label: "글쓴이",
  },
];

export const searchItemsForAlarm = [
  {
    value: SearchType.제목,
    label: "제목",
  },
  {
    value: SearchType.내용,
    label: "내용",
  },
  {
    value: SearchType.제목_내용,
    label: "제목+내용",
  },
];
