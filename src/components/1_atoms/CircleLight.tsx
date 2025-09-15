import clsx from "clsx";

export const CircleLight = ({
  className,
  value,
}: {
  className?: string;
  value?: boolean;
}) => (
  <span
    className={clsx(
      "w-2 h-2 block rounded-full bg-fail",
      value ? "bg-success" : "bg-fail",
      className
    )}
  />
);
