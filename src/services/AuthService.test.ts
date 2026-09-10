import AuthService from "./AuthService";
import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);

describe("AuthService (src)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("returns null when no user stored", () => {
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    it("returns parsed user from localStorage", () => {
      const user = { id: 1, name: "Test", email: "test@test.com", role: "administrador" };
      localStorage.setItem("auth_user", JSON.stringify(user));
      expect(AuthService.getCurrentUser()).toEqual(user);
    });

    it("returns null on invalid JSON", () => {
      localStorage.setItem("auth_user", "invalid-json");
      expect(AuthService.getCurrentUser()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns false when no user stored", () => {
      expect(AuthService.isAuthenticated()).toBe(false);
    });

    it("returns true when user stored", () => {
      localStorage.setItem("auth_user", JSON.stringify({ id: 1 }));
      expect(AuthService.isAuthenticated()).toBe(true);
    });
  });

  describe("login", () => {
    it("calls invoke and stores user", async () => {
      const user = { id: 1, name: "Test", email: "a@a.com", role: "usuario" };
      mockInvoke.mockResolvedValue({ user });

      const result = await AuthService.login({ email: "a@a.com", password: "123" });

      expect(mockInvoke).toHaveBeenCalledWith("login", {
        email: "a@a.com",
        password: "123",
      });
      expect(localStorage.getItem("auth_user")).toEqual(JSON.stringify(user));
      expect(result.message).toBe("Sesión iniciada exitosamente");
      expect(result.user).toEqual(user);
    });

    it("throws on invoke error", async () => {
      mockInvoke.mockRejectedValue(new Error("Credenciales inválidas"));
      await expect(
        AuthService.login({ email: "bad", password: "bad" })
      ).rejects.toThrow("Credenciales inválidas");
    });
  });

  describe("logout", () => {
    it("removes user from localStorage even on invoke error", async () => {
      localStorage.setItem("auth_user", JSON.stringify({ id: 1 }));
      mockInvoke.mockRejectedValue(new Error("Network error"));

      await expect(AuthService.logout()).rejects.toThrow("Network error");

      expect(localStorage.getItem("auth_user")).toBeNull();
    });

    it("calls invoke logout and cleans up", async () => {
      localStorage.setItem("auth_user", JSON.stringify({ id: 1 }));
      mockInvoke.mockResolvedValue(undefined);

      await AuthService.logout();

      expect(mockInvoke).toHaveBeenCalledWith("logout");
      expect(localStorage.getItem("auth_user")).toBeNull();
    });
  });

  describe("register", () => {
    it("calls invoke and returns response", async () => {
      const user = { id: 2, name: "New", email: "new@test.com", role: "usuario" };
      mockInvoke.mockResolvedValue(user);

      const result = await AuthService.register({
        name: "New",
        email: "new@test.com",
        password: "123456",
        password_confirmation: "123456",
      });

      expect(mockInvoke).toHaveBeenCalledWith("register", {
        name: "New",
        email: "new@test.com",
        password: "123456",
      });
      expect(result.message).toBe("Usuario registrado exitosamente");
      expect(result.user).toEqual(user);
    });
  });
});
