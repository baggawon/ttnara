"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import {
  validateCity,
  validateCustomAddress,
  validateToipcName,
  validateTradeName,
  validateTradePriceType,
} from "@/helpers/validate";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { type InnerTetherWithProfile } from "@/app/(main)/(useWidget)/board/tether/edit/[tether]/hook";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import { filterMap, map } from "@/helpers/basic";
import SelectInput from "@/components/2_molecules/Input/Select";
import { TetherAddressTypes } from "@/helpers/types";
import { EasyTooltip } from "@/components/1_atoms/EasyTooltip";
import { CircleHelp } from "lucide-react";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import dynamic from "next/dynamic";
import type { TetherListResponse } from "@/app/api/tethers/read";
const Ckeditor5Input = dynamic(
  () => import("@/components/2_molecules/Input/Ckeditor5Input"),
  { ssr: false }
);

export const EtcSettings = ({
  onParentChange,
  parentCategories,
  tethersData,
}: {
  onParentChange: (value: string) => void;
  parentCategories: {
    label: string;
    value: string;
  }[];
  tethersData: TetherListResponse | null;
}) => {
  const { setValue } = useFormContext(); // retrieve all hook methods

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">기타설정</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormBuilder
            name="address_type"
            label="주소 기준선택"
            formClassName="!gap-0"
          >
            <WithUseWatch name={["address_type"]}>
              {({ address_type }: InnerTetherWithProfile) => (
                <ToggleGroupInput
                  name="address_type"
                  variant="outline"
                  orientation="horizontal"
                  className="justify-start mt-4"
                  validate={validateTradePriceType}
                  onValueChange={(value) => {
                    setValue("address_type", value);

                    if (value === TetherAddressTypes.Category) {
                      setValue("city", "");
                      setValue("state", "");
                      setValue("custom_address", "");
                    } else if (value === TetherAddressTypes.Custom) {
                      setValue("city", "");
                      setValue("state", "");
                      setValue("custom_address", "");
                    }
                  }}
                >
                  {map(
                    [
                      {
                        name: TetherAddressTypes.Category,
                        value: TetherAddressTypes.Category,
                        tooltip: "카테고리에서 지역을 선택합니다.",
                      },
                      {
                        name: TetherAddressTypes.Custom,
                        value: TetherAddressTypes.Custom,
                        tooltip: "입력란에 주소를 넣습니다.",
                      },
                      // {
                      //   name: "시장 가격",
                      //   value: TetherPriceTypes.Margin,
                      //   tooltip:
                      //     "거래의 판매가가 테더 시장가의 변동에 따라 바뀌게 됩니다.",
                      // },
                    ],
                    (trade_type) => (
                      <EasyTooltip
                        key={`${trade_type.name}*&*${trade_type.value}`}
                        button={
                          <ToggleGroupItem
                            value={trade_type.value}
                            aria-label={trade_type.name}
                            className={clsx(
                              address_type === trade_type.value && "bg-accent"
                            )}
                          >
                            {trade_type.name}

                            <CircleHelp
                              width={20}
                              height={20}
                              className="cursor-pointer"
                            />
                          </ToggleGroupItem>
                        }
                      >
                        {trade_type.tooltip}
                      </EasyTooltip>
                    )
                  )}
                </ToggleGroupInput>
              )}
            </WithUseWatch>
          </FormBuilder>

          <WithUseWatch name={["address_type"]}>
            {({ address_type }: InnerTetherWithProfile) => (
              <FormBuilder
                name="city"
                label="지역"
                disabled={address_type === TetherAddressTypes.Custom}
              >
                <SelectInput
                  name="city"
                  placeholder="지역 선택"
                  items={parentCategories}
                  onChange={onParentChange}
                  validate={(value) =>
                    address_type === TetherAddressTypes.Category
                      ? validateCity(value)
                      : undefined
                  }
                  buttonClassName="w-full"
                  disabled={address_type === TetherAddressTypes.Custom}
                />
              </FormBuilder>
            )}
          </WithUseWatch>

          <WithUseWatch name={["parent_id", "address_type"]}>
            {({ parent_id, address_type }: InnerTetherWithProfile) => (
              <FormBuilder
                name="state"
                label="세부지역"
                disabled={address_type === TetherAddressTypes.Custom}
              >
                {parent_id !== 0 ? (
                  <SelectInput
                    name="state"
                    placeholder="세부지역 선택"
                    items={filterMap(
                      tethersData!.tether_categories,
                      (category) =>
                        category.parent_id === parent_id && {
                          label: category.name,
                          value: category.name,
                        }
                    )}
                    buttonClassName="w-full"
                    disabled={address_type === TetherAddressTypes.Custom}
                  />
                ) : (
                  <Input
                    placeholder="지역을 먼저 선택해주세요"
                    disabled={address_type === TetherAddressTypes.Custom}
                  />
                )}
              </FormBuilder>
            )}
          </WithUseWatch>

          <WithUseWatch name={["address_type"]}>
            {({ address_type }: InnerTetherWithProfile) => (
              <FormInput
                name="custom_address"
                label="주소"
                disabled={address_type === TetherAddressTypes.Category}
                validate={(value) =>
                  address_type === TetherAddressTypes.Custom
                    ? validateCustomAddress(value)
                    : undefined
                }
              />
            )}
          </WithUseWatch>
        </div>
        <FormInput name="title" label="제목" validate={validateTradeName} />

        <FormBuilder name="condition" label="거래내용">
          <Ckeditor5Input name="condition" validate={validateToipcName} />
        </FormBuilder>
      </CardContent>
    </Card>
  );
};
