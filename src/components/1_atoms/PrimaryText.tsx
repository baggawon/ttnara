import type { ReactNode } from "react";

const PrimaryText = ({ children }: { children: ReactNode }) => (
  <b className="text-primary">{children}</b>
);

export default PrimaryText;
