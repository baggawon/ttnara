"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormProvider } from "react-hook-form";
import { map } from "@/helpers/basic";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { Button } from "@/components/ui/button";
import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import {
  type Currency,
  TetherPriceTypes,
  TetherProposalMessengerTypes,
  TetherProposalStatus,
  TetherStatus,
} from "@/helpers/types";
import { decimalToNumber, getCoin, getDisplayname } from "@/helpers/common";
import { tetherRateDefault } from "@/helpers/defaultValue";
import { ProposalPrice } from "@/components/2_molecules/ProposalPrice";
import { inputToLocaleString } from "@/helpers/inputUtils";
import Form from "@/components/1_atoms/Form";
import {
  validateMessenger,
  validateProposalQty,
  validateTelegramId,
} from "@/helpers/validate";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Fragment } from "react";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import FormDialog from "@/components/1_atoms/FormDialog";
import { StarInput } from "@/components/2_molecules/Input/StarInput";
import {
  type ProposalMethods,
  useTetherDetail,
} from "@/app/(main)/(useWidget)/board/tether/[tether]/hook";
import CkeditorViewer from "@/components/1_atoms/CkeditorViewer";
import type { PriceProviderProps } from "@/helpers/customHook/usePriceProvider";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import { Telegram } from "@/components/1_atoms/assets/Telegram";
import { Kakaotalk } from "@/components/1_atoms/assets/Kakaotalk";
import { AlertP2PTrade } from "@/components/1_atoms/AlertP2PTrade";
import { CircleLight } from "@/components/1_atoms/CircleLight";
import { Switch } from "@/components/ui/switch";

