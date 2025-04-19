// components/events/EventDetailsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Info, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Event } from "@/types";
import { formatDateTime } from "@/lib/utils/date";

interface EventDetailsModalProps {
  event: Event;
  isRetrying: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function EventDetailsModal({ 
  event, 
  isRetrying, 
  onClose, 
  onRetry 
}: EventDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "data" | "error">("info");
  
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
  
  const prettyPrint = (obj: any) => {
    if (!obj) return "Nessun dato";
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return "Errore nella formattazione JSON";
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
          <h3 className="text-base font-medium">Dettagli evento Facebook</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Tabs */}
          <div className="flex border-b border-zinc-700 mb-4">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "info" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <Info size={16} className="inline-block mr-1 -mt-0.5" /> Info
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === "data" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              <svg className="inline-block mr-1 -mt-0.5 w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
              </svg> Dati
            </button>
            {!event.success && (
              <button
                onClick={() => setActiveTab("error")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "error" 
                    ? "border-danger text-danger" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                <AlertTriangle size={16} className="inline-block mr-1 -mt-0.5" /> Errore
              </button>
            )}
          </div>
          
          {/* Tab Content */}
          <div className="mt-4">
            {/* Info Tab */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-400">Nome evento:</div>
                    <div className="font-medium">{event.eventName}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-400">Data invio:</div>
                    <div className="font-medium">{formatDateTime(event.createdAt)}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-400">Tipo lead:</div>
                    <div className="font-medium">
                      {event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-400">Stato:</div>
                    <div>
                      {event.success ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                          <CheckCircle size={14} className="mr-1" /> Inviato con successo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-danger/20 text-danger">
                          <XCircle size={14} className="mr-1" /> Errore
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-zinc-400">Event ID:</div>
                    <div className="font-mono text-xs p-1.5 bg-zinc-900 rounded">
                      {event.eventId || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data Tab */}
            {activeTab === "data" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Dati utente
                  </h4>
                  <pre className="text-xs p-3 bg-zinc-900 rounded overflow-x-auto">
                    {prettyPrint(event.userData)}
                  </pre>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                    </svg>
                    Dati personalizzati
                  </h4>
                  <pre className="text-xs p-3 bg-zinc-900 rounded overflow-x-auto">
                    {prettyPrint(event.customData)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Error Tab */}
            {activeTab === "error" && !event.success && (
              <div className="p-4 rounded border border-danger/20 bg-danger/10 text-danger">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <AlertTriangle size={16} className="mr-1.5" />
                  Dettagli errore
                </h4>
                <p className="text-sm mt-2">{event.error || "Errore sconosciuto"}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center px-4 py-3 border-t border-zinc-700 bg-zinc-900/30">
          <button
            onClick={onClose}
            className="btn btn-outline"
          >
            Chiudi
          </button>
          
          {!event.success && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="btn btn-primary"
            >
              {isRetrying ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Elaborazione...
                </span>
              ) : (
                "Riprova invio"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}