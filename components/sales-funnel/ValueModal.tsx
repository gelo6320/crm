// components/sales-funnel/ValueModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmoothCorners } from 'react-smooth-corners';
import { FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import { toast } from "@/components/ui/toaster";

interface EditValueModalProps {
  lead: FunnelItem;
  onClose: () => void;
  onSave: (value: number, service: string, notes?: string) => void;
  triggerRect?: DOMRect | null; // Coordinate del elemento cliccato
}

export default function EditValueModal({ lead, onClose, onSave, triggerRect }: EditValueModalProps) {
  const [value, setValue] = useState<string>(lead.value?.toString() || "");
  const [service, setService] = useState<string>(lead.service || "");
  const [notes, setNotes] = useState<string>(lead.extendedData?.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  console.log('🔄 ValueModal render - triggerRect:', triggerRect);

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

    // Coordinate del centro dell'elemento cliccato
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
    // Chiama onClose immediatamente per liberare l'interfaccia
    onClose();
  };

  // Configurazione spring per animazione naturale stile iOS
  const springConfig = {
    type: "spring" as const,
    damping: isClosing ? 35 : 25,        // Chiusura più veloce
    stiffness: isClosing ? 400 : 300,    // Chiusura più snappy
    mass: 0.8,
  };
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(Number(value) || 0, service, notes);
      toast("success", "Lead aggiornato", "Dati aggiornati con successo");
      handleClose();
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiornamento");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      {/* Background overlay FISSO senza animazioni per evitare conflitti blur */}
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs backdrop-saturate-150"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={springConfig}
      />
      
      {/* Modal container con animazione iOS */}
      <motion.div 
        className="relative z-10 w-full max-w-lg mx-4 sm:mx-6"
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
          transformOrigin: "center center"
        }}
      >
        <SmoothCorners 
          corners="2.5"
          borderRadius="24"
        />
        
        <div className="relative bg-zinc-200/85 dark:bg-zinc-700/80 backdrop-blur-xs rounded-[24px] shadow-lg overflow-hidden backdrop-saturate-150">
          {/* Header */}
          <div className="flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/30 dark:hover:bg-white/20 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-6 space-y-6">
            {/* Info lead */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {/* Removed DollarSign icon */}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                  {lead.name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">{lead.email}</p>
              </div>
            </div>
            
            {/* Form fields */}
            <div className="space-y-5">
              {/* Valore */}
              <div className="space-y-2">
                <label htmlFor="value" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Valore stimato (€)
                </label>
                <input
                  type="number"
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="0"
                  step="100"
                  placeholder="0"
                  className="w-full bg-white/50 dark:bg-black/40 border border-gray-300 dark:border-gray-600 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              {/* Servizio */}
              <div className="space-y-2">
                <label htmlFor="service" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tipo di servizio
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <CreditCard size={16} />
                  </span>
                  <input
                    type="text"
                    id="service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="Inserisci il tipo di servizio"
                    className="w-full bg-white/50 dark:bg-black/40 border border-gray-300 dark:border-gray-600 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Note aggiuntive
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-gray-400">
                    <FileText size={16} />
                  </span>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Aggiungi note o commenti sul lead..."
                    rows={4}
                    className="w-full bg-white/50 dark:bg-black/40 border border-gray-300 dark:border-gray-600 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Pulsanti azione */}
            <div className="flex gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-white/20 hover:bg-white/70 dark:hover:bg-white/30 font-medium py-3 px-4 rounded-2xl transition-all duration-200 text-sm sm:text-base"
              >
                Annulla
              </button>
              
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-2xl transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </span>
                ) : (
                  "Salva modifiche"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}