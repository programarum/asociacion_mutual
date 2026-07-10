import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import AuthService from "../services/AuthService";
import type { User } from "../services/AuthService";

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = AuthService.getCurrentUser();
    if (!storedUser) {
      navigate("/");
      return;
    }

    invoke<User | null>("get_current_user").then((sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser);
        setIsAuthenticated(true);
        localStorage.setItem("auth_user", JSON.stringify(sessionUser));
      } else {
        localStorage.removeItem("auth_user");
        setIsAuthenticated(false);
        navigate("/");
      }
    });
  }, [navigate]);

  return {
    user,
    isAuthenticated,
    logout: async () => {
      await AuthService.logout();
      // El command logout en Rust cierra la app con app.exit(0)
    },
  };
}
