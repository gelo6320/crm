// components/sales-funnel/EditValueModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { FunnelItem } from "@/types";

interface EditValueModalProps {
  lead: FunnelItem;
  onClose: () => void;
  onSave: (value: number, service: string) => void;
}

export default function EditValueModal({ lead, onClose, onSave }: EditValueModalProps) {
  const [value, setValue] = useState<string>(lead.value?.toString() || "");
  const [service, setService] = useState<string>(lead.service || "");
  
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Number(value) || 0, service);
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
              className="btn btn-primary"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}