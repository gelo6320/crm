// components/sites/AddSiteModal.tsx
"use client";

import { useState, useEffect } from "react";
import { Globe, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';
import { toast } from "@/components/ui/toaster";
import { addSite } from "@/lib/api/sites";
import { Site } from "@/types";

interface AddSiteModalProps {
  onClose: () => void;
  onSave: (site: Site) => void;
  triggerRect?: DOMRect | null;
}

export default function AddSiteModal({ onClose, onSave, triggerRect }: AddSiteModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    url: ''
  });
  const [error, setError] = useState("");

  console.log('🔄 AddSiteModal render - triggerRect:', triggerRect);

  // Calcola le coordinate iniziali e finali per l'animazione
  const getAnimationCoordinates = () => {
    if (!triggerRect) {
      // Fallback al centro dello schermo se non abbiamo coordinate
      return {
        initial: {
          x: 0,
          y: 0,
          scale: 0.1,
          opacity: 1,
        },
        animate: {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        }
      };
    }

    // Coordinate del centro del bottone cliccato
    const triggerCenterX = triggerRect.left + (triggerRect.width / 2);
    const triggerCenterY = triggerRect.top + (triggerRect.height / 2);

    // Coordinate finali (centro dello schermo)
    const finalX = window.innerWidth / 2;
    const finalY = window.innerHeight / 2;

    return {
      initial: {
        x: triggerCenterX - finalX, // Offset dal centro
        y: triggerCenterY - finalY, // Offset dal centro
        scale: 0.1,
        opacity: 1,
      },
      animate: {
        x: 0, // Torna al centro
        y: 0, // Torna al centro
        scale: 1,
        opacity: 1,
      }
    };
  };

  const coords = getAnimationCoordinates();

  const handleClose = () => {
    console.log('❌ Close triggered - calling onClose immediately');
    setIsClosing(true);
    onClose();
  };

  // Configurazione spring per animazione naturale stile iOS
  const springConfig = {
    type: "spring" as const,
    damping: isClosing ? 35 : 25,        // Chiusura più veloce
    stiffness: isClosing ? 400 : 300,    // Chiusura più snappy
    mass: 0.8,
  };

  // Chiudi la modale quando si preme ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const validateUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  // Gestisce il submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.url.trim()) {
      toast("error", "Errore", "L'URL è obbligatorio");
      return;
    }

    // Validate URL format
    if (!validateUrl(formData.url)) {
      toast("error", "Errore", "Inserisci un URL valido (includi http:// o https://)");
      return;
    }

    setIsLoading(true);

    try {
      const newSite = await addSite(formData.url);
      onSave(newSite);
    } catch (error: any) {
      console.error("Error adding site:", error);
      toast("error", "Errore", error.message || "Impossibile aggiungere il sito");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      onClick={handleClose}
      style={{ zIndex: 10000 }} // Z-index esplicito massimo
    >
      {/* Background overlay FISSO senza animazioni per evitare conflitti blur */}
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfig}
        style={{ zIndex: 1 }}
      />
      
      {/* Modal container con animazione iOS */}
      <motion.div 
        className="relative w-full max-w-lg mx-4 sm:mx-6"
        onClick={(e) => e.stopPropagation()}
        initial={coords.initial}
        animate={coords.animate}
        exit={{
          ...coords.initial,
          scale: 0.1,
          opacity: 0,
        }}
        transition={springConfig}
        style={{
          transformOrigin: "center center",
          zIndex: 10
        }}
      >
        <SmoothCorners 
          corners="2.5"
          borderRadius="24"
        />
        
        <div className="relative bg-zinc-200/85 dark:bg-zinc-700/80 backdrop-blur-xs rounded-[24px] shadow-lg overflow-hidden backdrop-saturate-150">
          {/* Header con icona e bottone chiudi */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Aggiungi nuovo sito
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-white/20 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50 relative z-10"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Form content */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-6 space-y-4 relative z-10">
            {/* Messaggio di errore */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Campo URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                URL del sito *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Globe className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ url: e.target.value })}
                  placeholder="https://www.esempio.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-black/40 border border-white/30 dark:border-white/20 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all disabled:opacity-50 relative z-0"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Inserisci l'URL completo del sito, incluso il protocollo (http:// o https://)
              </p>
            </div>

            {/* Info box */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400 text-xs flex items-start">
              <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>
                Aggiungeremo il tuo sito e recupereremo automaticamente i punteggi da Google PageSpeed Insights.
                Questo processo potrebbe richiedere alcuni minuti.
              </span>
            </div>

            {/* Pulsanti azione */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-white/20 hover:bg-white/70 dark:hover:bg-white/30 font-medium py-3 px-4 rounded-2xl transition-all duration-200 disabled:opacity-50 relative z-10"
              >
                Annulla
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !formData.url.trim()}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Aggiungendo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Aggiungi sito
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}