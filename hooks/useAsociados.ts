import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export interface Asociado {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface PaginatedResponse {
  data: Asociado[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseAsociadosOptions {
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

/**
 * Fetch asociados with pagination support.
 * Automatically cached and deduplicated by React Query.
 */
export function useAsociados(options: UseAsociadosOptions = {}) {
  const { page = 1, perPage = 50, enabled = true } = options;

  return useQuery({
    queryKey: ["asociados", { page, perPage }], // Unique cache key
    queryFn: async (): Promise<PaginatedResponse> => {
      const response = await api.get("/asociados", {
        params: { page, per_page: perPage },
      });
      return response.data;
    },
    enabled, // Allow conditional fetching
  });
}
