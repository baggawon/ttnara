export const LenBadge = ({ len }: { len?: number }) => {
  return (
    <>
      {(len ?? 0) > 0 && (
        <span className="text-[0.6rem] absolute -top-1 -right-2 p-0 w-fit h-4 px-[5px] flex justify-center items-center rounded-full border-transparent bg-fail text-fail-foreground shadow hover:bg-fail/80">
          {len}
        </span>
      )}
    </>
  );
};
