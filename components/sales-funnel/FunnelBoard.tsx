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
import FacebookEventModal from "./FacebookEventModal";
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
  const [movedLead, setMovedLead] = useState<{lead: FunnelItem, previousStatus: string} | null>(null);
  
  // Opzioni migliorate per il touch backend
  const touchBackendOptions = {
    enableTouchEvents: true,
    enableMouseEvents: true, // Supporta anche il mouse su dispositivi touch
    enableKeyboardEvents: true,
    delayTouchStart: 200, // Aumentato per dare tempo all'animazione di feedback
    touchSlop: 10, // Ridotto per migliorare sensibilità
    ignoreContextMenu: true,
    enableHoverOutsideTarget: true,
    enableTapClick: true, // Migliora l'esperienza sui dispositivi mobile
    // Modifica le scroll angle ranges per avere più controllo
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 }
    ]
  };
  
  // When the component mounts, we mark DnD as ready (client-side only)
  useEffect(() => {
    setIsDndReady(true);
    console.log("[DnD Debug] Drag and drop sistema inizializzato");
    console.log("[DnD Debug] Usando backend:", isTouchDevice() ? "TouchBackend" : "HTML5Backend");
  }, []);
  
  // Setta il backend in base al dispositivo
  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
  const backendOptions = isTouchDevice() ? touchBackendOptions : undefined;
  
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    if (lead.status === targetStatus) return;
    
    console.log(`[DnD Debug] Spostamento: ${lead.name} da ${lead.status} a ${targetStatus}`);
    setIsMoving(true);
    
    setIsMoving(true);
    
    // Optimistically update the UI before the server response
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
    
    // Update the UI immediately
    setFunnelData(updatedFunnelData);
    
    // Mostra il popup di conferma per l'invio a Facebook
    setMovedLead({lead: {...lead, status: targetStatus}, previousStatus: lead.status});
  };
  
  // Annulla l'operazione di spostamento (in caso di errore o cancellazione dall'utente)
  const handleUndoMove = () => {
    if (!movedLead) return;
    
    const lead = movedLead.lead;
    const sourceColumn = movedLead.previousStatus as keyof FunnelData;
    const targetColumn = lead.status as keyof FunnelData;
    
    const updatedFunnelData = { ...funnelData };
    
    // Remove from target column
    updatedFunnelData[targetColumn] = updatedFunnelData[targetColumn].filter(
      item => item._id !== lead._id
    );
    
    // Add back to source column with previous status
    updatedFunnelData[sourceColumn] = [
      ...updatedFunnelData[sourceColumn],
      { ...lead, status: movedLead.previousStatus }
    ];
    
    // Update the UI
    setFunnelData(updatedFunnelData);
    setMovedLead(null);
    setIsMoving(false);
  };
  
  // Conferma l'operazione di spostamento e aggiorna dati dal server
  const handleConfirmMove = () => {
    onLeadMove(); // Aggiorna dati dal server
    setMovedLead(null);
    setIsMoving(false);
  };
  
  const handleEditValue = (lead: FunnelItem) => {
    setEditingLead(lead);
  };
  
  const handleSaveValue = async (value: number, service: string) => {
    if (!editingLead) return;
    
    try {
      // Optimistically update the UI before the server response
      const column = editingLead.status as keyof FunnelData;
      const updatedFunnelData = { ...funnelData };
      
      updatedFunnelData[column] = updatedFunnelData[column].map(lead => 
        lead._id === editingLead._id 
          ? { ...lead, value, service }
          : lead
      );
      
      setFunnelData(updatedFunnelData);
      
      // Call the server to actually update the value and service
      const { updateLeadMetadata } = await import("@/lib/api/funnel");
      await updateLeadMetadata(
        editingLead._id,
        editingLead.type,
        value,
        service
      );
      
      // Notify the user
      toast("success", "Lead updated", "Value and service updated successfully");
      
      // Update data from server
      onLeadMove();
    } catch (error) {
      console.error("Error updating lead:", error);
      toast("error", "Update error", "An error occurred, please try again.");
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

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      console.log("[DnD Debug] Touch start event detected", e.touches[0].clientX, e.touches[0].clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      console.log("[DnD Debug] Touch move event detected", e.touches[0].clientX, e.touches[0].clientY);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      console.log("[DnD Debug] Touch end event detected");
    };
    
    // Aggiungi listener solo in modalità di sviluppo o condizionalmente
    if (process.env.NODE_ENV === 'development' || true) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  
  return (
    <>
      {isDndReady && (
        <DndProvider backend={backend} options={backendOptions}>
          <CustomDragLayer />
          <div 
            id="funnel-board-container" 
            className="funnel-board-container flex space-x-4 min-w-max pb-2 overflow-x-auto scroll-smooth"
          >
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
      
      {/* Modal per modificare valore e servizio */}
      {editingLead && (
        <EditValueModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={handleSaveValue}
        />
      )}
      
      {/* Modal per confermare invio a Facebook */}
      {movedLead && (
        <FacebookEventModal
          lead={movedLead.lead}
          previousStatus={movedLead.previousStatus}
          onClose={() => setMovedLead(null)}
          onSave={handleConfirmMove}
          onUndo={handleUndoMove}
        />
      )}
    </>
  );
}