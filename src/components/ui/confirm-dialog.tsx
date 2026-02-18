"use client";

import { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "confirm";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  variant = "confirm",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="mx-4 max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {(description || children) && (
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {description && <p>{description}</p>}
                {children}
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
