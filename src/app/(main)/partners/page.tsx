"use client";

import Image from "next/image";
import Link from "next/link";
import { QueryKey } from "@/helpers/types";
import { partnersGet } from "@/helpers/get";
import useGetQuery from "@/helpers/customHook/useGetQuery";

interface PartnerItem {
  id: number;
  name: string;
  url: string;
  public_partner_image_url: string;
}

export default function PartnersPage() {
  const { data: partners, status } = useGetQuery<PartnerItem[], undefined>(
    {
      queryKey: [QueryKey.partners],
    },
    partnersGet
  );

  if (status === "pending") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 max-md:py-0 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">제휴업체</h1>

      <div className="max-md:w-full hidden md:flex flex-wrap justify-center gap-6 md:gap-8 max-md:flex-col max-md:items-center">
        {partners?.map((partner) => (
          <Link
            key={partner.id}
            href={partner.url}
            target="_blank"
            className="group block max-md:w-full"
          >
            <div className="relative overflow-hidden rounded-lg border shadow-md transition-all duration-300 hover:shadow-lg group-hover:scale-105">
              <Image
                src={`https://${partner.public_partner_image_url}`}
                alt={partner.name}
                width={300}
                height={200}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
          </Link>
        ))}
      </div>

      {(!partners || partners.length === 0) && status !== "pending" && (
        <div className="text-center text-gray-500 py-12">
          등록된 파트너 업체가 없습니다.
        </div>
      )}
    </section>
  );
}
