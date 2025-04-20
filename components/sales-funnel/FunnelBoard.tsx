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
  
  const isTouchDevice = () =>
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  const backend = isTouchDevice() ? TouchBackend : HTML5Backend;
  
  const options = isTouchDevice()
    ? {
        enableTouchEvents: true,
        enableKeyboardEvents: true,
        delay: 50,
        touchSlop: 25,
        ignoreContextMenu: true,
        scrollAngleRanges: [
          { start: 30, end: 150 },
          { start: 210, end: 330 }
        ]
      }
    : undefined;
  
  // When the component mounts, we mark DnD as ready (client-side only)
  useEffect(() => {
    setIsDndReady(true);
  }, []);
  
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    if (lead.status === targetStatus) return;
    
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
    
    try {
      // Call the server to actually update the status
      await updateLeadStage(
        lead._id,
        lead.type,
        lead.status,
        targetStatus
      );
      
      // Notify the user
      toast("success", "Lead moved successfully", `${lead.name} moved to ${targetStatus}`);
      
      // Update data from server
      onLeadMove();
    } catch (error) {
      console.error("Error while moving lead:", error);
      
      // Restore previous state in case of error
      toast("error", "Error moving lead", "An error occurred, please try again.");
      
      // Undo the optimistic update
      const fallbackData = { ...funnelData };
      // Remove from target column where we just added it
      fallbackData[targetColumn] = fallbackData[targetColumn].filter(
        item => item._id !== lead._id
      );
      
      // Add back to original column
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
  
  // Use a container with overflow-x-auto to enable horizontal scrolling
  return (
    <>
      {isDndReady && (
        <DndProvider backend={backend} options={options}>
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