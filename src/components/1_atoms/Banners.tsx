import clsx from "clsx";
import { AppRoute } from "@/helpers/types";
import Image from "next/image";
import Link from "next/link";

export const Banners = ({
  position,
  displayMode,
}: {
  position: "left" | "right" | "all";
  displayMode: "mobile" | "pc" | "all";
}) => {
  return (
    <div
      className={clsx(
        displayMode === "mobile" && "md:hidden",
        displayMode === "pc" && "max-md:hidden",
        "flex flex-col gap-4"
      )}
    >
      {["all", "left"].includes(position) && (
        <>
          <Link href="https://bynexp2p.com" target="_blank">
            <Image
              src="/assets/bynex.gif"
              alt="바이넥스"
              width={248}
              height={400}
              className="rounded-lg border shadow w-full max-md:hidden"
              unoptimized
            />
            <Image
              src="/assets/bynex_mobile.gif"
              alt="바이넥스"
              width={308}
              height={100}
              className="rounded-lg border shadow w-full md:hidden"
              unoptimized
            />
          </Link>
          <Link
            href="https://f1x2.net/?serial=61324165&creative_id=5813"
            target="_blank"
          >
            <Image
              src="/assets/fun1x2_248_400.gif"
              alt="FUN1X2"
              width={248}
              height={400}
              className="rounded-lg border shadow w-full max-md:hidden"
              unoptimized
            />
            <Image
              src="/assets/fun1x2_450_150.gif"
              alt="FUN1X2"
              width={450}
              height={150}
              className="rounded-lg border shadow w-full md:hidden"
              unoptimized
            />
          </Link>
          {/* <Link href="https://bithaim.com/?recom_id=Gk71273" target="_blank">
            <Image
              src="/assets/TN_248_400.gif"
              alt="비트하임"
              width={248}
              height={400}
              className="rounded-lg border shadow w-full"
              unoptimized
            />
          </Link> */}
        </>
      )}
      {["all", "right"].includes(position) && (
        <>
          <Link href={`${AppRoute.Threads}/guide`}>
            <Image
              src="/assets/users_guide.gif"
              alt="이용안내"
              width={308}
              height={100}
              className="rounded-lg border shadow w-full"
              unoptimized
            />
          </Link>
          <Link href="https://t.me/ttnara114" target="_blank">
            <Image
              src="/assets/customer_service.gif"
              alt="고객센터"
              width={308}
              height={100}
              className="rounded-lg border shadow w-full"
              unoptimized
            />
          </Link>
        </>
      )}
    </div>
  );
};
