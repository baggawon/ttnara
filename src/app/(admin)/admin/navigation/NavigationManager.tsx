"use client";

import { useState } from "react";
import type { nav_menu_item } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/components/lib/utils";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminNavListGet } from "@/helpers/get";
import { postJson } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import {
  NavIconPicker,
  renderNavIcon,
} from "@/components/2_molecules/Input/NavIconPicker";

import type { NavMenuListResponse } from "@/app/api/admin_di2u3k2j/nav/list";
import type {
  NavMenuCreateProps,
  NavSurface,
} from "@/app/api/admin_di2u3k2j/nav/create";
import type { NavMenuUpdateProps } from "@/app/api/admin_di2u3k2j/nav/update";
import type { NavMenuDeleteProps } from "@/app/api/admin_di2u3k2j/nav/delete";
import type { NavMenuReorderProps } from "@/app/api/admin_di2u3k2j/nav/reorder";

type Surface = NavSurface;

type ItemKind = "link" | "home" | "chat_toggle";

interface FormState {
  id: number | null;
  surface: Surface;
  kind: ItemKind;
  parent_id: number | null;
  label: string;
  url: string;
  is_external: boolean;
  icon: string | null;
  is_active: boolean;
}

const emptyForm = (
  surface: Surface,
  parent_id: number | null = null
): FormState => ({
  id: null,
  surface,
  kind: "link",
  parent_id,
  label: "",
  url: "",
  is_external: false,
  icon: null,
  is_active: true,
});

