import clsx from "clsx";

const InputSuffix = ({ children }: { children: React.ReactNode }) => (
  <div
    className={clsx(
      "flex h-10 w-10 rounded-l-none rounded-r-md border-t border-r border-b border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "items-center justify-center"
    )}
  >
    {children}
  </div>
);

export default InputSuffix;
