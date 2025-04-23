// components/leads/EditLeadModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Share2 } from "lucide-react";
import { Lead, Booking } from "@/types";
import { formatDateTime } from "@/lib/utils/date";
import StatusBadge from "@/components/ui/StatusBadge";

interface EditLeadModalProps {
    lead: Lead | Booking;  // Ora può accettare entrambi i tipi
    onClose: () => void;
    onSave: () => void;
    type: "form" | "booking" | "facebook";
  }

  function isBooking(lead: Lead | Booking): lead is Booking {
    return (lead as Booking).bookingDate !== undefined;
  }
  
  export default function EditLeadModal({ lead, onClose, onSave, type }: EditLeadModalProps) {
  const [newStatus, setNewStatus] = useState(lead.status);
  const [eventName, setEventName] = useState("");
  const [eventNote, setEventNote] = useState("");
  const [hasFbclid, setHasFbclid] = useState(!!lead.fbclid);
  const [fbclid, setFbclid] = useState(lead.fbclid || "");
  const [purchaseValue, setPurchaseValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  const getStatusOptions = () => {
    if (type === "booking") {
      return [
        { value: "pending", label: "In attesa" },
        { value: "confirmed", label: "Confermato" },
        { value: "completed", label: "Completato" },
        { value: "cancelled", label: "Cancellato" },
        { value: "qualified", label: "Qualificato" },
        { value: "opportunity", label: "Opportunità" },
        { value: "customer", label: "Cliente" },
        { value: "lost", label: "Perso" },
      ];
    }
    
    return [
      { value: "new", label: "Nuovo" },
      { value: "contacted", label: "Contattato" },
      { value: "qualified", label: "Qualificato" },
      { value: "opportunity", label: "Opportunità" },
      { value: "customer", label: "Cliente" },
      { value: "lost", label: "Perso" },
    ];
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStatus || !eventName) {
      // Show error
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, send request to update lead status and send event to Facebook
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      onSave();
    } catch (error) {
      console.error("Error updating lead status:", error);
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
      
      <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 z-10 animate-scale-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-base font-medium">Aggiorna stato lead</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Lead Info */}
            <div className="card bg-zinc-900/60 p-3">
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Informazioni lead
              </h4>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-zinc-400">Nome:</div>
                <div className="col-span-2 font-medium">{lead.name}</div>
                
                <div className="text-zinc-400">Email:</div>
                <div className="col-span-2">{lead.email}</div>
                
                <div className="text-zinc-400">Telefono:</div>
                <div className="col-span-2">{lead.phone}</div>
                
                {type === "booking" && isBooking(lead) && (
                  <>
                    <div className="text-zinc-400">Prenotazione:</div>
                    <div className="col-span-2">{lead.bookingDate} {lead.bookingTime}</div>
                  </>
                )}
                
                <div className="text-zinc-400">Fonte:</div>
                <div className="col-span-2">{lead.source || "Non specificata"}</div>
                
                <div className="text-zinc-400">Stato attuale:</div>
                <div className="col-span-2">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            </div>
            
            {/* Events History */}
            <div className="card bg-zinc-900/60 p-3">
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Share2 size={16} className="mr-2 text-info" />
                Cronologia eventi
              </h4>
              
              <div className="h-40 overflow-y-auto">
                {lead.crmEvents && lead.crmEvents.length > 0 ? (
                  <div className="space-y-2">
                    {lead.crmEvents.map((event, index) => (
                      <div key={index} className="text-xs p-2 bg-zinc-800 rounded">
                        <div className="font-medium">{event.eventName}</div>
                        <div className="text-zinc-400 flex items-center mt-1">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                          </svg>
                          {formatDateTime(event.createdAt)}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Inviato a Facebook:</span>
                          {event.success ? (
                            <span className="text-success">Sì</span>
                          ) : (
                            <span className="text-danger">No</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 text-xs py-10">
                    Nessun evento registrato
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-700 my-4 pt-4">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="newStatus" className="block text-sm font-medium mb-1">
                    Nuovo stato
                  </label>
                  <select
                    id="newStatus"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                    className="input w-full"
                  >
                    <option value="" disabled>Seleziona nuovo stato</option>
                    {getStatusOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium mb-1">
                    Evento Facebook
                  </label>
                  <select
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                    className="input w-full"
                  >
                    <option value="" disabled>Seleziona evento</option>
                    <option value="QualifiedLead">Lead Qualificato</option>
                    <option value="Meeting">Meeting/Chiamata</option>
                    <option value="Opportunity">Opportunità</option>
                    <option value="ProposalSent">Preventivo Inviato</option>
                    <option value="Purchase">Acquisto</option>
                    <option value="Lost">Lead Perso</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="eventNote" className="block text-sm font-medium mb-1">
                  Note (opzionale)
                </label>
                <textarea
                  id="eventNote"
                  value={eventNote}
                  onChange={(e) => setEventNote(e.target.value)}
                  rows={3}
                  className="input w-full"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasFbclid}
                    onChange={(e) => setHasFbclid(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Il lead ha un fbclid associato</span>
                </label>
              </div>
              
              {eventName === "Purchase" && (
                <div className="mb-4">
                  <label htmlFor="purchaseValue" className="block text-sm font-medium mb-1">
                    Valore dell&apos;acquisto
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      id="purchaseValue"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="input rounded-r-none w-full"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-zinc-700 bg-zinc-900 text-zinc-400">
                      €
                    </span>
                  </div>
                </div>
              )}
              
              {hasFbclid && (
                <div className="mb-4">
                  <label htmlFor="fbclid" className="block text-sm font-medium mb-1">
                    Facebook Click ID (fbclid)
                  </label>
                  <input
                    type="text"
                    id="fbclid"
                    value={fbclid}
                    onChange={(e) => setFbclid(e.target.value)}
                    placeholder="Es. fbclid_123456789"
                    className="input w-full"
                  />
                  <p className="mt-1 text-xs text-zinc-400">
                    Identificativo del click proveniente da Facebook
                  </p>
                </div>
              )}
              
              <div className="bg-info/10 border border-info/20 rounded p-3 text-xs text-info flex items-start mb-4">
                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>
                  Questo aggiornerà lo stato del lead e invierà l&apos;evento selezionato alla Conversion API di Facebook.
                </span>
              </div>
            </form>
          </div>
        </div>
        
        <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-700 bg-zinc-900/30">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Annulla
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !newStatus || !eventName}
            className="btn btn-primary inline-flex items-center justify-center"
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
              "Aggiorna e invia evento"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}