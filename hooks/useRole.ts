import { useEffect, useState } from "react";
import AuthService from "../services/AuthService";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setRole(user?.role ?? null);
    setIsLoading(false);
  }, []);

  const isAdmin = role === "administrador";
  const isUser = role === "usuario";

  return { role, isAdmin, isUser, isLoading };
}
