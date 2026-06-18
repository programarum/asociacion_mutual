"use client";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-stone-200 disabled:opacity-50 hover:bg-stone-300"
      >
        Anterior
      </button>
      
      <span className="text-sm text-gray-600">
        Página {currentPage} de {lastPage}
      </span>
      
      <button
        onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
        disabled={currentPage === lastPage}
        className="px-3 py-1 rounded bg-stone-200 disabled:opacity-50 hover:bg-stone-300"
      >
        Siguiente
      </button>
    </div>
  );
}
