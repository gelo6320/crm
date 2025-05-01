// components/sales-funnel/ModernFacebookEventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Facebook, Info } from "lucide-react";
import { FunnelItem } from "@/types";

interface ModernFacebookEventModalProps {
  lead: FunnelItem;
  previousStatus: string;
  onClose: () => void;
  onSave: () => void;
  onUndo: () => void;
}

export default function ModernFacebookEventModal({ 
  lead, 
  previousStatus, 
  onClose, 
  onSave,
  onUndo 
}: ModernFacebookEventModalProps) {
  const [eventName, setEventName] = useState<string>("");
  const [sendToFacebook, setSendToFacebook] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map status to appropriate Facebook event
  useEffect(() => {
    // For purchase events, always use "Purchase"
    if (lead.status === "customer") {
      setEventName("Purchase");
    } else {
      setEventName("LeadStatusChange");
    }
  }, [lead.status]);
  
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
      await onSave();
    } catch (error) {
      console.error("Error during lead move:", error);
      onUndo();
    } finally {
      setIsSubmitting(false);
      onClose();
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
            <h3 className="text-base font-medium">Invio evento a Facebook</h3>
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
            <motion.div 
              className="info-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Info size={18} className="shrink-0 mt-0.5 text-blue-400" />
              <div className="text-sm text-blue-300">
                Il lead <strong className="text-white">{lead.name}</strong> è stato spostato da <strong className="text-white">{previousStatus}</strong> a <strong className="text-white">{lead.status}</strong>. 
                {lead.status === "customer" ? (
                  <>
                    <br /><br />
                    <strong className="text-green-400">Cliente acquisito!</strong> 
                    <span className="text-blue-200"> Vuoi inviare l'evento di acquisto alla Conversion API di Facebook?</span>
                  </>
                ) : (
                  <>
                    <br /><br />
                    <span className="text-blue-200">Vuoi inviare questo cambiamento alla Conversion API di Facebook?</span>
                  </>
                )}
              </div>
            </motion.div>
            
            <div className="space-y-5 mt-5">
              <div className="form-group">
                <label htmlFor="eventName" className="form-label-modern">
                  Nome evento Facebook
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="input-modern"
                  required
                  readOnly={lead.status === "customer"}
                />
                {lead.status === "customer" && (
                  <p className="input-help-modern">
                    L'evento di acquisto è preimpostato su "Purchase"
                  </p>
                )}
              </div>
              
              <div className="checkbox-wrapper">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={sendToFacebook}
                    onChange={(e) => setSendToFacebook(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom">
                    <svg viewBox="0 0 24 24" className="checkbox-icon">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="text-sm ml-2">Invia evento a Facebook</span>
                </label>
              </div>
              
              {lead.value && (
                <motion.div 
                  className="data-card"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-sm text-zinc-400">Valore:</span>
                  <span className="text-sm font-medium text-white">€{lead.value.toLocaleString('it-IT')}</span>
                </motion.div>
              )}
              
              {lead.service && (
                <motion.div 
                  className="data-card"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-sm text-zinc-400">Servizio:</span>
                  <span className="text-sm font-medium text-white">{lead.service}</span>
                </motion.div>
              )}
            </div>
            
            <div className="flex justify-between space-x-3 mt-6">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-outline-modern"
                onClick={onUndo}
              >
                Annulla operazione
              </motion.button>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary-modern flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Elaborazione...
                  </span>
                ) : (
                  <>
                    {sendToFacebook && <Facebook size={16} className="mr-2" />}
                    Conferma
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}