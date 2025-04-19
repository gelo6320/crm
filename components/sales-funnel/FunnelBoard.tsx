// components/sales-funnel/FunnelBoard.tsx
"use client";

import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { FunnelData, FunnelItem } from "@/types";
import FunnelColumn from "./FunnelColumn";
import FunnelCard from "./FunnelCard";
import EditValueModal from "./EditValueModal";
import { isTouchDevice } from "@/lib/utils/device";

interface FunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => void;
}

export default function FunnelBoard({ funnelData, setFunnelData, onLeadMove }: FunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isDndReady, setIsDndReady] = useState(false);
  
  // Set up the correct backend based on device type
  const backendForDND = isTouchDevice() ? TouchBackend : HTML5Backend;
  
  // When the component mounts, we mark DnD as ready (client-side only)
  useState(() => {
    setIsDndReady(true);
  });
  
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    // In a real app, make an API call to update the lead status
    console.log(`Moving lead ${lead._id} from ${lead.status} to ${targetStatus}`);
    
    // Update local state
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
    
    setFunnelData(updatedFunnelData);
    
    // Trigger refresh from the server
    onLeadMove();
  };
  
  const handleEditValue = (lead: FunnelItem) => {
    setEditingLead(lead);
  };
  
  const handleSaveValue = async (value: number, service: string) => {
    if (!editingLead) return;
    
    // In a real app, make an API call to update the lead value and service
    console.log(`Updating lead ${editingLead._id} with value ${value} and service ${service}`);
    
    // Update local state
    const column = editingLead.status as keyof FunnelData;
    const updatedFunnelData = { ...funnelData };
    
    updatedFunnelData[column] = updatedFunnelData[column].map(lead => 
      lead._id === editingLead._id 
        ? { ...lead, value, service }
        : lead
    );
    
    setFunnelData(updatedFunnelData);
    setEditingLead(null);
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
          <div className="flex space-x-4 min-w-max pb-2">
            {columns.map((column) => (
              <FunnelColumn
                key={column.id}
                id={column.id}
                title={column.name}
                color={column.color}
                onMoveLead={handleMoveLead}
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