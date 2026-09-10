import { renderHook } from "@testing-library/react";
import { useRole } from "./useRole";

describe("useRole (src)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null role and isLoading=false when no user", () => {
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isUser).toBe(false);
  });

  it("detects administrador role", () => {
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ id: 1, name: "Admin", email: "a@a.com", role: "administrador" })
    );
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("administrador");
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isUser).toBe(false);
  });

  it("detects usuario role", () => {
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ id: 2, name: "User", email: "u@u.com", role: "usuario" })
    );
    const { result } = renderHook(() => useRole());
    expect(result.current.role).toBe("usuario");
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isUser).toBe(true);
  });
});
