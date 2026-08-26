import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UsuarioAuditDialog } from "./UsuarioAuditDialog";
import { api } from "@/lib/api";
import { AdminUser } from "@/types/employee";

vi.mock("@/lib/api", () => ({
  api: {
    getUsuarioAudit: vi.fn(),
  },
}));

const usuario: AdminUser = {
  id: 7,
  username: "mgarcia",
  nombre: "Maria Garcia",
  rol: "operador",
  activo: 1,
  created_at: "2026-08-20T10:00:00.000Z",
};

const auditRow = {
  id: 1,
  actor_id: 3,
  actor_rol: "admin",
  entity: "usuario" as const,
  entity_id: "7",
  action: "estado_change",
  field: "activo",
  old_value: "1",
  new_value: "0",
  reason: "Ausencia prolongada sin aviso",
  created_at: "2026-08-21T09:00:00.000Z",
};

function renderDialog(usuarioProp: AdminUser | null = usuario) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsuarioAuditDialog open onOpenChange={() => {}} usuario={usuarioProp} />
    </QueryClientProvider>
  );
}

describe("UsuarioAuditDialog", () => {
  beforeEach(() => {
    vi.mocked(api.getUsuarioAudit).mockReset();
  });

  it("fetches and renders the usuario's audit rows (spec: Audited Usuario Lifecycle Changes)", async () => {
    vi.mocked(api.getUsuarioAudit).mockResolvedValue({ ok: true, data: [auditRow] });

    renderDialog();

    expect(await screen.findByText(/ausencia prolongada sin aviso/i)).toBeInTheDocument();
    expect(api.getUsuarioAudit).toHaveBeenCalledWith(7);
  });

  it("shows the empty-state message when the usuario has no audit history", async () => {
    vi.mocked(api.getUsuarioAudit).mockResolvedValue({ ok: true, data: [] });

    renderDialog();

    expect(await screen.findByText(/sin historial de auditoría/i)).toBeInTheDocument();
  });
});
