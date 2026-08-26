import { AuditLogRow } from "@/types/admin";
import { Card, CardContent } from "@/components/ui/card";

interface AuditTimelineProps {
  entries: AuditLogRow[];
}

/**
 * Renders an `admin_audit_log` history (spec "Audited Status Correction" /
 * "Audited Usuario Lifecycle Changes" — every accepted change MUST be
 * viewable inside the panel). Newest-first, since both audit endpoints
 * already `ORDER BY created_at DESC` server-side.
 */
export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sin historial de auditoría.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Card>
            <CardContent className="p-4 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{entry.action}</span>
                <time dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString("es-CO")}
                </time>
              </div>
              {entry.field && (
                <p className="mt-1">
                  <span className="font-medium">{entry.field}</span>: {entry.old_value ?? "—"} →{" "}
                  {entry.new_value ?? "—"}
                </p>
              )}
              <p className="mt-1 italic">&quot;{entry.reason}&quot;</p>
              <p className="mt-1 text-xs text-muted-foreground">
                actor #{entry.actor_id} ({entry.actor_rol})
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
