"use client";

import type { tether_category } from "@prisma/client";
import type { TetherCategoryDeleteProps } from "@/app/api/admin_di2u3k2j/tether_category/delete";
import type {
  TetherCategoryListResponse,
  TetherCategoryReadProps,
} from "@/app/api/admin_di2u3k2j/tether_category/read";
import type { TetherCategoryRestoreProps } from "@/app/api/admin_di2u3k2j/tether_category/restore";
import type { TetherCategoryUpdateProps } from "@/app/api/admin_di2u3k2j/tether_category/update";
import clsx from "clsx";
import FormDialog, {
  type FormDialogMethods,
} from "@/components/1_atoms/FormDialog";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import SelectInput from "@/components/2_molecules/Input/Select";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { filterMap, forEach, map } from "@/helpers/basic";
import { postJson } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { tetherCategoryDefault } from "@/helpers/defaultValue";
import { adminTetherCategoriesGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { validateTetherCategoryName } from "@/helpers/validate";
import { useRef, useState } from "react";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TetherSettingsForm } from "@/app/(admin)/admin/boards/tether/settingsForm";

export default function BoardThether() {
  const createRef = useRef<HTMLButtonElement | null>(null);
  const dialogControllRef = useRef<FormDialogMethods>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: tetherCategoriesData } = useGetQuery<
    TetherCategoryListResponse,
    TetherCategoryReadProps
  >(
    {
      queryKey: [QueryKey.tetherCategories],
    },
    adminTetherCategoriesGet
  );

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const toppestCreate = async (
    data: tether_category,
    cancelRef: RefObject<HTMLButtonElement | null>,
    methods: UseFormReturn<any, any, undefined>
  ) => {
    setLoading();

    try {
      const { isSuccess, hasMessage } =
        await postJson<TetherCategoryUpdateProps>(
          ApiRoute.adminTetherCategoriesUpdate,
          data
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(tetherCategoryDefault());
        (cancelRef.current as any)?.click();
        queryClient.invalidateQueries({
          queryKey: [QueryKey.tetherCategories],
        });
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  interface TetherCategoryNest extends tether_category {
    children: TetherCategoryNest[];
  }

  const convertList = (list: tether_category[]) => {
    const returnValues: TetherCategoryNest[] = [];
    forEach(list, (item) => {
      if (item.parent_id === null) {
        returnValues.push({ ...item, children: [] });
      } else {
        const parent = returnValues.find(
          (parent) => parent.id === item.parent_id
        );
        if (parent) {
          parent.children.push({ ...item, children: [] });
        }
      }
    });

    return returnValues;
  };

  const deleteList = async (id: number) => {
    setLoading();

    try {
      const { isSuccess, hasMessage } =
        await postJson<TetherCategoryDeleteProps>(
          ApiRoute.adminTetherCategoriesDelete,
          {
            deleteTetherCategoryId: id,
          }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        queryClient.invalidateQueries({
          queryKey: [QueryKey.tetherCategories],
        });
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const restoreList = async (id: number) => {
    setLoading();

    try {
      const { isSuccess, hasMessage } =
        await postJson<TetherCategoryRestoreProps>(
          ApiRoute.adminTetherCategoriesRestore,
          {
            restoreTetherCategoryId: id,
          }
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        queryClient.invalidateQueries({
          queryKey: [QueryKey.tetherCategories],
        });
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const parentCreate = (id: number) => {
    dialogControllRef.current?.methods.reset(
      tetherCategoryDefault({ parent_id: id })
    );
    createRef.current?.click();
  };

  const allCategories = tetherCategoriesData?.tetherCategories ?? [];
  const visibleCategories = showDeleted
    ? allCategories
    : allCategories.filter((c) => c.is_active);

  return (
    <section className="w-full flex flex-col gap-4">
      <h2>거래 게시판 설정</h2>

      <TetherSettingsForm />

      <Card>
        <CardHeader>
          <h4>지역 관리</h4>
        </CardHeader>
        <CardContent className="w-full flex flex-col gap-4">
          <div className="flex gap-4 items-center justify-between flex-wrap">
            <FormDialog
              title="지역 추가"
              description="지역을 추가하시려면 확인을 눌러주세요."
              onConfirm={toppestCreate}
              initialize={() => tetherCategoryDefault()}
              dialogControllRef={dialogControllRef}
              formChildren={
                <>
                  <FormInput
                    name="name"
                    label="지역 이름"
                    validate={validateTetherCategoryName}
                  />
                  <WithUseWatch name={["id"]}>
                    {({ id }: { id: number }) => {
                      return (
                        <FormBuilder name="parent_id" label="상위 지역">
                          <SelectInput
                            name="parent_id"
                            items={filterMap(
                              allCategories,
                              (item) =>
                                item.id !== Number(id) &&
                                item.parent_id === null &&
                                item.is_active && {
                                  value: item.id,
                                  label: item.name,
                                }
                            )}
                            placeholder="상위 지역 선택"
                            buttonClassName="!w-full"
                          />
                        </FormBuilder>
                      );
                    }}
                  </WithUseWatch>
                </>
              }
            >
              <Button type="button" ref={createRef}>
                추가
              </Button>
            </FormDialog>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
              삭제된 지역 표시
            </label>
          </div>
          <section className="w-full flex flex-col gap-4">
            {map(convertList(visibleCategories), (item) => (
              <Accordion
                type="single"
                collapsible
                key={`${item.id}*&*${item.name}`}
              >
                <AccordionItem
                  value={`${item.id}*&*${item.name}`}
                  className={clsx(
                    "px-4 border shadow",
                    !item.is_active && "opacity-60 bg-muted/40"
                  )}
                >
                  <AccordionTrigger className="hover:no-underline gap-4 [&[data-state=open]]:border-b">
                    <div className="w-full flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h4
                          className={clsx(
                            "font-normal",
                            !item.is_active &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </h4>
                        {!item.is_active && (
                          <Badge variant="outline">삭제됨</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.is_active ? (
                          <>
                            <span
                              className={clsx(
                                buttonVariants({ variant: "outline" }),
                                "cursor-pointer !py-1 h-[30px] !px-2"
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                deleteList(item.id);
                              }}
                            >
                              삭제
                            </span>
                            <span
                              className={clsx(
                                buttonVariants({ variant: "default" }),
                                "cursor-pointer !py-1 h-[30px] !px-2"
                              )}
                              onClick={(e) => {
                                e.preventDefault();
                                parentCreate(item.id);
                              }}
                            >
                              하위 추가
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
                              restoreList(item.id);
                            }}
                          >
                            복구
                          </span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {map(item.children, (child) => (
                      <div
                        className={clsx(
                          "w-full my-2 flex justify-between items-center mt-4",
                          !child.is_active && "opacity-60"
                        )}
                        key={`${item.id}*&*${item.name}*&*${child.id}*&*${child.name}`}
                      >
                        <div className="flex items-center gap-2">
                          <h4
                            className={clsx(
                              "font-normal",
                              !child.is_active &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            {child.name}
                          </h4>
                          {!child.is_active && (
                            <Badge variant="outline">삭제됨</Badge>
                          )}
                        </div>
                        {child.is_active ? (
                          <span
                            className={clsx(
                              buttonVariants({ variant: "outline" }),
                              "cursor-pointer !py-1 h-[30px] !px-2"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              deleteList(child.id);
                            }}
                          >
                            삭제
                          </span>
                        ) : (
                          <span
                            className={clsx(
                              buttonVariants({ variant: "default" }),
                              "cursor-pointer !py-1 h-[30px] !px-2"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              restoreList(child.id);
                            }}
                          >
                            복구
                          </span>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </section>
        </CardContent>
      </Card>
    </section>
  );
}
