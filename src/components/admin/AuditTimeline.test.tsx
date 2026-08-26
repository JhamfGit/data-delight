import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuditTimeline } from "./AuditTimeline";
import { AuditLogRow } from "@/types/admin";

const row: AuditLogRow = {
  id: 1,
  actor_id: 9,
  actor_rol: "admin",
  entity: "registro",
  entity_id: "42",
  action: "status_change",
  field: "status",
  old_value: "NO",
  new_value: "SI",
  reason: "Confirmado por el operador en sitio",
  created_at: "2026-08-20T10:00:00.000Z",
};

describe("AuditTimeline", () => {
  it("renders the mandatory reason and the old/new value transition for an audit row", () => {
    render(<AuditTimeline entries={[row]} />);

    expect(screen.getByText(/confirmado por el operador en sitio/i)).toBeInTheDocument();
    expect(screen.getByText(/NO/)).toBeInTheDocument();
    expect(screen.getByText(/SI/)).toBeInTheDocument();
  });

  it("shows an empty-state message when there is no audit history", () => {
    render(<AuditTimeline entries={[]} />);
    expect(screen.getByText(/sin historial de auditoría/i)).toBeInTheDocument();
  });
});
