"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ReactNode, useState } from "react";

/**
 * Confirmation dialog for deletes that DB-cascade to child rows (e.g. a board ->
 * its categories/threads/comments). It steers the admin toward a non-destructive
 * deactivation (soft-delete via `is_active`), but still allows a permanent delete
 * once the admin types the item's exact name as a deliberate safety gate.
 *
 * - `onDeactivate` (optional): recommended action; hidden when not provided or
 *   when `deactivateDisabled` (e.g. the item is already inactive).
 * - `onDelete`: irreversible hard delete; enabled only after the name matches.
 */
const CascadeDeleteDialog = ({
  children,
  itemName,
  itemLabel = "항목",
  cascadeDescription,
  onDeactivate,
  onDelete,
  deactivateDisabled = false,
}: {
  children: ReactNode;
  itemName: string;
  itemLabel?: string;
  cascadeDescription: ReactNode;
  onDeactivate?: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  deactivateDisabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const canDelete = confirmText.trim() === itemName.trim() && !isBusy;
  const showDeactivate =
    typeof onDeactivate === "function" && !deactivateDisabled;

  const handleOpenChange = (next: boolean) => {
    if (isBusy) return;
    setOpen(next);
    if (!next) setConfirmText("");
  };

  const run = async (action: () => void | Promise<void>) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await action();
      setConfirmText("");
      setOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{itemLabel} 삭제</AlertDialogTitle>
          <AlertDialogDescription className="text-left whitespace-pre-line">
            {cascadeDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showDeactivate && (
          <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm">
            <p className="font-medium">권장: 비활성화</p>
            <p className="mt-1 text-muted-foreground">
              비활성화하면 사용자에게 표시되지 않으며, 데이터는 보존되어 언제든
              다시 활성화할 수 있습니다.
            </p>
            <Button
              type="button"
              className="mt-3 w-full"
              disabled={isBusy}
              onClick={() => onDeactivate && run(onDeactivate)}
            >
              비활성화
            </Button>
          </div>
        )}

        <div className="rounded-md border border-destructive/40 p-3 text-sm">
          <p className="font-medium text-destructive">위험: 영구 삭제</p>
          <p className="mt-1 text-muted-foreground">
            영구 삭제는 되돌릴 수 없습니다. 계속하려면 아래에 항목 이름{" "}
            <span className="font-semibold text-foreground">{itemName}</span>
            을(를) 정확히 입력하세요.
          </p>
          <Input
            className="mt-3"
            value={confirmText}
            disabled={isBusy}
            placeholder={itemName}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <Button
            type="button"
            variant="destructive"
            className="mt-3 w-full"
            disabled={!canDelete}
            onClick={() => run(onDelete)}
          >
            영구 삭제
          </Button>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>취소</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CascadeDeleteDialog;
