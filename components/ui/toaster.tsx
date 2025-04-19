// components/ui/toaster.tsx
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function Toaster({ position = "bottom-right" }: ToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Listen for toast events
  useEffect(() => {
    const handleToast = (event: CustomEvent<Toast>) => {
      const newToast = {
        ...event.detail,
        id: Date.now().toString(),
      };
      
      setToasts((prev) => [...prev, newToast]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== newToast.id));
      }, 5000);
    };
    
    window.addEventListener("toast" as any, handleToast as any);
    
    return () => {
      window.removeEventListener("toast" as any, handleToast as any);
    };
  }, []);
  
  if (toasts.length === 0) return null;
  
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50 w-80 space-y-2`}>
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden animate-fade-in"
        >
          <div className={`flex items-center p-3 border-l-4 ${
            toast.type === "success" ? "border-l-success" : 
            toast.type === "error" ? "border-l-danger" :
            toast.type === "warning" ? "border-l-warning" : "border-l-info"
          }`}>
            <div className="flex-shrink-0 mr-2">
              {toast.type === "success" && <CheckCircle size={18} className="text-success" />}
              {toast.type === "error" && <XCircle size={18} className="text-danger" />}
              {toast.type === "warning" && <AlertTriangle size={18} className="text-warning" />}
              {toast.type === "info" && <Info size={18} className="text-info" />}
            </div>
            
            <div className="flex-1 mr-2">
              <h4 className="text-sm font-medium">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-zinc-400 mt-0.5">{toast.message}</p>
              )}
            </div>
            
            <button 
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-zinc-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to show toast
export function toast(type: "success" | "error" | "warning" | "info", title: string, message = "") {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("toast", {
      detail: { type, title, message }
    });
    window.dispatchEvent(event);
  }
}