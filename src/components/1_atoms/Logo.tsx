import clsx from "clsx";
import Link from "next/link";
import { Tether } from "@/components/1_atoms/coin/Tether";

export default function Logo({
  href = "/",
  className = "",
  size = "small",
  logoText = "테더나라",
  textClassName = "font-gongGothicMedium",
  mode = "full",
}) {
  const GradientLogo = ({ size = "text-xl" }) => (
    <div
      className={`${textClassName} ${size} font-bold py-2 rounded-md`}
      style={{
        background:
          "linear-gradient(135deg, #26A17B 0%, #26A17B 50%, #e9c40f 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",

        display: "inline-block",
      }}
    >
      {logoText}
    </div>
  );

  // Determine if we should show the image
  const showImage = mode === "image" || mode === "full";
  // Determine if we should show the text
  const showText = mode === "text" || mode === "full" || mode === "image";

  return (
    <Link
      href={href}
      className={clsx("flex items-center space-x-3", className)}
    >
      {showImage && (
        <Tether
          className={clsx(
            size === "small" && "w-8 h-8",
            size === "large" && "w-12 h-12"
          )}
        />
      )}

      {showText && (
        <GradientLogo
          size={clsx(
            size === "small" && "text-2xl",
            size === "large" && "text-3xl"
          )}
        />
      )}
    </Link>
  );
}
