import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface UsersPaginatedResponse {
  data: User[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface UseUsersOptions {
  enabled?: boolean;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<UsersPaginatedResponse> => {
      return await invoke("list_users");
    },
    enabled,
  });
}
