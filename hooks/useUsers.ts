import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface UsersPaginatedResponse {
  data: User[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseUsersOptions {
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { page = 1, perPage = 50, enabled = true } = options;

  return useQuery({
    queryKey: ["users", { page, perPage }],
    queryFn: async (): Promise<UsersPaginatedResponse> => {
      const response = await api.get("/users", {
        params: { page, per_page: perPage },
      });
      return response.data;
    },
    enabled,
  });
}
