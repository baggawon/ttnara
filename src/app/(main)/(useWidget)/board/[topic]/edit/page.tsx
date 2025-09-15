import { AppRoute } from "@/helpers/types";
import { redirect } from "next/navigation";

export default async function Page() {
  redirect(AppRoute.Main);

  return <></>;
}
