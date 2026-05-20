"use client";

import clsx from "clsx";
import { QueryKey } from "@/helpers/types";
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
  variant = "inline",
}: {
  variant?: "sidebar" | "inline";
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
        variant === "sidebar" && "flex flex-col gap-4",
        variant === "inline" &&
          "grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]"
      )}
    >
      {partners?.map((p) => (
        <Link
          key={p.id}
          href={p.url}
          target="_blank"
          className={clsx(
            "block w-full",
            variant === "sidebar" && "max-w-[240px] mx-auto"
          )}
        >
          <Image
            src={p.public_banner_image_url}
            alt={p.name}
            width={240}
            height={78}
            className="rounded-lg border shadow w-full aspect-[240/78]"
            unoptimized
          />
        </Link>
      ))}
    </div>
  );
};
