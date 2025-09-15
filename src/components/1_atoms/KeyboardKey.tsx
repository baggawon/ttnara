"use client";

import clsx from "clsx";

const isKorean = (str: string) => {
  const code = str.charCodeAt(0);
  const hangleStart = 0xac00;
  const hangleEnd = 0xd7a3;
  return code >= hangleStart && code <= hangleEnd;
};

const KeyboardKey = ({ children }: { children: string }) => {
  return (
    <kbd
      className={clsx(
        "border-[1px] border-black border-solid",
        "shadow-black shadow-sm",
        // "text-[0.85em] leading-[.85em]",
        "text-xs text-black",
        "inline-block",
        isKorean(children) ? "font-sans" : "font-mono",
        "font-extralight tracking-wider",
        "px-[4px] py-[1px] whitespace-nowrap",
        "mx-1 rounded-sm"
      )}
    >
      {children}
    </kbd>
  );
};

export default KeyboardKey;
