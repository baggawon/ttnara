"use client";

import type { guarantee_region } from "@prisma/client";
import type {
  GuaranteeRegionListResponse,
  GuaranteeRegionReadProps,
} from "@/app/api/admin_di2u3k2j/guarantee_region/read";
import type { GuaranteeRegionUpdateProps } from "@/app/api/admin_di2u3k2j/guarantee_region/update";
import type { GuaranteeRegionDeleteProps } from "@/app/api/admin_di2u3k2j/guarantee_region/delete";
import type { GuaranteeRegionRestoreProps } from "@/app/api/admin_di2u3k2j/guarantee_region/restore";

import clsx from "clsx";
import { useRef, useState, type RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";

import FormDialog, {
  type FormDialogMethods,
} from "@/components/1_atoms/FormDialog";
import { FormInput, InputType } from "@/components/2_molecules/Input/FormInput";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

import { postJson } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { guaranteeRegionDefault } from "@/helpers/defaultValue";
import { adminGuaranteeRegionsGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import {
  validateGuaranteeRegionDisplayOrder,
  validateGuaranteeRegionName,
} from "@/helpers/validate";
import { map } from "@/helpers/basic";

export default function AdminGuaranteeRegionsCard() {
  const createRef = useRef<HTMLButtonElement | null>(null);
  const createDialogRef = useRef<FormDialogMethods>(undefined);
  const editDialogRef = useRef<FormDialogMethods>(undefined);
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const { data: regionsData } = useGetQuery<
    GuaranteeRegionListResponse,
    GuaranteeRegionReadProps
  >(
    {
      queryKey: [QueryKey.guaranteeRegions],
    },
    adminGuaranteeRegionsGet
  );

  const submit = async (
    data: GuaranteeRegionUpdateProps,
    cancelRef: RefObject<HTMLButtonElement | null>,
    methods: UseFormReturn<any, any, undefined>,
    isEdit: boolean
  ) => {
    setLoading();
    try {
      const payload: GuaranteeRegionUpdateProps = {
        id: data.id ?? 0,
        name: typeof data.name === "string" ? data.name.trim() : "",
        display_order: Number(data.display_order) || 1,
        is_active: data.is_active ?? true,
      };
      const { isSuccess, hasMessage } =
        await postJson<GuaranteeRegionUpdateProps>(
          ApiRoute.adminGuaranteeRegionsUpdate,
          payload
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      } else if (isSuccess) {
        toast({
          id: isEdit
            ? ToastData.guaranteeRegionUpdate
            : ToastData.guaranteeRegionCreate,
          type: "success",
        });
      }
      if (isSuccess) {
        methods.reset(guaranteeRegionDefault());
        cancelRef.current?.click();
        queryClient.invalidateQueries({
          queryKey: [QueryKey.guaranteeRegions],
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKey.guaranteeCompanies],
        });
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    disableLoading();
  };

  const deleteRegion = async (id: number) => {
    setLoading();
    try {
      const { isSuccess, hasMessage } =
        await postJson<GuaranteeRegionDeleteProps>(
          ApiRoute.adminGuaranteeRegionsDelete,
          { deleteGuaranteeRegionId: id }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      } else if (isSuccess) {
        toast({ id: ToastData.guaranteeRegionDelete, type: "success" });
      }
      if (isSuccess) {
        queryClient.invalidateQueries({
          queryKey: [QueryKey.guaranteeRegions],
        });
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    disableLoading();
  };

  const restoreRegion = async (id: number) => {
    setLoading();
    try {
      const { isSuccess, hasMessage } =
        await postJson<GuaranteeRegionRestoreProps>(
          ApiRoute.adminGuaranteeRegionsRestore,
          { restoreGuaranteeRegionId: id }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        queryClient.invalidateQueries({
          queryKey: [QueryKey.guaranteeRegions],
        });
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    disableLoading();
  };

  const openEdit = (region: guarantee_region) => {
    editDialogRef.current?.methods.reset(guaranteeRegionDefault(region));
    editTriggerRef.current?.click();
  };

  const all = regionsData?.guaranteeRegions ?? [];
  const visible = showDeleted ? all : all.filter((r) => r.is_active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>지역 관리</CardTitle>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
              삭제된 지역 표시
            </label>
            <FormDialog
              title="지역 추가"
              description="공식보증업체 등록 시 사용할 지역을 추가합니다."
              onConfirm={(data, cancelRef, methods) =>
                submit(data, cancelRef, methods, false)
              }
              initialize={() => guaranteeRegionDefault()}
              dialogControllRef={createDialogRef}
              formChildren={
                <div className="flex flex-col gap-3">
                  <FormInput
                    name="name"
                    label="지역 이름"
                    placeholder="예: 서울특별시"
                    validate={validateGuaranteeRegionName}
                  />
                  <FormInput
                    name="display_order"
                    label="순서"
                    type={InputType.number}
                    min={1}
                    validate={validateGuaranteeRegionDisplayOrder}
                  />
                </div>
              }
            >
              <Button type="button" ref={createRef} size="sm">
                지역 추가
              </Button>
            </FormDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <FormDialog
          title="지역 수정"
          description="지역 정보를 수정합니다."
          onConfirm={(data, cancelRef, methods) =>
            submit(data, cancelRef, methods, true)
          }
          initialize={() => guaranteeRegionDefault()}
          dialogControllRef={editDialogRef}
          formChildren={
            <div className="flex flex-col gap-3">
              <FormInput
                name="name"
                label="지역 이름"
                validate={validateGuaranteeRegionName}
              />
              <FormInput
                name="display_order"
                label="순서"
                type={InputType.number}
                min={1}
                validate={validateGuaranteeRegionDisplayOrder}
              />
            </div>
          }
        >
          <button
            ref={editTriggerRef}
            type="button"
            className="hidden"
            aria-hidden
          />
        </FormDialog>

        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {showDeleted
              ? "등록된 지역이 없습니다."
              : "활성화된 지역이 없습니다."}
          </p>
        ) : (
          <div className="flex flex-col divide-y border rounded-md">
            {map(visible, (region) => (
              <div
                key={region.id}
                className={clsx(
                  "flex items-center justify-between gap-3 px-4 py-2.5",
                  !region.is_active && "bg-muted/40"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-8 shrink-0">
                    #{region.display_order}
                  </span>
                  <span
                    className={clsx(
                      "truncate",
                      !region.is_active && "line-through text-muted-foreground"
                    )}
                  >
                    {region.name}
                  </span>
                  {!region.is_active && <Badge variant="outline">삭제됨</Badge>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {region.is_active ? (
                    <>
                      <span
                        className={clsx(
                          buttonVariants({ variant: "outline" }),
                          "cursor-pointer !py-1 h-[30px] !px-2"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          openEdit(region);
                        }}
                      >
                        수정
                      </span>
                      <span
                        className={clsx(
                          buttonVariants({ variant: "outline" }),
                          "cursor-pointer !py-1 h-[30px] !px-2"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`'${region.name}' 지역을 삭제할까요?`)) {
                            deleteRegion(region.id);
                          }
                        }}
                      >
                        삭제
                      </span>
                    </>
                  ) : (
                    <span
                      className={clsx(
                        buttonVariants({ variant: "default" }),
                        "cursor-pointer !py-1 h-[30px] !px-2"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        restoreRegion(region.id);
                      }}
                    >
                      복구
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
