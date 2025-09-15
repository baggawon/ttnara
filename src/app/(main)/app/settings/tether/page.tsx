import { MyTetherList } from "@/components/4_templates/MyTetherList";
import { Separator } from "@/components/ui/separator";
import type { Currency, TetherStatus } from "@/helpers/types";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
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
      <div>
        <h3 className="text-lg font-medium">거래관리</h3>
        <p className="text-sm text-muted-foreground">거래 내역을 관리합니다.</p>
      </div>
      <Separator />
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
