import clsx from "clsx";
import { Center } from "@/helpers/css";

const RoundedIcon = ({
  Icon,
  color,
}: {
  Icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  color?: "gray" | "primary";
}) => {
  const getBorderColor = () => {
    switch (color) {
      case "gray":
        return "border-gray-400";
      case "primary":
        return "border-primary";
      default:
        return "border-primary";
    }
  };
  const getColor = () => {
    switch (color) {
      case "gray":
        return "text-gray-400";
      case "primary":
        return "text-primary";
      default:
        return "text-primary";
    }
  };

  return (
    <div
      className={clsx(
        "w-[42px] h-[42px] relative rounded-full border-2",
        getBorderColor()
      )}
    >
      <Icon width={24} height={24} className={clsx(Center, getColor())} />
    </div>
  );
};

export default RoundedIcon;
