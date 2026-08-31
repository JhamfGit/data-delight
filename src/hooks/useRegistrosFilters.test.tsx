import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useRegistrosFilters } from "./useRegistrosFilters";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/admin/registros"]}>{children}</MemoryRouter>
);

describe("useRegistrosFilters", () => {
  it("defaults to empty filters and page 1 when no URL search params are present", () => {
    const { result } = renderHook(() => useRegistrosFilters(), { wrapper });
    const [filters] = result.current;
    expect(filters).toEqual({
      q: "",
      status: "",
      proyecto: "",
      centro_operacion: "",
      user_id: "",
      page: 1,
      pageSize: 10,
    });
  });

  it("writes a status filter change into the URL search params and resets page to 1", () => {
    const { result } = renderHook(() => useRegistrosFilters(), { wrapper });

    act(() => {
      const [, setFilters] = result.current;
      setFilters({ status: "SI" });
    });

    const [filters] = result.current;
    expect(filters.status).toBe("SI");
    expect(filters.page).toBe(1);
  });

  it("reads a pre-existing search filter back out of the URL", () => {
    const initialWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={["/admin/registros?q=maria&proyecto=obra1"]}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(() => useRegistrosFilters(), { wrapper: initialWrapper });
    const [filters] = result.current;
    expect(filters.q).toBe("maria");
    expect(filters.proyecto).toBe("obra1");
  });

  it("writes a user_id filter change into the URL search params and reads it back out", () => {
    const { result } = renderHook(() => useRegistrosFilters(), { wrapper });

    act(() => {
      const [, setFilters] = result.current;
      setFilters({ user_id: "11" });
    });

    const [filters] = result.current;
    expect(filters.user_id).toBe("11");
    expect(filters.page).toBe(1);
  });

  it("changing the page number preserves the existing status filter", () => {
    const { result } = renderHook(() => useRegistrosFilters(), { wrapper });

    act(() => {
      const [, setFilters] = result.current;
      setFilters({ status: "NO" });
    });
    act(() => {
      const [, setFilters] = result.current;
      setFilters({ page: 2 });
    });

    const [filters] = result.current;
    expect(filters.status).toBe("NO");
    expect(filters.page).toBe(2);
  });
});
