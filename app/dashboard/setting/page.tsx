"use client";

import React, { useEffect, useState } from "react";
import { LogOut, Trash, Loader2, UserPlus, X } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/api";
import AuthService from "../../../services/AuthService";



export default function SettingPage() {
  const { logout } = useAuth();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);



  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </nav>

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




      </main>


    </>
  );
}
