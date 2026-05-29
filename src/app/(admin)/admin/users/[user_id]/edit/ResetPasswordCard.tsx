"use client";

import { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { postJson } from "@/helpers/common";
import { ApiRoute } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { validatePassword, validateConfirmPassword } from "@/helpers/validate";

export default function ResetPasswordCard({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Only surface validation messages once the field has content, so the
  // dialog doesn't open shouting "required".
  const passwordError = newPassword ? validatePassword(newPassword) : undefined;
  const confirmError = confirmPassword
    ? validateConfirmPassword(confirmPassword, newPassword)
    : undefined;

  const canSubmit =
    !isWorking &&
    newPassword !== "" &&
    confirmPassword !== "" &&
    !validatePassword(newPassword) &&
    !validateConfirmPassword(confirmPassword, newPassword);

  const reset = () => {
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };

  const runReset = async () => {
    if (!canSubmit) return;
    setIsWorking(true);
    try {
      const { isSuccess } = await postJson(ApiRoute.adminUserPassword, {
        id: userId,
        password: newPassword,
      });
      toast({
        id: ToastData.passwordUpdate,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) {
        reset();
        setOpen(false);
      }
    } catch {
      toast({ id: ToastData.passwordUpdate, type: "error" });
    }
    setIsWorking(false);
  };

  return (
    <Card className="border-amber-300/60 dark:border-amber-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-500" />
          비밀번호 재설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          긴급 계정 복구용 기능입니다. 기존 비밀번호는 확인할 수 없으며, 새
          비밀번호를 입력해 즉시 덮어씁니다. 이 작업은 위 ‘저장’ 버튼과 무관하게
          단독으로 적용됩니다.
        </p>
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 text-sm flex gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-amber-700/90 dark:text-amber-400/90">
            변경 즉시 해당 사용자는 기존 비밀번호로 로그인할 수 없습니다.
            사용자에게 별도 안내가 발송되지 않으니 직접 전달해주세요.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <KeyRound className="w-4 h-4 mr-2" />
          비밀번호 재설정
        </Button>
      </CardContent>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              비밀번호 재설정
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{username}</span>{" "}
              사용자의 새 비밀번호를 입력하세요. 두 입력값이 일치해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              runReset();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="admin-new-password" className="text-sm">
                새 비밀번호
              </Label>
              <Input
                id="admin-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isWorking}
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-fail">{passwordError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-confirm-password" className="text-sm">
                새 비밀번호 확인
              </Label>
              <Input
                id="admin-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isWorking}
              />
              {confirmError && (
                <p className="text-xs text-fail">{confirmError}</p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={isWorking}>
                취소
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={!canSubmit}
                aria-busy={isWorking}
                className="bg-amber-500 hover:bg-amber-500/90 text-primary-foreground"
              >
                변경
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
