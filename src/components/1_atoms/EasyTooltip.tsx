import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/components/lib/utils";

export const EasyTooltip = ({
  button,
  children,
  asChild = true,
  buttonClassName,
  contentClassName,
}: {
  button: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
  buttonClassName?: string;
  contentClassName?: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild={asChild} className={cn(buttonClassName)}>
        {button}
      </TooltipTrigger>
      <TooltipContent className={cn(contentClassName)}>
        {children}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
