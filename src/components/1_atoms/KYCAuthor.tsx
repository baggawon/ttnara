import clsx from "clsx";

export const KYCAuthor = ({ className }: { className?: string }) => {
  return (
    <div className={clsx("flex gap-1 items-center", className)}>
      <p className="text-success font-bold">KYC</p>
    </div>
  );
};
