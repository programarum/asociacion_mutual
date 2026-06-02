"use client";

import React from 'react'
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function UsuariosPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    router.push("/");
  };

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-600">Esta página está en construcción.</p>
        </div>
      </main>
    </>
  )
}
