// components/sales-funnel/FunnelBoard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";

// Importazioni react-dnd
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isTouchDevice } from "@/lib/utils/device";
import CustomDragLayer from "./CustomDragLayer";

// Tipi per react-dnd
type DragItem = {
  lead: FunnelItem;
};

type DropResult = {
  status: string;
};

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

// Rilevazione backend condizionale con opzioni migliorate
const getDndBackend = () => {
  if (isTouchDevice()) {
    return {
      backend: TouchBackend,
      options: {
        enableMouseEvents: true, // Supporto per eventi mouse su touch device
        delayTouchStart: 200, // Ritardo aumentato per evitare conflitti con lo scroll
        enableTouchEvents: true, // Assicurati che gli eventi touch siano abilitati
        touchSlop: 20, // Soglia di movimento prima che inizi il drag
      }
    };
  }
  return { backend: HTML5Backend, options: {} };
};

interface CustomFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
}

// Componente Principale
export default function CustomFunnelBoard({ funnelData, setFunnelData, onLeadMove }: CustomFunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);
  
  // Ref per il contenitore principale
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Otteniamo il backend e le opzioni
  const { backend, options } = getDndBackend();
  
  // Hook per configurare l'autoscroll
  useEffect(() => {
    // Otteniamo l'elemento container
    const container = boardRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Registriamo lo scroll per debug
      if (container.scrollLeft === 0) {
        console.log("Container scrolled to start");
      } else if (container.scrollLeft + container.clientWidth >= container.scrollWidth) {
        console.log("Container scrolled to end");
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  // Componente Lead Card
  const LeadCard = useCallback(({ lead }: { lead: FunnelItem }) => {
    // Utilizziamo la tipizzazione corretta per useDrag e un ref separato
    const cardRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, dragRef] = useDrag<DragItem, DropResult, { isDragging: boolean }>({
      type: 'LEAD',
      item: { lead },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    });
    
    // Colleghiamo il ref al connettore di drag
    useEffect(() => {
      if (cardRef.current) {
        dragRef(cardRef.current);
      }
    }, [dragRef]);

    return (
      <div
        ref={cardRef}
        className={`funnel-card ${isDragging ? 'opacity-50' : ''}`}
        style={{
          borderLeftColor: getBorderColor(lead.status),
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
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
  }, []);

  // Componente per la colonna
  const FunnelColumn = useCallback(({ id, title, color, leads }: { id: string; title: string; color: string; leads: FunnelItem[] }) => {
    // Utilizziamo un ref separato e useDrop
    const columnBodyRef = useRef<HTMLDivElement>(null);
    const [{ isOver }, dropRef] = useDrop<DragItem, DropResult, { isOver: boolean }>({
      accept: 'LEAD',
      drop: (item) => {
        handleMoveLead(item.lead, id);
        return { status: id };
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
      hover: (item, monitor) => {
        if (!boardRef.current) return;
        
        // Ottieni la posizione del mouse
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        
        // Ottieni le dimensioni del contenitore
        const containerRect = boardRef.current.getBoundingClientRect();
        const containerScrollLeft = boardRef.current.scrollLeft;
        const containerWidth = boardRef.current.clientWidth;
        const containerScrollWidth = boardRef.current.scrollWidth;
        
        // Definisci le zone di autoscroll (20% di ciascun lato)
        const scrollZoneSize = Math.min(150, containerWidth * 0.4);
        
        // Calcola le posizioni delle zone di scroll
        const leftEdge = containerRect.left;
        const rightEdge = containerRect.right;
        const leftScrollZone = leftEdge + scrollZoneSize;
        const rightScrollZone = rightEdge - scrollZoneSize;
        
        // Funzione per calcolare la velocità di scroll
        const calculateScrollSpeed = (distance: number, maxDistance: number) => {
          return Math.max(20, Math.round(50 * (1 - distance / maxDistance)));
        };
        
        // Se il mouse è nella zona sinistra e possiamo scrollare a sinistra
        if (clientOffset.x < leftScrollZone && containerScrollLeft > 0) {
          const distance = clientOffset.x - leftEdge;
          const speed = calculateScrollSpeed(distance, scrollZoneSize);
          boardRef.current.scrollBy({ left: -speed, behavior: 'auto' });
        }
        // Se il mouse è nella zona destra e possiamo scrollare a destra
        else if (clientOffset.x > rightScrollZone && 
                containerScrollLeft < containerScrollWidth - containerWidth) {
          const distance = rightEdge - clientOffset.x;
          const speed = calculateScrollSpeed(distance, scrollZoneSize);
          boardRef.current.scrollBy({ left: speed, behavior: 'auto' });
        }
      }
    });
    
    // Colleghiamo il ref al connettore di drop
    useEffect(() => {
      if (columnBodyRef.current) {
        dropRef(columnBodyRef.current);
      }
    }, [dropRef]);

    return (
      <div 
        className={`funnel-column ${isMoving ? 'column-fade-transition' : ''}`}
      >
        <div className={`funnel-header ${color}`}>
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
            {leads.length}
          </div>
        </div>
        
        <div
          ref={columnBodyRef}
          className={`funnel-body ${isOver ? 'drop-target-active' : ''}`}
        >
          {leads.length > 0 ? (
            leads.map((lead) => (
              <LeadCard key={lead._id} lead={lead} />
            ))
          ) : (
            <div className="text-center text-zinc-500 text-xs italic py-4">
              Nessun lead
            </div>
          )}
        </div>
      </div>
    );
  }, [isMoving, LeadCard, handleMoveLead]);

  return (
    <DndProvider backend={backend} options={options}>
      {/* Aggiungiamo il nostro custom drag layer per una migliore esperienza visiva */}
      <CustomDragLayer />
      
      <div
        ref={boardRef}
        className="funnel-board-container w-full overflow-x-auto"
        id="funnel-board-container"
      >
        <div className="funnel-board min-w-max flex gap-4 p-2">
          {COLUMNS.map((column) => (
            <FunnelColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              leads={funnelData[column.id as keyof FunnelData]}
            />
          ))}
        </div>
      </div>

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
    </DndProvider>
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