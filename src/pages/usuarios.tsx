import React, { useEffect, useState } from "react";
import { Trash, Loader2, UserPlus, X  } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import AuthService from "../services/AuthService";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}


export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal de registro states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);

  const fetchUsers = async () => {
    try {
      const result = await invoke<{ data: UserData[] }>("list_users");
      setUsers(result.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ text: "Error al cargar los usuarios", type: "error" });
    }
    setLoading(false);
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    setCurrentUser(AuthService.getCurrentUser());
    fetchUsers();
  }, []);

  // Auto-ocultar mensajes después de 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Cambiar rol de usuario
  const handleChangeRole = async (userId: number, newRole: string) => {
    setActionLoading(userId);
    try {
      await invoke("change_user_role", { user_id: userId, role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setMessage({ text: "Rol actualizado exitosamente", type: "success" });
    } catch (error) {
      console.error("Error changing role:", error);
      setMessage({ text: "Error al cambiar el rol", type: "error" });
    }
    setActionLoading(null);
  };

  // Eliminar usuario
  const handleDelete = async (userId: number) => {
    setActionLoading(userId);
    try {
      await invoke("delete_user", { user_id: userId });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      setMessage({ text: "Usuario eliminado exitosamente", type: "success" });
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ text: "Error al eliminar el usuario", type: "error" });
    }
    setActionLoading(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    
    if (registerForm.password !== registerForm.password_confirmation) {
      setRegisterError("Las contraseñas no coinciden");
      return;
    }
    
    setRegisterLoading(true);
    try {
      await invoke("register", {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });
      
      setMessage({ text: "Usuario registrado exitosamente", type: "success" });
      setIsModalOpen(false);
      setRegisterForm({ name: "", email: "", password: "", password_confirmation: "" });
      fetchUsers();
    } catch (error: any) {
      console.error("Error registering user:", error);
      const msg = error instanceof Error ? error.message : String(error);
      setRegisterError(msg || "Error al registrar el usuario");
    }
    setRegisterLoading(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Content */}
      <main className="flex-1 overflow-auto p-6 relative">
        {/* Mensaje de notificación */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Gestión de usuarios registrados en el sistema.
          </p>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Registrar nuevo usuario
          </button>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-12 text-center flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              <p className="text-gray-500">Cargando usuarios...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-stone-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Fecha de Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors duration-200`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            {user.name}
                            {currentUser?.id === user.id && (
                              <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">
                                Tú
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleChangeRole(user.id, e.target.value)
                            }
                            disabled={
                              actionLoading === user.id ||
                              currentUser?.id === user.id
                            }
                            className={`text-sm border rounded-lg px-2 py-1 outline-none transition-colors ${
                              user.role === "administrador"
                                ? "bg-amber-50 border-amber-300 text-amber-800"
                                : "bg-blue-50 border-blue-300 text-blue-800"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            <option value="administrador">Administrador</option>
                            <option value="usuario">Usuario</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {currentUser?.id === user.id ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : deleteConfirm === user.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id
                                  ? "Eliminando..."
                                  : "Confirmar"}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <p className="text-lg">No hay usuarios registrados</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Registrar Nuevo Usuario</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {registerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {registerError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={registerLoading}
                  placeholder="Juan Pérez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={registerLoading}
                  placeholder="juan@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={registerLoading}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={registerForm.password_confirmation}
                  onChange={(e) => setRegisterForm({...registerForm, password_confirmation: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 text-black py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={registerLoading}
                  placeholder="Confirme la contraseña"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={registerLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registerLoading || registerForm.password !== registerForm.password_confirmation || registerForm.password.length < 8}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {registerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
