import { MyTetherList } from "@/components/4_templates/MyTetherList";
import { Separator } from "@/components/ui/separator";
import type { Currency, TetherStatus } from "@/helpers/types";
import { requireTetherEnabled } from "@/helpers/server/tetherGuard";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
  await requireTetherEnabled();

  const searchParams = await props.searchParams;

  const page = searchParams.page ? Number(searchParams.page) : undefined;
  const pageSize = searchParams.pageSize
    ? Number(searchParams.pageSize)
    : undefined;
  const status = searchParams.status
    ? (searchParams.status as TetherStatus)
    : undefined;
  const currency = searchParams.currency
    ? (searchParams.currency as Currency)
    : undefined;
  const search = searchParams.search
    ? (searchParams.search as string)
    : undefined;
  const column = searchParams.column
    ? (searchParams.column as string)
    : undefined;

  return (
    <div className="space-y-6">
      <MyTetherList
        page={page}
        pageSize={pageSize}
        status={status}
        currency={currency}
        search={search}
        column={column}
      />
    </div>
  );
}
