// components/sales-funnel/FunnelBoard.tsx
"use client";

import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { FunnelData, FunnelItem } from "@/types";
import FunnelColumn from "./FunnelColumn";
import FunnelCard from "./FunnelCard";
import EditValueModal from "./ValueModal";
import { isTouchDevice } from "@/lib/utils/device";
import { updateLeadStage } from "@/lib/api/funnel";
import { toast } from "@/components/ui/toaster";
import CustomDragLayer from './CustomDragLayer';

interface FunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => void;
}

export default function FunnelBoard({ funnelData, setFunnelData, onLeadMove }: FunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isDndReady, setIsDndReady] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  
  // Set up the correct backend based on device type
  const backendForDND = isTouchDevice() ? 
  TouchBackend({
    enableMouseEvents: true,
    enableKeyboardEvents: true,
    delay: 50,
    delayTouchStart: 50,
    touchSlop: 25, // Distanza che deve essere trascinata prima che venga considerata un drag
    ignoreContextMenu: true,
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 }
    ]
  }) : 
  HTML5Backend;
  
  // When the component mounts, we mark DnD as ready (client-side only)
  useEffect(() => {
    setIsDndReady(true);
  }, []);
  
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    if (lead.status === targetStatus) return;
    
    setIsMoving(true);
    
    // Ottimisticamente aggiorna l'UI prima della risposta del server
    const sourceColumn = lead.status as keyof FunnelData;
    const targetColumn = targetStatus as keyof FunnelData;
    
    const updatedFunnelData = { ...funnelData };
    
    // Remove from source column
    updatedFunnelData[sourceColumn] = updatedFunnelData[sourceColumn].filter(
      item => item._id !== lead._id
    );
    
    // Add to target column with updated status
    updatedFunnelData[targetColumn] = [
      ...updatedFunnelData[targetColumn],
      { ...lead, status: targetStatus }
    ];
    
    // Aggiorna l'UI immediatamente
    setFunnelData(updatedFunnelData);
    
    try {
      // Chiama il server per aggiornare effettivamente lo stato
      await updateLeadStage(
        lead._id,
        lead.type,
        lead.status,
        targetStatus
      );
      
      // Notifica all'utente
      toast("success", "Lead spostato con successo", `${lead.name} spostato a ${targetStatus}`);
      
      // Aggiorna i dati dal server
      onLeadMove();
    } catch (error) {
      console.error("Errore durante lo spostamento del lead:", error);
      
      // Ripristina lo stato precedente in caso di errore
      toast("error", "Errore durante lo spostamento", "Si è verificato un errore, riprovare.");
      
      // Annulla la modifica ottimistica
      const fallbackData = { ...funnelData };
      // Rimuovi dalla colonna di destinazione dove l'abbiamo appena aggiunto
      fallbackData[targetColumn] = fallbackData[targetColumn].filter(
        item => item._id !== lead._id
      );
      
      // Riaggiungi nella colonna originale
      fallbackData[sourceColumn] = [
        ...fallbackData[sourceColumn],
        lead
      ];
      
      setFunnelData(fallbackData);
    } finally {
      setIsMoving(false);
    }
  };
  
  const handleEditValue = (lead: FunnelItem) => {
    setEditingLead(lead);
  };
  
  const handleSaveValue = async (value: number, service: string) => {
    if (!editingLead) return;
    
    try {
      // Ottimisticamente aggiorna l'UI prima della risposta del server
      const column = editingLead.status as keyof FunnelData;
      const updatedFunnelData = { ...funnelData };
      
      updatedFunnelData[column] = updatedFunnelData[column].map(lead => 
        lead._id === editingLead._id 
          ? { ...lead, value, service }
          : lead
      );
      
      setFunnelData(updatedFunnelData);
      
      // Chiama il server per aggiornare effettivamente il valore e il servizio
      const { updateLeadMetadata } = await import("@/lib/api/funnel");
      await updateLeadMetadata(
        editingLead._id,
        editingLead.type,
        value,
        service
      );
      
      // Notifica all'utente
      toast("success", "Lead aggiornato", "Valore e servizio aggiornati con successo");
      
      // Aggiorna i dati dal server
      onLeadMove();
    } catch (error) {
      console.error("Errore durante l'aggiornamento del lead:", error);
      toast("error", "Errore aggiornamento", "Si è verificato un errore, riprovare.");
    } finally {
      setEditingLead(null);
    }
  };
  
  const columns = [
    { id: "new", name: "Nuovo", color: "bg-zinc-600" },
    { id: "contacted", name: "Contattato", color: "bg-info" },
    { id: "qualified", name: "Qualificato", color: "bg-primary" },
    { id: "opportunity", name: "Opportunità", color: "bg-warning" },
    { id: "proposal", name: "Preventivo", color: "bg-primary-hover" },
    { id: "customer", name: "Chiuso", color: "bg-success" },
    { id: "lost", name: "Perso", color: "bg-danger" },
  ];
  
  // Use a container with overflow-x-auto to enable horizontal scrolling
  return (
    <>
      {isDndReady && (
        <DndProvider backend={backendForDND}>
          <CustomDragLayer />
          <div id="funnel-board-container" className="funnel-board-container flex space-x-4 min-w-max pb-2 overflow-x-auto">
            {columns.map((column) => (
              <FunnelColumn
                key={column.id}
                id={column.id}
                title={column.name}
                color={column.color}
                onMoveLead={handleMoveLead}
                isMoving={isMoving}
              >
                {funnelData[column.id as keyof FunnelData].map((lead) => (
                  <FunnelCard
                    key={lead._id}
                    lead={lead}
                    onEdit={handleEditValue}
                  />
                ))}
              </FunnelColumn>
            ))}
           </div>
       </DndProvider>
     )}
     
     {editingLead && (
       <EditValueModal
         lead={editingLead}
         onClose={() => setEditingLead(null)}
         onSave={handleSaveValue}
       />
     )}
   </>
 );
}