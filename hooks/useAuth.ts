import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthService from "../services/AuthService";
import type { User } from "../services/AuthService";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setUser(AuthService.getCurrentUser());
    setIsAuthenticated(AuthService.isAuthenticated());
    if (!AuthService.isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  return {
    user,
    isAuthenticated,
    logout: async () => {
      await AuthService.logout();
      router.push("/");
    },
  };
}
