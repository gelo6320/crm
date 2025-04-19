// components/ui/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Generate an array of pages to display
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first, last, and pages around current
    let pages = [1, totalPages];
    
    if (currentPage > 2) {
      pages.push(currentPage - 1);
    }
    
    if (currentPage > 1 && currentPage < totalPages) {
      pages.push(currentPage);
    }
    
    if (currentPage < totalPages - 1) {
      pages.push(currentPage + 1);
    }
    
    // Sort and remove duplicates
    pages = [...new Set(pages)].sort((a, b) => a - b);
    
    // Add ellipsis
    const result = [];
    for (let i = 0; i < pages.length; i++) {
      if (i > 0 && pages[i] - pages[i - 1] > 1) {
        result.push(-1); // -1 represents ellipsis
      }
      result.push(pages[i]);
    }
    
    return result;
  };

  return (
    <div className="flex items-center justify-center">
      <nav className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        {getPageNumbers().map((page, index) => (
          page === -1 ? (
            <span key={`ellipsis-${index}`} className="px-2 text-zinc-500">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-700"
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}