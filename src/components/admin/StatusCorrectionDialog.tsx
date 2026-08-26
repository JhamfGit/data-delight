import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { allowedFrom } from "@/lib/statusTransitions";

interface StatusCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  onConfirm: (toStatus: string, reason: string) => void;
  isSubmitting?: boolean;
}

/**
 * Status-correction dialog for `/admin/registros/:id` (spec "Audited Status
 * Correction" — reason is mandatory client-side, matching the backend's
 * `400 reason_required`). When `currentStatus` has no known transitions
 * (design D2 open vocabulary — an unmapped source status), the control is
 * disabled entirely rather than falling back to a hardcoded NO/SI choice.
 */
export function StatusCorrectionDialog({
  open,
  onOpenChange,
  currentStatus,
  onConfirm,
  isSubmitting = false,
}: StatusCorrectionDialogProps) {
  const options = allowedFrom(currentStatus);
  const noTransitionsAvailable = options.length === 0;

  const [toStatus, setToStatus] = useState(options[0] ?? "");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setToStatus(options[0] ?? "");
      setReason("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentStatus]);

  const trimmedReason = reason.trim();
  const canSubmit = !noTransitionsAvailable && trimmedReason !== "" && toStatus !== "" && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm(toStatus, trimmedReason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir estado</DialogTitle>
          <DialogDescription>Estado actual: {currentStatus}</DialogDescription>
        </DialogHeader>

        {noTransitionsAvailable ? (
          <p role="alert">
            No hay transiciones disponibles para el estado &quot;{currentStatus}&quot;.
          </p>
        ) : (
          <Select value={toStatus} onValueChange={setToStatus} disabled={options.length <= 1}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {!noTransitionsAvailable && (
          <Textarea
            placeholder="Motivo de la corrección (obligatorio)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
            Confirmar corrección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
