"use client";

import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  type InnerTetherWithProfile,
  useTetherEditHook,
} from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";
import { TradeType } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/TradeType";
import { Price } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/Price";
import { EtcSettings } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/EtcSettings";
import { AlertP2PTrade } from "@/components/1_atoms/AlertP2PTrade";

export const TetherEditor = ({ tether_id }: { tether_id?: number }) => {
  const {
    methods,
    tethersData,
    goBackList,
    editSave,
    parentCategories,
    onParentChange,
    userData,
  } = useTetherEditHook(tether_id);

  return (
    <FormProvider {...methods}>
      <Form onSubmit={editSave} className="w-full">
        <section className="w-full flex flex-col gap-4 p-0 md:p-4">
          <WithUseWatch name={["id"]}>
            {({ id }: InnerTetherWithProfile) => (
              <h1>{id === 0 ? "거래추가" : "거래편집"}</h1>
            )}
          </WithUseWatch>
          <TradeType userData={userData} />

          <Price />

          <EtcSettings
            tethersData={tethersData}
            parentCategories={parentCategories}
            onParentChange={onParentChange}
          />

          <AlertP2PTrade />

          <div className="flex gap-2">
            <Button onClick={goBackList} type="button" variant="outline">
              목록으로
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </section>
      </Form>
    </FormProvider>
  );
};
