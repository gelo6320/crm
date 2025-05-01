// components/sales-funnel/ModernValueModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { FunnelItem } from "@/types";

interface ModernValueModalProps {
  lead: FunnelItem;
  onClose: () => void;
  onSave: (value: number, service: string) => void;
}

export default function ModernValueModal({ lead, onClose, onSave }: ModernValueModalProps) {
  const [value, setValue] = useState<string>(lead.value?.toString() || "");
  const [service, setService] = useState<string>(lead.service || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const services = [
    "Ristrutturazione completa",
    "Ristrutturazione bagno",
    "Ristrutturazione cucina",
    "Rifacimento tetto",
    "Impianto elettrico",
    "Impianto idraulico",
    "Cappotto termico",
    "Infissi e serramenti",
    "Rifacimento pavimenti",
    "Ampliamento casa",
  ];
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(Number(value) || 0, service);
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div
          className="modal-content-modern"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="modal-header-modern">
            <h3 className="text-base font-medium">Modifica dati lead</h3>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
              transition={{ duration: 0.2 }}
            >
              <X size={18} />
            </motion.button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-4">
              <div className="font-medium text-white">{lead.name}</div>
              <div className="text-sm text-zinc-400">{lead.email}</div>
            </div>
            
            <div className="space-y-5">
              <div className="form-group">
                <label htmlFor="value" className="form-label-modern">
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
                  className="input-modern"
                />
                <p className="input-help-modern">
                  Valore stimato del progetto
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="service" className="form-label-modern">
                  Tipo di servizio
                </label>
                <select
                  id="service"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="input-modern"
                >
                  <option value="">Seleziona un servizio</option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="input-help-modern">
                  Categoria di lavoro richiesto
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline-modern"
                onClick={onClose}
              >
                Annulla
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary-modern"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvataggio...
                  </span>
                ) : (
                  "Salva"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}