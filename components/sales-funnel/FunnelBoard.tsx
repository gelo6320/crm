// components/sales-funnel/CustomFunnelBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";

// Importazioni dnd-kit
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  Modifier,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

interface CustomFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
}

// Columns configuration
const COLUMNS = [
  { id: "new", title: "Nuovi", color: "bg-zinc-700" },
  { id: "contacted", title: "Contattati", color: "bg-info" },
  { id: "qualified", title: "Qualificati", color: "bg-primary" },
  { id: "opportunity", title: "Opportunità", color: "bg-warning" },
  { id: "proposal", title: "Proposta", color: "bg-primary-hover" },
  { id: "customer", title: "Clienti", color: "bg-success" },
  { id: "lost", title: "Persi", color: "bg-danger" },
];

export default function CustomFunnelBoard({ funnelData, setFunnelData, onLeadMove }: CustomFunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);
  
  // Stato per tracciare i lead in fase di trascinamento
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<FunnelItem | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  
  // Ref per il contenitore principale (per l'autoscroll)
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Configurazione sensori dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Inizia il drag dopo 5px di movimento
      },
    }),
    useSensor(KeyboardSensor, {
      // Per accessibilità: permette drag con tastiera
      coordinateGetter: () => {
        return { x: 0, y: 0 }; // Semplificato
      },
    })
  );
  
  // Configurazione modificatori
  const modifiers: Modifier[] = [
    restrictToWindowEdges 
  ];
  
  // Gestore inizio drag
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedId = active.id as string;
    
    // Trova il lead e lo stato corrente
    let currentLead: FunnelItem | null = null;
    let currentStatus: string | null = null;
    
    // Cerca il lead in tutte le colonne
    for (const colId in funnelData) {
      const found = funnelData[colId as keyof FunnelData].find(item => item._id === draggedId);
      if (found) {
        currentLead = found;
        currentStatus = colId;
        break;
      }
    }
    
    if (currentLead) {
      setActiveLead(currentLead);
      setActiveId(draggedId);
      setActiveStatus(currentStatus);
    }
  };
  
  // Gestore durante il drag
  const handleDragOver = (_event: DragOverEvent) => {
    // L'overlay e l'autoscroll sono gestiti automaticamente da dnd-kit
  };
  
  // Gestore fine drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    
    // Se non c'è un over o non abbiamo informazioni sul lead attivo, terminiamo
    if (!over || !activeLead || !activeStatus) return;
    
    const targetStatus = over.id as string;
    
    // Verifichiamo che lo stato di destinazione esista ed è diverso dall'origine
    if (
      COLUMNS.some(col => col.id === targetStatus) &&
      targetStatus !== activeStatus
    ) {
      // Esegui il movimento del lead
      handleMoveLead(activeLead, targetStatus);
    }
    
    // Reset 
    setActiveLead(null);
    setActiveStatus(null);
  };

  // Handle lead movement between columns
  const handleMoveLead = (lead: FunnelItem, targetStatus: string) => {
    if (!lead || lead.status === targetStatus) return;

    // Store the previous status
    const prevStatus = lead.status;

    // Update state to show movement is in progress
    setIsMoving(true);

    // First update the UI immediately for better UX
    const updatedFunnelData = { ...funnelData };

    // Remove lead from the source column
    updatedFunnelData[prevStatus as keyof FunnelData] = updatedFunnelData[
      prevStatus as keyof FunnelData
    ].filter((item) => item._id !== lead._id);

    // Update lead status
    const updatedLead = { ...lead, status: targetStatus };

    // Add lead to the target column
    updatedFunnelData[targetStatus as keyof FunnelData] = [
      ...updatedFunnelData[targetStatus as keyof FunnelData],
      updatedLead,
    ];

    // Update state
    setFunnelData(updatedFunnelData);

    // Store the moving lead data for the modal
    setMovingLead({
      lead: updatedLead,
      prevStatus,
      newStatus: targetStatus,
    });
  };

  // Handle confirming the lead move after showing the modal
  const handleConfirmMove = async () => {
    try {
      // Here we would actually call the API to update the lead status
      // This is handled in the onLeadMove callback
      await onLeadMove();
    } catch (error) {
      console.error("Error moving lead:", error);
    } finally {
      setIsMoving(false);
      setMovingLead(null);
    }
  };

  // Handle undoing the lead move if canceled
  const handleUndoMove = () => {
    if (!movingLead) return;

    // Revert the UI change
    const updatedFunnelData = { ...funnelData };

    // Remove lead from the target column
    updatedFunnelData[movingLead.newStatus as keyof FunnelData] = updatedFunnelData[
      movingLead.newStatus as keyof FunnelData
    ].filter((item) => item._id !== movingLead.lead._id);

    // Restore lead to the source column with original status
    const revertedLead = { ...movingLead.lead, status: movingLead.prevStatus };
    updatedFunnelData[movingLead.prevStatus as keyof FunnelData] = [
      ...updatedFunnelData[movingLead.prevStatus as keyof FunnelData],
      revertedLead,
    ];

    // Update state
    setFunnelData(updatedFunnelData);
    setIsMoving(false);
    setMovingLead(null);
  };

  // Handle editing a lead's value and service
  const handleEditLead = (lead: FunnelItem) => {
    setEditingLead(lead);
  };

  // Handle saving edits to a lead
  const handleSaveLeadValue = async (value: number, service: string) => {
    if (!editingLead) return;

    try {
      // Update the lead metadata via API
      await updateLeadMetadata(editingLead._id, editingLead.type, value, service);

      // Update local state for immediate UI update
      const updatedFunnelData = { ...funnelData };
      const status = editingLead.status as keyof FunnelData;

      // Find and update the lead in its column
      updatedFunnelData[status] = updatedFunnelData[status].map((item) =>
        item._id === editingLead._id
          ? { ...item, value, service }
          : item
      );

      setFunnelData(updatedFunnelData);
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead value:", error);
    }
  };

  // Componente Card Draggable
  const LeadCard = ({ lead, isDragging }: { lead: FunnelItem; isDragging: boolean }) => {
    return (
      <div
        className={`funnel-card ${isDragging ? 'opacity-50' : ''}`}
        style={{
          borderLeftColor: getBorderColor(lead.status),
        }}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="font-medium text-sm truncate pr-1">
            {lead.name}
          </div>
          <button
            className="p-1 rounded-full hover:bg-zinc-700 transition-colors edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEditLead(lead);
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
        </div>
        <div className="text-xs text-zinc-400">
          <div>{formatDate(lead.createdAt)}</div>
          {lead.value ? <div className="text-primary font-medium my-1">€{formatMoney(lead.value)}</div> : ''}
          {lead.service ? <div className="italic">{lead.service}</div> : ''}
        </div>
      </div>
    );
  };

  // Componente Draggable
  const DraggableCard = ({ lead }: { lead: FunnelItem }) => {
    return (
      <div 
        id={lead._id} 
        data-id={lead._id} 
        className="drag-handle"
      >
        <LeadCard lead={lead} isDragging={activeId === lead._id} />
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      autoScroll={{ 
        threshold: { x: 0.1, y: 0.1 },  // Inizia l'autoscroll quando sei al 10% dal bordo
        speed: { x: 1000, y: 1000 },    // Velocità di auto-scroll
      }}
      modifiers={modifiers}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={boardRef}
        className="funnel-board-container w-full overflow-x-auto"
        id="funnel-board-container"
      >
        <div className="funnel-board min-w-max flex">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              id={column.id}
              className={`funnel-column ${isMoving ? 'column-fade-transition' : ''} ${
                activeId && !activeStatus ? 'drop-target-active' : ''
              }`}
            >
              <div className={`funnel-header ${column.color}`}>
                <h3 className="text-sm font-medium">{column.title}</h3>
                <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
                  {funnelData[column.id as keyof FunnelData].length}
                </div>
              </div>
              
              <div className="funnel-body">
                {funnelData[column.id as keyof FunnelData].length > 0 ? (
                  funnelData[column.id as keyof FunnelData].map((lead) => (
                    <DraggableCard 
                      key={lead._id}
                      lead={lead}
                    />
                  ))
                ) : (
                  <div className="text-center text-zinc-500 text-xs italic py-4">
                    Nessun lead
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DragOverlay 
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)', // Animazione rimbalzante
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}
      >
        {activeId && activeLead ? (
          <div className="drag-overlay">
            <LeadCard lead={activeLead} isDragging={false} />
          </div>
        ) : null}
      </DragOverlay>
      
      {/* CSS per il funnel board */}
      <style jsx global>{`
        .funnel-board-container {
          overflow-x: auto;
          overflow-y: hidden;
          position: relative;
        }
        
        .funnel-board {
          display: flex;
          min-width: max-content;
          height: calc(100vh - 200px);
        }
        
        .funnel-column {
          min-width: 300px;
          width: 300px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .funnel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .funnel-body {
          padding: 10px;
          flex: 1;
          overflow-y: auto;
        }
        
        .funnel-card {
          position: relative;
          padding: 10px;
          margin-bottom: 10px;
          background-color: #2a2a2a;
          border-radius: 6px;
          border-left: 3px solid;
          cursor: grab;
          user-select: none;
          touch-action: none;
        }
        
        .funnel-card:active {
          cursor: grabbing;
        }
        
        .drag-overlay .funnel-card {
          transform: scale(1.05);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          cursor: grabbing;
        }
        
        .drop-target-active {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        /* Assicurati che il pulsante di modifica non interferisca con il drag */
        .edit-btn {
          cursor: pointer;
          z-index: 10;
        }
      `}</style>

      {/* Facebook Event Modal for Lead Movement */}
      {movingLead && (
        <FacebookEventModal
          lead={movingLead.lead}
          previousStatus={movingLead.prevStatus}
          onClose={handleUndoMove}
          onSave={handleConfirmMove}
          onUndo={handleUndoMove}
        />
      )}

      {/* Value Editing Modal */}
      {editingLead && (
        <ValueModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={handleSaveLeadValue}
        />
      )}
    </DndContext>
  );
}

// Helper function to get border color
function getBorderColor(status: string): string {
  switch (status) {
    case "new": return "#71717a"; // zinc-500
    case "contacted": return "#3498db"; // info
    case "qualified": return "#FF6B00"; // primary
    case "opportunity": return "#e67e22"; // warning
    case "proposal": return "#FF8C38"; // primary-hover
    case "customer": return "#27ae60"; // success
    case "lost": return "#e74c3c"; // danger
    default: return "#71717a"; // zinc-500
  }
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

// Helper function to format money
function formatMoney(value: number): string {
  return value.toLocaleString('it-IT');
}