// components/sites/AddSiteModal.tsx
import { useState, useEffect } from "react";
import { X, Globe } from "lucide-react";
import { addSite } from "@/lib/api/sites";
import { Site } from "@/types";

interface AddSiteModalProps {
  onClose: () => void;
  onSave: (site: Site) => void; 
}

export default function AddSiteModal({ onClose, onSave }: AddSiteModalProps) {
  const [url, setUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);
  
  const validateUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate URL format
    if (!validateUrl(url)) {
      setError("Inserisci un URL valido (includi http:// o https://)");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      const newSite = await addSite(url);
      onSave(newSite);
    } catch (error: any) {
      console.error("Error adding site:", error);
      setError(error.message || "Si è verificato un errore durante l'aggiunta del sito");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="absolute inset-0"
        onClick={onClose}
      ></div>
      
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md mx-4 z-10 animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-base font-medium">Aggiungi nuovo sito</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-md text-danger text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium mb-1">
              URL del sito
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe size={16} className="text-zinc-500" />
              </div>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.esempio.com"
                className="input w-full pl-10"
                required
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Inserisci l'URL completo del sito, incluso il protocollo (http:// o https://)
            </p>
          </div>
          
          <div className="bg-info/10 border border-info/20 rounded p-3 text-xs text-info flex items-start mb-4">
            <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>
              Aggiungeremo il tuo sito e recupereremo automaticamente i punteggi da Google PageSpeed Insights.
              Questo processo potrebbe richiedere alcuni minuti.
            </span>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Annulla
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !url}
              className="btn btn-primary inline-flex items-center justify-center""
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> 
                    <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
                  </svg>
                  Aggiunta in corso...
                </span>
              ) : (
                "Aggiungi sito"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}