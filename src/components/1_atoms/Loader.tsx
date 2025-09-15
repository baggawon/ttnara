import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { ReactNode } from "react";
import { Terminal } from "../../../node_modules/lucide-react";
import { Center } from "@/helpers/css";

const Loader = ({ children }: { children?: ReactNode }) => (
  <div role="status" className={Center}>
    <div className="relative">
      <Alert>
        <Terminal className="h-4 w-4 animate-fader" />
        <AlertTitle className="text-left">Loading</AlertTitle>
        <AlertDescription className="">
          <span className="sr-only">Loading...</span>
          {children && (
            <p className="text-left whitespace-nowrap">{children}</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  </div>
);

export default Loader;
