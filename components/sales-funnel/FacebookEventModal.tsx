// components/sales-funnel/FacebookEventModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Facebook, Info, AlertTriangle, DollarSign, CreditCard } from "lucide-react";
import { FunnelItem, FunnelOperationResult } from "@/types";
import { updateLeadStage, getLeadFullData } from "@/lib/api/funnel";
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
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isCheckingConsent, setIsCheckingConsent] = useState(true);
  const [needsValue, setNeedsValue] = useState(false);
  const [leadValue, setLeadValue] = useState<number>(lead.value ?? 0);
  const [leadService, setLeadService] = useState<string>(lead.service || "");
  
  // Verifica del consenso quando il modale si apre
  useEffect(() => {
    const checkConsent = async () => {
      try {
        setIsCheckingConsent(true);
        // Use the getLeadFullData function instead of direct fetch
        const leadData = await getLeadFullData(lead.leadId || lead._id);
        
        // Verifica se il lead ha dato il consenso per le terze parti
        setHasConsent(leadData.consent?.thirdParty === true);

        // Controlla se il lead ha un valore
        if (lead.value === undefined || lead.value === null || lead.value <= 0) {
          setNeedsValue(true);
        }
      } catch (error) {
        console.error("Errore nel recupero dei dati del consenso:", error);
        setHasConsent(false);
      } finally {
        setIsCheckingConsent(false);
      }
    };
    
    checkConsent();
  }, [lead._id, lead.leadId, lead.value]);
  
  // Mappa lo stato a un evento Facebook appropriato
  useEffect(() => {
    // Per gli eventi di acquisto, usa sempre "Purchase"
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
      // Chiamata API per confermare lo spostamento e inviare l'evento a Facebook
      const result = await updateLeadStage(
        lead.leadId || lead._id,
        lead.type,
        previousStatus,
        lead.status,
        sendToFacebook ? {
          eventName: eventName,
          eventMetadata: {
            value: leadValue,
            service: leadService
          }
        } : undefined
      ) as FunnelOperationResult;
      
      if (result.success) {
        if (result.consentError && sendToFacebook) {
          toast("warning", "Lead spostato con limitazioni", 
            "Lead spostato ma l'evento non è stato inviato a Facebook: consenso per terze parti mancante"
          );
        } else {
          toast("success", "Lead spostato con successo", 
            sendToFacebook 
              ? `Evento "${eventName}" inviato a Facebook` 
              : "Nessun evento inviato a Facebook"
          );
        }
        
        // Se è stata creata una scheda cliente, mostra un toast aggiuntivo
        if (result.clientResult?.success) {
          toast("success", "Cliente creato", "La scheda cliente è stata creata con successo");
        }
        
        onSave();
      } else {
        throw new Error(result.message || "Errore sconosciuto");
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className="bg-zinc-800 rounded-xl shadow-xl w-full max-w-md z-10 animate-in fade-in duration-200 scale-95 to:scale-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
          <h3 className="text-base sm:text-lg font-semibold text-white">Cliente acquisito</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-700/50 transition-colors"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex items-start p-4 rounded-lg bg-info/10 border border-info/20 text-info">
            <Info size={20} className="mr-3 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p>
                Il lead <span className="font-semibold">{lead.name}</span> è stato spostato da <span className="font-semibold">{previousStatus}</span> a <span className="font-semibold">{lead.status}</span>.
              </p>
              <p className="mt-2 font-medium">
                Cliente acquisito! Vuoi inviare l'evento di acquisto alla Conversion API di Facebook?
              </p>
            </div>
          </div>
          
          {isCheckingConsent ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin mr-3 h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm text-zinc-300">Verifica del consenso in corso...</span>
            </div>
          ) : !hasConsent && (
            <div className="flex items-start p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger">
              <AlertTriangle size={20} className="mr-3 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Consenso per terze parti mancante!</p>
                <p>Questo lead non ha fornito il consenso per la condivisione dei dati con terze parti.</p>
                <p className="mt-1">Puoi comunque spostare il lead ma l'evento non sarà inviato a Facebook.</p>
              </div>
            </div>
          )}
          
          <div className="space-y-5">
            {needsValue && (
              <div className="space-y-4 p-4 rounded-lg bg-zinc-700/30 border border-zinc-600/50">
                <div className="font-medium text-zinc-200 flex items-center">
                  <DollarSign size={18} className="mr-2 text-primary" />
                  Aggiungi informazioni di vendita
                </div>
                
                <div>
                  <label htmlFor="leadValue" className="block text-sm font-medium mb-1.5 text-zinc-300">
                    Valore della vendita (€)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      €
                    </span>
                    <input
                      type="number"
                      id="leadValue"
                      value={leadValue}
                      onChange={(e) => setLeadValue(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-600 rounded-md py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="leadService" className="block text-sm font-medium mb-1.5 text-zinc-300">
                    Servizio acquistato
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                      <CreditCard size={16} />
                    </span>
                    <input
                      type="text"
                      id="leadService"
                      value={leadService}
                      onChange={(e) => setLeadService(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-600 rounded-md py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Descrivi il servizio venduto"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium mb-1.5 text-zinc-300">
                Nome evento Facebook
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
                readOnly={lead.status === "customer"}
              />
              {lead.status === "customer" && (
                <p className="mt-1 text-xs text-zinc-400">
                  L'evento di acquisto è preimpostato su "Purchase"
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              <input
                type="checkbox"
                id="sendToFacebook"
                checked={sendToFacebook}
                onChange={(e) => setSendToFacebook(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-primary focus:ring-primary"
                disabled={!hasConsent}
              />
              <label htmlFor="sendToFacebook" className={`text-sm ${!hasConsent ? 'text-zinc-500' : 'text-zinc-300'}`}>
                Invia evento a Facebook
                {!hasConsent && sendToFacebook && " (richiede consenso terze parti)"}
              </label>
            </div>
            
            {!needsValue && (
              <div className="space-y-2 mt-4">
                {(lead.value !== undefined && lead.value !== null && lead.value > 0) && (
                  <div className="flex items-center justify-between py-2.5 px-4 bg-zinc-900/70 rounded-md border border-zinc-700/50">
                    <span className="text-sm text-zinc-400">Valore:</span>
                    <span className="text-sm font-medium text-primary">€{lead.value.toLocaleString('it-IT')}</span>
                  </div>
                )}
                
                {lead.service && (
                  <div className="flex items-center justify-between py-2.5 px-4 bg-zinc-900/70 rounded-md border border-zinc-700/50">
                    <span className="text-sm text-zinc-400">Servizio:</span>
                    <span className="text-sm font-medium">{lead.service}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 mt-4 border-t border-zinc-700/50">
            <button
              type="button"
              onClick={onUndo}
              className="w-full sm:w-auto py-2.5 px-4 border border-zinc-600 rounded-md text-zinc-300 hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 focus:ring-offset-zinc-800"
            >
              Annulla operazione
            </button>
            
            <button
              type="submit"
              className="w-full sm:w-auto py-2.5 px-5 bg-primary rounded-md text-white hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-zinc-800 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Elaborazione...
                </span>
              ) : (
                <>
                  {sendToFacebook && hasConsent && <Facebook size={16} className="mr-2" />}
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