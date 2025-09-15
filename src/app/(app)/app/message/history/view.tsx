"use client";

import { Button } from "@/components/ui/button";
import { filterMap } from "@/helpers/basic";
import { DataTable } from "@/components/2_molecules/Table/DataTable";
import { messageDefault } from "@/helpers/defaultValue";
import MessageHistoryHook from "./hook";

const MessageHistoryView = () => {
  const { columns, messagesData, DeleteConfirmModal, onRowClassName } =
    MessageHistoryHook();

  return (
    <section className="absolute left-0 w-screen flex flex-col gap-4 [&>div:first-child]:border-t">
      <DataTable
        columns={columns}
        data={messagesData?.history ?? []}
        excludeColumns={[
          ...filterMap(Object.keys(messageDefault()), (key) => {
            if (!["messageData"].includes(key)) return key;
          }),
        ]}
        onRowClassName={onRowClassName}
        className="[&>div:first-child>div>div]:cursor-default [&>div:first-child>div>div]:!m-0 [&>div:first-child>div>div]:rounded-none [&>div:first-child>div>div]:border-b [&>div:first-child>div>div:last-child]:border-b-0 [&>div:first-child>div>div]:border-t-0 [&>div:first-child>div>div]:border-l-0 [&>div:first-child>div>div]:border-r-0"
        useCard
        useHeader={false}
        useTop={false}
        placeholder="보낸 쪽지가 없습니다."
        initialPageSize={5}
      />
      <div className="w-full flex justify-center">
        <Button
          variant="outline"
          type="button"
          onClick={() => window.close()}
          className="w-fit mb-4"
        >
          창닫기
        </Button>
      </div>
      {DeleteConfirmModal}
    </section>
  );
};

export default MessageHistoryView;
