// components/sales-funnel/ValueModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import { toast } from "@/components/ui/toaster";

interface ValueModalProps {
  lead: FunnelItem;
  onClose: () => void;
  onSave: (value: number, service: string) => void;
}

export default function ValueModal({ lead, onClose, onSave }: ValueModalProps) {
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
      // Process the update with the onSave callback
      await onSave(Number(value) || 0, service);
      
      // Update the lead metadata directly via API as a backup/failsafe
      try {
        await updateLeadMetadata(
          lead._id,
          lead.type || 'form',
          Number(value) || 0,
          service
        );
      } catch (updateError) {
        console.error("Backup update failed, relying on callback:", updateError);
        // Continue execution - the primary update is through the callback
      }
      
      toast("success", "Lead aggiornato", "Valore e servizio aggiornati con successo");
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error);
      toast("error", "Errore", "Si è verificato un errore durante l'aggiornamento");
    } finally {
      setIsSubmitting(false);
      onClose();
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
          <h3 className="text-base font-medium">Modifica dati lead</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <div className="font-medium">{lead.name}</div>
            <div className="text-sm text-zinc-400">{lead.email}</div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-1">
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
                className="input w-full"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Valore stimato del progetto
              </p>
            </div>
            
            <div>
              <label htmlFor="service" className="block text-sm font-medium mb-1">
                Tipo di servizio
              </label>
              <select
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="input w-full"
              >
                <option value="">Seleziona un servizio</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400">
                Categoria di lavoro richiesto
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center justify-center"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}