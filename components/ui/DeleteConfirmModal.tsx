// components/ui/DeleteConfirmModal.tsx
import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ 
  title,
  message,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onCancel}
      ></div>
      
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-10 animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-base font-medium">{title}</h3>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-start p-3 mb-4 bg-danger/10 rounded border border-danger/20 text-danger">
            <AlertTriangle size={18} className="mr-2 shrink-0 mt-0.5" />
            <div className="text-sm">
              {message}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="btn btn-outline"
            >
              Annulla
            </button>
            
            <button
              onClick={onConfirm}
              className="btn bg-danger hover:bg-danger/90 text-white"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}