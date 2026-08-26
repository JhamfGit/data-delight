import { useSearchParams } from "react-router-dom";
import { RegistroFilters, EMPTY_REGISTRO_FILTERS } from "@/types/admin";

/**
 * Syncs the `/admin/registros` filter bar state with URL search params
 * (design "Frontend" section: "Filters live in URL search params and feed
 * the query key, so a filtered view is shareable and back/forward works").
 * Any filter change other than an explicit `page` patch resets pagination
 * to page 1, matching standard list/filter UX.
 */
export function useRegistrosFilters(): [
  RegistroFilters,
  (patch: Partial<RegistroFilters>) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: RegistroFilters = {
    q: searchParams.get("q") ?? EMPTY_REGISTRO_FILTERS.q,
    status: searchParams.get("status") ?? EMPTY_REGISTRO_FILTERS.status,
    proyecto: searchParams.get("proyecto") ?? EMPTY_REGISTRO_FILTERS.proyecto,
    centro_operacion:
      searchParams.get("centro_operacion") ?? EMPTY_REGISTRO_FILTERS.centro_operacion,
    page: Number(searchParams.get("page")) || EMPTY_REGISTRO_FILTERS.page,
    pageSize: Number(searchParams.get("pageSize")) || EMPTY_REGISTRO_FILTERS.pageSize,
  };

  const setFilters = (patch: Partial<RegistroFilters>) => {
    const next: RegistroFilters = { ...filters, ...patch };
    if (!("page" in patch)) {
      next.page = 1;
    }

    const params: Record<string, string> = {};
    (Object.entries(next) as [keyof RegistroFilters, string | number][]).forEach(([key, value]) => {
      if (value === "" || value === undefined || value === null) return;
      if ((key === "page" && value === EMPTY_REGISTRO_FILTERS.page) ||
          (key === "pageSize" && value === EMPTY_REGISTRO_FILTERS.pageSize)) {
        return;
      }
      params[key] = String(value);
    });

    setSearchParams(params);
  };

  return [filters, setFilters];
}
