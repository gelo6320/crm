// components/sales-funnel/FacebookEventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Facebook, Info } from "lucide-react";
import { FunnelItem } from "@/types";
import { updateLeadStage } from "@/lib/api/funnel";
import { toast } from "@/components/ui/toaster";

interface FacebookEventModalProps {
  lead: FunnelItem;
  previousStatus: string;
  onClose: () => void;
  onSave: () => void;
  onUndo: () => void;
}

export default function FacebookEventModal({ 
  lead, 
  previousStatus, 
  onClose, 
  onSave,
  onUndo 
}: FacebookEventModalProps) {
  const [eventName, setEventName] = useState<string>("");
  const [sendToFacebook, setSendToFacebook] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map the status to an appropriate Facebook event
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
      // API call to confirm the move and send the event to Facebook
      await updateLeadStage(
        lead._id,
        lead.type || 'form', // Default to 'form' if type is not specified
        previousStatus,
        lead.status,
        sendToFacebook ? {
          eventName: eventName,
          eventMetadata: {
            value: lead.value,
            service: lead.service
          }
        } : undefined
      );
      
      toast("success", "Lead spostato con successo", 
        sendToFacebook 
          ? `Evento "${eventName}" inviato a Facebook` 
          : "Nessun evento inviato a Facebook"
      );
      
      onSave();
    } catch (error) {
      console.error("Error during lead move:", error);
      toast("error", "Errore durante lo spostamento", "Si è verificato un errore, l'operazione verrà annullata");
      onUndo();
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
          <h3 className="text-base font-medium">Invio evento a Facebook</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex items-start p-3 mb-4 bg-info/10 rounded border border-info/20 text-info">
            <Info size={18} className="mr-2 shrink-0 mt-0.5" />
            <div className="text-sm">
              Il lead <strong>{lead.name}</strong> è stato spostato da <strong>{previousStatus}</strong> a <strong>{lead.status}</strong>. 
              {lead.status === "customer" ? (
                <>
                  <br /><br />
                  <strong>Cliente acquisito!</strong> 
                  Vuoi inviare l'evento di acquisto alla Conversion API di Facebook?
                </>
              ) : (
                <>
                  <br /><br />
                  Vuoi inviare questo cambiamento alla Conversion API di Facebook?
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium mb-1">
                Nome evento Facebook
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="input w-full"
                required
                readOnly={lead.status === "customer"}
              />
              {lead.status === "customer" && (
                <p className="mt-1 text-xs text-zinc-400">
                  L'evento di acquisto è preimpostato su "Purchase"
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="sendToFacebook"
                checked={sendToFacebook}
                onChange={(e) => setSendToFacebook(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
              />
              <label htmlFor="sendToFacebook" className="text-sm">
                Invia evento a Facebook
              </label>
            </div>
            
            {lead.value ? (
              <div className="flex items-center justify-between py-2 px-3 bg-zinc-900 rounded">
                <span className="text-sm text-zinc-400">Valore:</span>
                <span className="text-sm font-medium">€{lead.value.toLocaleString('it-IT')}</span>
              </div>
            ) : null}
            
            {lead.service ? (
              <div className="flex items-center justify-between py-2 px-3 bg-zinc-900 rounded">
                <span className="text-sm text-zinc-400">Servizio:</span>
                <span className="text-sm font-medium">{lead.service}</span>
              </div>
            ) : null}
          </div>
          
          <div className="flex justify-between space-x-2 mt-6">
            <button
              type="button"
              onClick={onUndo}
              className="btn btn-outline"
            >
              Annulla operazione
            </button>
            
            <button
              type="submit"
              className="btn btn-primary flex items-center"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}