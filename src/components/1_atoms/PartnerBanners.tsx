"use client";

import clsx from "clsx";
import { AppRoute, QueryKey } from "@/helpers/types";
import { partnersGet } from "@/helpers/get";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import Image from "next/image";
import Link from "next/link";

interface PartnerItem {
  id: number;
  name: string;
  url: string;
  public_banner_image_url: string;
}

export const PartnerBanners = ({
  position,
  displayMode,
}: {
  position: "left" | "right" | "all";
  displayMode: "mobile" | "pc" | "all";
}) => {
  const { data: partners } = useGetQuery<PartnerItem[], undefined>(
    {
      queryKey: [QueryKey.partners],
    },
    partnersGet
  );

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
          {partners?.map((p) => (
            <Link key={`left-${p.id}`} href={p.url} target="_blank">
              <Image
                src={`https://${p.public_banner_image_url}`}
                alt={p.name}
                width={308}
                height={100}
                className="rounded-lg border shadow w-full max-md:hidden aspect-[308/100]"
                unoptimized
              />
              <Image
                src={`https://${p.public_banner_image_url}`}
                alt={p.name}
                width={308}
                height={100}
                className="rounded-lg border shadow w-full md:hidden aspect-[308/100]"
                unoptimized
              />
            </Link>
          ))}
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
