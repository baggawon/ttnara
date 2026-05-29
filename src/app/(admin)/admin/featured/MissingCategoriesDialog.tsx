"use client";

import type { TopicCategoriesBulkCreateProps } from "@/app/api/admin_di2u3k2j/topics/categories/bulk-create";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { postJson } from "@/helpers/common";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute } from "@/helpers/types";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missing: string[];
  topicId: number;
  topicName: string;
  onCreated?: () => void;
}

export const MissingCategoriesDialog = ({
  open,
  onOpenChange,
  missing,
  topicId,
  topicName,
  onCreated,
}: Props) => {
  const categoriesHref = `${AdminAppRoute.Boards}/${topicId}/categories`;
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const autoCreate = async () => {
    if (missing.length === 0) return;
    setSubmitting(true);
    try {
      const { isSuccess, hasMessage } =
        await postJson<TopicCategoriesBulkCreateProps>(
          ApiRoute.adminTopicCategoriesBulkCreate,
          { topic_id: topicId, names: missing }
        );
      if (isSuccess) {
        toast({
          id: `${missing.length}개 카테고리를 생성했습니다.`,
          type: "success",
        });
        onCreated?.();
        onOpenChange(false);
      } else {
        toast({
          id: hasMessage ?? ToastData.unknown,
          type: "error",
        });
      }
    } catch {
      toast({ id: ToastData.unknown, type: "error" });
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            누락된 카테고리 안내
          </DialogTitle>
          <DialogDescription>
            아래 카테고리는{" "}
            <span className="font-medium text-foreground">{topicName}</span>{" "}
            게시판에 아직 등록되어 있지 않습니다. 한 번에 자동 생성하거나,
            카테고리 관리 페이지에서 직접 만들 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5 my-2">
          {missing.map((name) => (
            <Badge key={name} variant="outline" className="text-sm">
              {name}
            </Badge>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          자동 생성은 이름만 동일하게 추가합니다. 설명·표시 순서 등은 카테고리
          관리 페이지에서 조정해 주세요.
        </p>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            나중에
          </Button>
          <Button asChild variant="outline" disabled={submitting}>
            <Link href={categoriesHref}>카테고리 관리로 이동</Link>
          </Button>
          <Button type="button" onClick={autoCreate} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            자동 생성 ({missing.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
