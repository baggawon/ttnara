"use client";

import { Button } from "@/components/ui/button";
import { admins } from "@/helpers/config";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { sessionGet } from "@/helpers/get";
import { AdminAppRoute, QueryKey } from "@/helpers/types";
import type { Session } from "next-auth";
import Link from "next/link";

export const GoAdminPageButton = () => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  return (
    session?.user?.auth &&
    admins.includes(session.user.auth) && (
      <Link href={AdminAppRoute.Dashboard}>
        <Button type="button" className="noto-sans-kr">
          어드민
        </Button>
      </Link>
    )
  );
};
