import { cn } from "@/components/lib/utils";
import { RankBadge } from "./rank/RankBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const DisplayRank = ({
  rank_level,
  rank_image,
  rank_name,
  className,
}: {
  rank_level: number | 1;
  rank_image: string | "bronze.png";
  rank_name: string | "브론즈";
  className?: string;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              "relative group rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 flex items-center justify-center w-9 h-9",
              className
            )}
          >
            <div className="transition-opacity duration-200 group-hover:opacity-0 flex items-center justify-center">
              <RankBadge badgeName={rank_image} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="text-sm font-medium">{rank_level}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{rank_name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
