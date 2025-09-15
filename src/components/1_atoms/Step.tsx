import clsx from "clsx";
import { convertIndex } from "@/helpers/common";

const Step = ({
  index,
  label,
  active,
}: {
  index: number;
  label: string;
  active: boolean;
}) => (
  <div className="flex justify-center flex-col items-center">
    <span
      className={clsx(
        "flex justify-center items-center w-[42px] h-[42px] text-white mb-[10px] rounded-full transition-all",
        active ? "bg-[#333]" : "bg-black/30"
      )}
    >
      <p>{convertIndex(index + 1)}</p>
    </span>
    <p
      className={clsx(
        "text-[14px] font-bold transition-all",
        active ? "text-[#333]" : "text-black/30"
      )}
    >
      {label}
    </p>
  </div>
);

export default Step;
