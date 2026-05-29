"use client";

import { FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { AlertP2PTrade } from "@/components/1_atoms/AlertP2PTrade";
import {
  type InnerTetherWithProfile,
  useTetherEditHook,
} from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";
import { OrdererInfoCard } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/OrdererInfoCard";
import { PriceCard } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/PriceCard";
import { QuantityCard } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/QuantityCard";
import { LocationCard } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/LocationCard";
import { validateToipcName, validateTradeName } from "@/helpers/validate";
import SimpleMarkdownEditor from "@/components/2_molecules/Input/SimpleMarkdownEditor";
import { Loader2 } from "lucide-react";

export const TetherEditor = ({ tether_id }: { tether_id?: number }) => {
  const {
    methods,
    tethersData,
    tetherSettings,
    attachedMedia,
    goBackList,
    editSave,
    userData,
    isSubmitting,
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

          <OrdererInfoCard userData={userData} />
          <PriceCard />
          <QuantityCard />
          <LocationCard tethersData={tethersData} />

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">제목 및 내용</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormInput
                name="title"
                label="제목"
                validate={validateTradeName}
              />
              <FormBuilder name="condition" label="거래내용">
                <SimpleMarkdownEditor
                  name="condition"
                  formatName="condition_format"
                  validate={validateToipcName}
                  uploadEnabled={tetherSettings?.use_upload_file ?? false}
                  uploadMaxItems={tetherSettings?.max_upload_items ?? 5}
                  uploadMaxSizeMb={tetherSettings?.max_file_size_mb ?? 20}
                  uploadAcceptedExtensions={tetherSettings?.allowed_file_extensions
                    ?.split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)}
                  uploadInitialItems={attachedMedia ?? undefined}
                />
              </FormBuilder>
            </CardContent>
          </Card>

          <AlertP2PTrade />

          <div className="flex gap-2">
            <Button onClick={goBackList} type="button" variant="outline">
              목록으로
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              저장
            </Button>
          </div>
        </section>
      </Form>
    </FormProvider>
  );
};
