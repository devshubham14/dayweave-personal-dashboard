import { useState, type FormEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Save",
  onSubmit,
  onDelete,
  busy = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel?: string;
  onSubmit: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirming(false);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[460px] gap-0 rounded-xl p-0">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader className="space-y-1 border-b px-5 py-4 text-left">
            <DialogTitle className="type-h2">{title}</DialogTitle>
            {description ? <DialogDescription className="type-caption">{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="space-y-4 px-5 py-5">{children}</div>
          <div className="flex items-center justify-between gap-2 border-t bg-background/60 px-5 py-3 rounded-b-xl">
            <div>
              {onDelete ? (
                confirming ? (
                  <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                    Confirm delete
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                    <Trash2 /> Delete
                  </Button>
                )
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
