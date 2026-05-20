"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { map } from "@/helpers/basic";
import { TetherAddressTypes } from "@/helpers/types";
import { validateCustomAddress } from "@/helpers/validate";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { TetherListResponse } from "@/app/api/tethers/read";
import type { InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";

export const LocationCard = ({
  tethersData,
}: {
  tethersData: TetherListResponse | null | undefined;
}) => {
  const { setValue, getValues } = useFormContext<InnerTetherWithProfile>();
  const categories = useMemo(
    () => tethersData?.tether_categories ?? [],
    [tethersData?.tether_categories]
  );

  const [parentId, setParentId] = useState<number | null>(null);
  const [childId, setChildId] = useState<number | null>(null);

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null && c.is_active),
    [categories]
  );

  const childCategories = useMemo(
    () =>
      parentId !== null
        ? categories.filter((c) => c.parent_id === parentId && c.is_active)
        : [],
    [categories, parentId]
  );

  const getCategoryLabel = (id: number): string => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return `#${id}`;
    if (cat.parent_id === null) return cat.name;
    const parent = categories.find((c) => c.id === cat.parent_id);
    return parent ? `${parent.name} ${cat.name}` : cat.name;
  };

  const addRegion = () => {
    const idToAdd = childId ?? parentId;
    if (idToAdd === null) return;
    const current = getValues("region_category_ids") ?? [];
    if (current.includes(idToAdd)) return;
    setValue("region_category_ids", [...current, idToAdd], {
      shouldDirty: true,
    });
    setChildId(null);
  };

  const removeRegion = (id: number) => {
    const current = getValues("region_category_ids") ?? [];
    setValue(
      "region_category_ids",
      current.filter((v) => v !== id),
      { shouldDirty: true }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">거래위치</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormBuilder
          name="address_type"
          label="주소 기준"
          formClassName="!gap-0"
        >
          <ToggleGroupInput
            name="address_type"
            variant="outline"
            orientation="horizontal"
            className="justify-start mt-2"
            onValueChange={(value) => {
              if (!value) return;
              setValue("address_type", value);
              if (value === TetherAddressTypes.Custom) {
                setValue("region_category_ids", []);
              } else {
                setValue("custom_address", "");
              }
            }}
          >
            {map(
              [TetherAddressTypes.Category, TetherAddressTypes.Custom],
              (value) => (
                <ToggleGroupItem key={value} value={value} aria-label={value}>
                  {value}
                </ToggleGroupItem>
              )
            )}
          </ToggleGroupInput>
        </FormBuilder>

        <WithUseWatch name={["address_type"]}>
          {({ address_type }: InnerTetherWithProfile) => {
            if (address_type === TetherAddressTypes.Custom) {
              return (
                <FormInput
                  name="custom_address"
                  label="주소"
                  validate={(value) => validateCustomAddress(value)}
                />
              );
            }
            return (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">지역</label>
                    <Select
                      value={parentId !== null ? String(parentId) : ""}
                      onValueChange={(v) => {
                        setParentId(Number(v));
                        setChildId(null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {map(parentCategories, (c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm">세부지역</label>
                    <Select
                      value={childId !== null ? String(childId) : ""}
                      onValueChange={(v) => setChildId(Number(v))}
                      disabled={
                        parentId === null || childCategories.length === 0
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            parentId === null
                              ? "지역을 먼저 선택"
                              : childCategories.length === 0
                                ? "세부지역 없음"
                                : "세부지역 선택"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {map(childCategories, (c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRegion}
                    disabled={parentId === null}
                  >
                    추가
                  </Button>
                </div>

                <WithUseWatch name={["region_category_ids"]}>
                  {({ region_category_ids }: InnerTetherWithProfile) => {
                    const ids = region_category_ids ?? [];
                    if (ids.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          지역을 한 개 이상 추가해주세요.
                        </p>
                      );
                    }
                    return (
                      <div
                        className={clsx(
                          "flex flex-wrap gap-2 p-3 rounded-md border"
                        )}
                      >
                        {map(ids, (id) => (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="gap-1 pl-2.5 pr-1.5 py-1 text-sm"
                          >
                            {getCategoryLabel(id)}
                            <button
                              type="button"
                              onClick={() => removeRegion(id)}
                              className="rounded-full hover:bg-background p-0.5"
                              aria-label={`${getCategoryLabel(id)} 제거`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    );
                  }}
                </WithUseWatch>
              </div>
            );
          }}
        </WithUseWatch>
      </CardContent>
    </Card>
  );
};