export const TetherDetail = ({
  tether_id,
  password,
}: {
  tether_id?: number;
  password: string | undefined;
}) => {
  const {
    currentTether,
    control,
    methods,
    goEdit,
    owner,
    isProposer,
    tryTrade,
    calculateTotal,
    proposalConfirm,
    proposalCancel,
    ownerConfirm,
    ownerCancel,
    tryDelete,
    getAddress,
    dialogControllRef,
  } = useTetherDetail({ tether_id, password });

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        <h3>{currentTether?.title}</h3>
        <FormProvider {...methods}>
          {currentTether && (
            <>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>내역서</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-2 items-start">
                      <Label>코인</Label>
                      <Input
                        readOnly
                        value={getCoin(currentTether.currency as Currency)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 items-start">
                      <Label>거래유형</Label>
                      <Input
                        readOnly
                        value={
                          currentTether.trade_type === "buy" ? "구매" : "판매"
                        }
                      />
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>게시자</Label>
                      <Input
                        readOnly
                        value={getDisplayname(currentTether.user?.profile)}
                        className="text-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>단가</Label>
                      {currentTether.price_type ===
                        TetherPriceTypes.Negotiation && (
                        <Input value="가격협의" readOnly />
                      )}
                      {currentTether.price_type !==
                        TetherPriceTypes.Negotiation && (
                        <ProposalPrice
                          price={currentTether.price ?? null}
                          margin={currentTether.margin ?? null}
                          currency={currentTether.currency as Currency}
                          useInput
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>최소수량</Label>
                      <div className="relative w-full">
                        <Input
                          readOnly
                          value={decimalToNumber(
                            currentTether.min_qty
                          ).toLocaleString()}
                        />
                        <p className="absolute right-4 top-1/2 -translate-y-1/2">
                          {getCoin(currentTether.currency as Currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>최대수량</Label>
                      <div className="relative w-full">
                        <Input
                          readOnly
                          value={decimalToNumber(
                            currentTether.max_qty
                          ).toLocaleString()}
                        />
                        <p className="absolute right-4 top-1/2 -translate-y-1/2">
                          {getCoin(currentTether.currency as Currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>거래 희망지역</Label>
                      <Input readOnly value={getAddress()} />
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>거래횟수</Label>
                      <div className="relative w-full text-blue-500">
                        <Input
                          readOnly
                          value={currentTether.user?.trade_count}
                        />
                        <p className="absolute right-4 top-1/2 -translate-y-1/2">
                          번
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start">
                      <Label>거래평점</Label>
                      <div className="relative w-full text-blue-500">
                        <Input
                          readOnly
                          value={decimalToNumber(
                            currentTether.user?.trade_rate
                          ).toFixed(2)}
                        />
                        <p className="absolute right-4 top-1/2 -translate-y-1/2">
                          점
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-start col-span-1 md:col-span-3">
                      <Label>거래내용</Label>
                      <CkeditorViewer
                        htmlContent={currentTether.condition ?? ""}
                        className="border w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <AlertP2PTrade />

              {isProposer && currentTether.status === TetherStatus.Open && (
                <Card>
                  <CardHeader>
                    <CardTitle>거래 요청서</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col items-start justify-center gap-2">
                      {currentTether.price_type ===
                        TetherPriceTypes.Negotiation && (
                        <p className="text-[20px]">가격협의</p>
                      )}
                      {currentTether.price_type !==
                        TetherPriceTypes.Negotiation && (
                        <ProposalPrice
                          price={currentTether.price ?? null}
                          margin={currentTether.margin ?? null}
                          currency={currentTether.currency as Currency}
                        />
                      )}

                      <WithUseWatch
                        name={["qty"]}
                        subControl={control}
                        subName={[currentTether.currency]}
                      >
                        {({
                          qty,
                          ...props
                        }: ProposalMethods & PriceProviderProps) => (
                          <h3>
                            총{" "}
                            {calculateTotal(
                              String(qty),
                              props[currentTether.currency as Currency]
                                .trade_price
                            )}{" "}
                            원
                          </h3>
                        )}
                      </WithUseWatch>
                    </div>
                    <FormInput
                      name="qty"
                      label="제안수량"
                      inputClassName="relative"
                      validate={(value) =>
                        validateProposalQty(
                          value,
                          decimalToNumber(currentTether.min_qty),
                          decimalToNumber(currentTether.max_qty)
                        )
                      }
                      onChange={(event) =>
                        inputToLocaleString({
                          event,
                          setValues: methods.setValue,
                        })
                      }
                    >
                      <p className="absolute right-4 top-1/2 -translate-y-1/2">
                        {getCoin(currentTether.currency as Currency)}
                      </p>
                    </FormInput>
                    <div className="hidden md:block" />

                    <FormBuilder
                      name="messenger_type"
                      label="메신져 선택"
                      formClassName="!gap-0"
                    >
                      <ToggleGroupInput
                        name="messenger_type"
                        variant="outline"
                        orientation="horizontal"
                        className="justify-start mt-4"
                        validate={validateMessenger}
                        onValueChange={(value) => {
                          methods.setValue("messenger_type", value);
                          methods.setValue(
                            value === TetherProposalMessengerTypes.Telegram
                              ? "kakao_id"
                              : "telegram_id",
                            ""
                          );
                        }}
                      >
                        {map(
                          [
                            {
                              name: (
                                <span className="flex items-center gap-2">
                                  <Telegram className="w-4 h-4" />
                                  텔레그램
                                </span>
                              ),
                              value: TetherProposalMessengerTypes.Telegram,
                            },
                            {
                              name: (
                                <span className="flex items-center gap-2">
                                  <Kakaotalk className="w-4 h-4" />
                                  카카오톡
                                </span>
                              ),
                              value: TetherProposalMessengerTypes.KakaoTalk,
                            },
                          ],
                          (messenger_type) => (
                            <ToggleGroupItem
                              key={`messenger_type*&*${messenger_type.value}`}
                              value={messenger_type.value}
                              aria-label={messenger_type.value}
                            >
                              {messenger_type.name}
                            </ToggleGroupItem>
                          )
                        )}
                      </ToggleGroupInput>
                    </FormBuilder>
                    <WithUseWatch name={["messenger_type"]}>
                      {({ messenger_type }: { messenger_type: string }) => (
                        <>
                          {messenger_type ===
                            TetherProposalMessengerTypes.Telegram && (
                            <FormInput
                              name="telegram_id"
                              label={
                                <span className="flex items-center gap-2">
                                  <Telegram className="w-4 h-4" />
                                  텔레그램ID
                                </span>
                              }
                              validate={validateTelegramId}
                            />
                          )}
                          {messenger_type ===
                            TetherProposalMessengerTypes.KakaoTalk && (
                            <FormInput
                              name="kakao_id"
                              label={
                                <span className="flex items-center gap-2">
                                  <Kakaotalk className="w-4 h-4" />
                                  카카오톡ID
                                </span>
                              }
                              validate={validateTelegramId}
                            />
                          )}
                        </>
                      )}
                    </WithUseWatch>
                  </CardContent>
                </Card>
              )}
              {currentTether.tether_proposals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {owner ? "거래 신청 내역" : "내 거래 신청 내역"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {map(currentTether.tether_proposals, (proposal) => (
                      <Fragment key={proposal.id}>
                        <div className="flex flex-col gap-2 items-start">
                          <Label>신청자</Label>
                          <Input
                            readOnly
                            className="text-blue-500"
                            value={getDisplayname(proposal.user?.profile)}
                          />
                        </div>

                        <div className="flex flex-col gap-2 items-start">
                          <Label>단가</Label>
                          <ProposalPrice
                            price={proposal.price ?? null}
                            margin={null}
                            currency={currentTether.currency as Currency}
                            useInput
                          />
                        </div>

                        <div className="flex flex-col gap-2 items-start">
                          <Label>수량</Label>
                          <div className="relative w-full">
                            <Input
                              readOnly
                              value={decimalToNumber(
                                proposal.qty
                              ).toLocaleString()}
                            />
                            <p className="absolute right-4 top-1/2 -translate-y-1/2">
                              {getCoin(currentTether.currency as Currency)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-start">
                          <Label>총액</Label>
                          <div className="relative w-full">
                            <WithUseWatch
                              name={[currentTether.currency]}
                              control={control}
                            >
                              {(props: PriceProviderProps) => (
                                <Input
                                  readOnly
                                  value={calculateTotal(
                                    String(proposal.qty),
                                    props[currentTether.currency as Currency]
                                      .trade_price
                                  )}
                                />
                              )}
                            </WithUseWatch>
                            <p className="absolute right-4 top-1/2 -translate-y-1/2">
                              원
                            </p>
                          </div>
                        </div>

                        {proposal.messenger_type ===
                          TetherProposalMessengerTypes.Telegram && (
                          <div className="flex flex-col gap-2 items-start">
                            <Label className="flex items-center gap-2">
                              <Telegram className="w-4 h-4" />
                              텔레그램ID
                            </Label>
                            <Input
                              readOnly
                              value={proposal.telegram_id ?? ""}
                            />
                          </div>
                        )}
                        {proposal.messenger_type ===
                          TetherProposalMessengerTypes.KakaoTalk && (
                          <div className="flex flex-col gap-2 items-start">
                            <Label className="flex items-center gap-2">
                              <Kakaotalk className="w-4 h-4" />
                              카카오톡ID
                            </Label>
                            <Input readOnly value={proposal.kakao_id ?? ""} />
                          </div>
                        )}

                        <div className="flex flex-col gap-2 items-start">
                          <Label className="flex items-center gap-2">
                            <CircleLight
                              value={proposal.user?.profile?.kyc_id !== null}
                            />
                            KYC 인증 여부
                          </Label>
                          <Switch
                            className="pointer-events-none"
                            checked={proposal.user?.profile?.kyc_id !== null}
                          />
                        </div>

                        <p className="col-span-1 md:col-span-3 flex gap-4 w-full">
                          거래완료는 실제 거래 완료후에 눌러주세요.
                        </p>
                        <div className="col-span-1 md:col-span-3 flex gap-4 w-full">
                          {owner && (
                            <>
                              {currentTether.status !==
                                TetherStatus.Complete && (
                                <>
                                  <ConfirmDialog
                                    title="거래완료"
                                    description="거래를 완료하시려면 확인을 눌러주세요."
                                    onConfirm={ownerConfirm}
                                  >
                                    <Button type="button">거래완료</Button>
                                  </ConfirmDialog>
                                  {currentTether._count.tether_proposals ===
                                    0 && (
                                    <ConfirmDialog
                                      title="거래취소"
                                      description="거래를 취소하시려면 확인을 눌러주세요."
                                      onConfirm={ownerCancel}
                                    >
                                      <Button type="button" variant="outline">
                                        거래취소
                                      </Button>
                                    </ConfirmDialog>
                                  )}
                                  {currentTether._count.tether_proposals ===
                                    1 && (
                                    <ConfirmDialog
                                      title="거래취소"
                                      description="거래를 취소하시려면 공식 텔레그램으로 연락바랍니다."
                                      onConfirm={() => {}}
                                    >
                                      <Button type="button" variant="outline">
                                        거래취소
                                      </Button>
                                    </ConfirmDialog>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {isProposer && (
                            <>
                              {proposal.status ===
                                TetherProposalStatus.Open && (
                                <>
                                  <FormDialog
                                    title="거래완료"
                                    description="거래를 완료하시려면 확인을 눌러주세요."
                                    onConfirm={proposalConfirm}
                                    initialize={() =>
                                      tetherRateDefault({
                                        tether_proposal_id: proposal.id,
                                      })
                                    }
                                    dialogControllRef={dialogControllRef}
                                    formChildren={
                                      <>
                                        <FormBuilder
                                          name="rate"
                                          label="평점"
                                          formClassName="!flex flex-col items-center"
                                        >
                                          <StarInput name="rate" />
                                        </FormBuilder>
                                      </>
                                    }
                                  >
                                    <Button type="button">거래완료</Button>
                                  </FormDialog>
                                  {currentTether.status !==
                                    TetherStatus.Complete && (
                                    <ConfirmDialog
                                      title="거래 취소"
                                      description="거래를 취소하시려면 확인을 눌러주세요."
                                      onConfirm={proposalCancel}
                                    >
                                      <Button type="button" variant="outline">
                                        거래취소
                                      </Button>
                                    </ConfirmDialog>
                                  )}

                                  {currentTether.status ===
                                    TetherStatus.Complete && (
                                    <ConfirmDialog
                                      title="거래취소"
                                      description="거래를 취소하시려면 공식 텔레그램으로 연락바랍니다."
                                      onConfirm={() => {}}
                                    >
                                      <Button type="button" variant="outline">
                                        거래취소
                                      </Button>
                                    </ConfirmDialog>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </Fragment>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="flex justify-start gap-4 w-full">
            {owner && currentTether?.status === TetherStatus.Open && (
              <>
                <Button type="button" onClick={goEdit}>
                  거래수정
                </Button>
                {currentTether!.tether_proposals.length === 0 && (
                  <ConfirmDialog
                    title="거래삭제"
                    description="거래를 삭제하시려면 확인을 눌러주세요."
                    onConfirm={tryDelete}
                  >
                    <Button type="button" variant="outline">
                      거래삭제
                    </Button>
                  </ConfirmDialog>
                )}
              </>
            )}
            {isProposer && currentTether?.status === TetherStatus.Open && (
              <Form onSubmit={tryTrade}>
                <Button type="submit">거래신청</Button>
              </Form>
            )}
          </div>
        </FormProvider>
      </div>
    </>
  );
};
