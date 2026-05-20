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

import { useAdminSupportQnaCategoriesHook } from "./CategoriesHook";
import CategoriesSheet from "./CategoriesSheet";

export default function CategoriesTab() {
  const {
    columns,
    methods,
    categoriesData,
    isLoading,
    selectedIds,
    isCreateSheetOpen,
    setIsCreateSheetOpen,
    isEditSheetOpen,
    setIsEditSheetOpen,
    editingCategory,
    updatePagination,
    handleDelete,
    deleteMutation,
  } = useAdminSupportQnaCategoriesHook();

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
                placeholder="카테고리 이름"
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
            <CardTitle className="min-w-0">QnA 카테고리 목록</CardTitle>
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={() => setIsCreateSheetOpen(true)}
                size="sm"
                aria-label="카테고리 추가"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">카테고리 추가</span>
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
            <DataTable
              columns={columns}
              data={categoriesData?.categories ?? []}
            />
          )}
        </CardContent>
      </Card>

      <CategoriesSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />

      <CategoriesSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        category={editingCategory}
        isEdit
      />
    </>
  );
}