export const NavigationManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);

  const { data } = useGetQuery<NavMenuListResponse, undefined>(
    {
      queryKey: [QueryKey.adminNavMenu],
    },
    adminNavListGet,
    undefined,
    { silent: true }
  );

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKey.adminNavMenu] });
  };

  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm("top"));

  const startCreate = (surface: Surface, parent_id: number | null = null) => {
    setForm(emptyForm(surface, parent_id));
    setOpenForm(true);
  };

  const startEdit = (item: nav_menu_item) => {
    setForm({
      id: item.id,
      surface: item.surface as Surface,
      kind: (item.kind as ItemKind) ?? "link",
      parent_id: item.parent_id,
      label: item.label,
      url: item.url,
      is_external: item.is_external,
      icon: item.icon,
      is_active: item.is_active,
    });
    setOpenForm(true);
  };

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      toast({ id: ToastData.unknown, type: "error" });
      return;
    }
    if (isWorking) return;
    setIsWorking(true);
    try {
      if (form.id == null) {
        const siblings = (
          form.surface === "top" ? data?.top : data?.mobile_bottom
        )?.filter((i) => (i.parent_id ?? null) === (form.parent_id ?? null));
        const nextOrder = (siblings?.length ?? 0) + 1;
        const body: NavMenuCreateProps = {
          surface: form.surface,
          parent_id: form.parent_id,
          label: form.label.trim(),
          url: form.url.trim(),
          is_external: form.is_external,
          icon: form.icon,
          display_order: nextOrder,
          is_active: form.is_active,
        };
        const { isSuccess, hasMessage } = await postJson(
          ApiRoute.adminNavCreate,
          body
        );
        if (hasMessage) {
          toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
        }
        if (isSuccess) {
          setOpenForm(false);
          refetch();
        }
      } else {
        const body: NavMenuUpdateProps = {
          id: form.id,
          parent_id: form.parent_id,
          label: form.label.trim(),
          url: form.url.trim(),
          is_external: form.is_external,
          icon: form.icon,
          is_active: form.is_active,
        };
        const { isSuccess, hasMessage } = await postJson(
          ApiRoute.adminNavUpdate,
          body
        );
        if (hasMessage) {
          toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
        }
        if (isSuccess) {
          setOpenForm(false);
          refetch();
        }
      }
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const handleDelete = async (id: number) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      const body: NavMenuDeleteProps = { id };
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminNavDelete,
        body
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) refetch();
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const handleReorder = async (
    surface: Surface,
    parent_id: number | null,
    siblings: nav_menu_item[],
    fromIndex: number,
    direction: -1 | 1
  ) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= siblings.length) return;
    const ordered = [...siblings];
    const [moved] = ordered.splice(fromIndex, 1);
    ordered.splice(toIndex, 0, moved);
    if (isWorking) return;
    setIsWorking(true);
    try {
      const body: NavMenuReorderProps = {
        surface,
        parent_id,
        orderedIds: ordered.map((s) => s.id),
      };
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminNavReorder,
        body
      );
      if (hasMessage && !isSuccess) {
        toast({ id: hasMessage, type: "error" });
      }
      if (isSuccess) refetch();
    } catch (error) {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setIsWorking(false);
  };

  const renderTopParent = (parent: nav_menu_item, indexInRow: number) => {
    const topRows = data?.top ?? [];
    const topParents = topRows.filter((i) => i.parent_id === null);
    const children = topRows
      .filter((i) => i.parent_id === parent.id)
      .sort((a, b) => a.display_order - b.display_order);
    return (
      <Card key={parent.id} className={cn(!parent.is_active && "opacity-60")}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  handleReorder("top", null, topParents, indexInRow, -1)
                }
                disabled={indexInRow === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  handleReorder("top", null, topParents, indexInRow, 1)
                }
                disabled={indexInRow === topParents.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-medium truncate">{parent.label}</span>
              <span className="text-xs text-muted-foreground truncate">
                {parent.url || "(부모 메뉴)"}
                {parent.is_external && " · 외부"}
                {!parent.is_active && " · 비활성"}
              </span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startCreate("top", parent.id)}
            >
              <Plus className="h-4 w-4" />
              하위 추가
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => startEdit(parent)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <DeleteButton onConfirm={() => handleDelete(parent.id)} />
          </div>
        </CardHeader>
        {children.length > 0 && (
          <CardContent className="pt-0">
            <ul className="flex flex-col gap-1 border-t pt-3">
              {children.map((child, idx) => (
                <li
                  key={child.id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/40",
                    !child.is_active && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          handleReorder("top", parent.id, children, idx, -1)
                        }
                        disabled={idx === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() =>
                          handleReorder("top", parent.id, children, idx, 1)
                        }
                        disabled={idx === children.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm truncate">{child.label}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {child.url}
                        {child.is_external && " · 외부"}
                        {!child.is_active && " · 비활성"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(child)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteButton onConfirm={() => handleDelete(child.id)} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    );
  };

  const topParents = (data?.top ?? []).filter((i) => i.parent_id === null);
  const mobileItems = (data?.mobile_bottom ?? [])
    .filter((i) => i.parent_id === null)
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <>
      <Tabs defaultValue="top" className="w-full">
        <TabsList>
          <TabsTrigger value="top">상단 메뉴</TabsTrigger>
          <TabsTrigger value="mobile_bottom">모바일 하단 메뉴</TabsTrigger>
        </TabsList>

        <TabsContent value="top" className="flex flex-col gap-3 mt-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => startCreate("top", null)}>
              <Plus className="h-4 w-4" />
              상위 메뉴 추가
            </Button>
          </div>
          {topParents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              메뉴가 없습니다. 상위 메뉴를 추가해주세요.
            </p>
          ) : (
            topParents.map((p, i) => renderTopParent(p, i))
          )}
        </TabsContent>

        <TabsContent value="mobile_bottom" className="flex flex-col gap-3 mt-4">
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => startCreate("mobile_bottom", null)}
            >
              <Plus className="h-4 w-4" />
              메뉴 추가
            </Button>
          </div>
          {mobileItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              모바일 하단 메뉴가 없습니다.
            </p>
          ) : (
            <Card>
              <CardContent className="pt-3">
                <ul className="flex flex-col gap-1">
                  {mobileItems.map((item, idx) => {
                    const isSystem = item.kind !== "link";
                    const systemBadge =
                      item.kind === "home"
                        ? "홈"
                        : item.kind === "chat_toggle"
                          ? "채팅 토글"
                          : null;
                    return (
                      <li
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/40",
                          !item.is_active && "opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleReorder(
                                  "mobile_bottom",
                                  null,
                                  mobileItems,
                                  idx,
                                  -1
                                )
                              }
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleReorder(
                                  "mobile_bottom",
                                  null,
                                  mobileItems,
                                  idx,
                                  1
                                )
                              }
                              disabled={idx === mobileItems.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-muted-foreground">
                            {renderNavIcon(item.icon, "h-4 w-4") ?? (
                              <span className="inline-block h-4 w-4 rounded border border-dashed" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm truncate flex items-center gap-2">
                              {item.label}
                              {systemBadge && (
                                <span className="text-[10px] uppercase rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                                  {systemBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {isSystem ? "시스템 메뉴 (삭제 불가)" : item.url}
                              {!isSystem && item.is_external && " · 외부"}
                              {!item.is_active && " · 비활성"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!isSystem && (
                            <DeleteButton
                              onConfirm={() => handleDelete(item.id)}
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "메뉴 수정" : "메뉴 추가"} —{" "}
              {form.surface === "top" ? "상단" : "모바일 하단"}
              {form.parent_id != null && " · 하위"}
              {form.kind !== "link" && " · 시스템"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm">이름</label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((s) => ({ ...s, label: e.target.value }))
                }
                placeholder="공지사항"
                maxLength={64}
              />
            </div>
            {form.kind === "link" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm">
                    URL{" "}
                    <span className="text-muted-foreground text-xs">
                      ({form.is_external ? "https://..." : "/board/..."})
                      {form.surface === "top" &&
                        form.parent_id === null &&
                        " · 부모 메뉴는 비워둘 수 있습니다."}
                    </span>
                  </label>
                  <Input
                    value={form.url}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, url: e.target.value }))
                    }
                    placeholder={form.is_external ? "https://" : "/"}
                    maxLength={500}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm">외부 링크</label>
                  <Switch
                    checked={form.is_external}
                    onCheckedChange={(v) =>
                      setForm((s) => ({ ...s, is_external: !!v }))
                    }
                  />
                </div>
                {form.surface === "mobile_bottom" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm">아이콘</label>
                    <NavIconPicker
                      value={form.icon}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, icon: next }))
                      }
                    />
                  </div>
                )}
              </>
            )}
            {form.kind !== "link" && (
              <p className="text-xs text-muted-foreground">
                시스템 메뉴는 삭제할 수 없으며 URL/아이콘은 시스템에서
                관리합니다. 이름과 활성 여부만 변경할 수 있습니다.
              </p>
            )}
            <div className="flex items-center justify-between">
              <label className="text-sm">활성</label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, is_active: !!v }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isWorking}>
                취소
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isWorking}
              aria-busy={isWorking}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const DeleteButton = ({ onConfirm }: { onConfirm: () => void }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button type="button" variant="ghost" size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>이 메뉴를 삭제할까요?</AlertDialogTitle>
        <AlertDialogDescription>
          하위 메뉴가 있는 경우 함께 삭제됩니다.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>취소</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>삭제</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default NavigationManager;
