import { cn } from "@/components/lib/utils";

export const ButtonBadge = ({
  label,
  className,
}: {
  label: string | number;
  className?: string;
}) => (
  <p
    className={cn(
      "absolute w-6 h-6 flex justify-center items-center leading-none font-bold -right-1 -top-3 bg-primary-foreground rounded-full text-primary text-sm border",
      className
    )}
  >
    {label}
  </p>
);
