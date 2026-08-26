import { Badge } from "@/components/ui/badge";
import { isKnownStatus } from "@/lib/statusTransitions";

interface StatusBadgeProps {
  status: string;
}

/**
 * Renders a `registros.status` value. Design D2 / spec "Constrained Status
 * Transition Table" — an unknown status MUST display using the actual raw
 * value, never a hardcoded NO/SI fallback. Known values (`NO`/`SI`) get
 * their normal semantic color; anything outside that vocabulary renders as
 * a neutral `outline` badge with the raw string, tagged `data-known="false"`
 * so callers (e.g. the status-correction dialog) can disable the transition
 * control without re-deriving the same logic.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const known = isKnownStatus(status);
  const variant = !known ? "outline" : status === "SI" ? "default" : "secondary";

  return (
    <Badge variant={variant} data-known={known}>
      {status}
    </Badge>
  );
}
