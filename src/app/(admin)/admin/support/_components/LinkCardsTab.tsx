"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/2_molecules/Table/DataTable";

import { useAdminSupportLinkCardsHook } from "./LinkCardsHook";
import LinkCardsSheet from "./LinkCardsSheet";

export default function LinkCardsTab() {
  const {
    columns,
    methods,
    cardsData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingCard,
    updatePagination,
    handleDelete,
    deleteMutation,
  } = useAdminSupportLinkCardsHook();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>검색 조건</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={methods.handleSubmit(updatePagination)}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <Label htmlFor="search">검색어</Label>
              <Input
                id="search"
                placeholder="제목, 설명, URL"
                {...methods.register("search")}
              />
            </div>

            <div>
              <Label htmlFor="is_active">상태</Label>
              <Select
                value={methods.watch("is_active")}
                onValueChange={(value) => methods.setValue("is_active", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="true">활성</SelectItem>
                  <SelectItem value="false">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order">정렬</Label>
              <Select
                value={methods.watch("order")}
                onValueChange={(value) => methods.setValue("order", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">순서 오름차순</SelectItem>
                  <SelectItem value="desc">순서 내림차순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                검색
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="min-w-0">링크 카드 목록</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => setIsCreateSheetOpen(true)}
                size="sm"
                aria-label="링크 카드 추가"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">링크 카드 추가</span>
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                aria-label="선택 삭제"
                disabled={selectedIds.length === 0 || deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">선택 삭제 </span>
                <span>({selectedIds.length})</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-sm text-muted-foreground">로딩중...</div>
            </div>
          ) : (
            <DataTable columns={columns} data={cardsData?.cards ?? []} />
          )}
        </CardContent>
      </Card>

      <LinkCardsSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      <LinkCardsSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        card={editingCard}
        isEdit
      />
    </>
  );
}
