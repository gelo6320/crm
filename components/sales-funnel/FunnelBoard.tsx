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

// Rilevazione backup condizionale
const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;
const touchBackendOptions = {
  enableMouseEvents: true, // Consente di usare mouse su dispositivi touch
  delayTouchStart: 100, // Piccolo ritardo per evitare conflitti con lo scrolling
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

  // Componente draggable
  const LeadCard = ({ lead }: { lead: FunnelItem }) => {
    // Utilizzo di ref standard
    const cardRef = useRef<HTMLDivElement>(null);
    
    // useDrag con collezione
    const [{ isDragging }, connectDrag] = useDrag(
      () => ({
        type: 'LEAD',
        item: { lead },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
        end: (item, monitor) => {
          // Gestisce il caso in cui il drag termina senza un drop
          if (!monitor.didDrop()) {
            console.log('Drag terminated without drop');
          }
        }
      }),
      [lead]
    );
    
    // Colleghiamo il ref con il connettore tramite useEffect
    useEffect(() => {
      if (cardRef.current) {
        connectDrag(cardRef.current);
      }
    }, [connectDrag]);

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
  };

  // Componente per la colonna
  const FunnelColumn = ({ id, title, color, leads }: { id: string; title: string; color: string; leads: FunnelItem[] }) => {
    // Utilizziamo lo state per tracciare se siamo in hover
    const [isOverState, setIsOver] = useState(false);
    
    // Utilizzo di ref standard per il corpo della colonna
    const bodyRef = useRef<HTMLDivElement>(null);
    
    // Funzione per autoscroll che viene richiamata durante l'hover
    const handleAutoScroll = useCallback((clientX: number) => {
      if (!boardRef.current) return;
      
      // Ottenimento delle dimensioni del contenitore
      const containerRect = boardRef.current.getBoundingClientRect();
      const containerScrollLeft = boardRef.current.scrollLeft;
      const containerWidth = boardRef.current.clientWidth;
      const containerScrollWidth = boardRef.current.scrollWidth;
      
      // Definizione delle zone di autoscroll (20% di ciascun lato)
      const scrollZoneSize = Math.min(150, containerWidth * 0.2);
      
      // Calcolo delle posizioni delle zone di scroll relative al container
      const leftScrollZone = containerRect.left + scrollZoneSize;
      const rightScrollZone = containerRect.right - scrollZoneSize;
      
      // Calcolo della velocità di scroll in base alla distanza dal bordo
      const calculateScrollSpeed = (distance: number, maxDistance: number) => {
        const baseSpeed = 5;
        const maxSpeed = 20;
        const ratio = 1 - Math.min(1, Math.max(0, distance / maxDistance));
        return Math.round(baseSpeed + ((maxSpeed - baseSpeed) * ratio));
      };
      
      // Scroll a sinistra se siamo nella zona sinistra
      if (clientX < leftScrollZone) {
        const distance = clientX - containerRect.left;
        const scrollSpeed = calculateScrollSpeed(distance, scrollZoneSize);
        
        // Controllo se possiamo scrollare ulteriormente a sinistra
        if (containerScrollLeft > 0) {
          boardRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
          return true; // Abbiamo fatto scroll
        }
      }
      // Scroll a destra se siamo nella zona destra
      else if (clientX > rightScrollZone) {
        const distance = containerRect.right - clientX;
        const scrollSpeed = calculateScrollSpeed(distance, scrollZoneSize);
        
        // Controllo se possiamo scrollare ulteriormente a destra
        if (containerScrollLeft < containerScrollWidth - containerWidth) {
          boardRef.current.scrollBy({ left: scrollSpeed, behavior: 'auto' });
          return true; // Abbiamo fatto scroll
        }
      }
      
      return false; // Non abbiamo fatto scroll
    }, []);
    
    // useDrop con collezione
    const [{ isOver }, connectDrop] = useDrop(
      () => ({
        accept: 'LEAD',
        drop: (item: { lead: FunnelItem }) => {
          handleMoveLead(item.lead, id);
          return { status: id };
        },
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
        }),
        hover: (item, monitor) => {
          if (!boardRef.current) return;
          
          // Aggiorniamo lo stato isOver
          if (!isOverState && monitor.isOver()) {
            setIsOver(true);
          } else if (isOverState && !monitor.isOver()) {
            setIsOver(false);
          }
          
          // Ottenimento della posizione del mouse
          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;
          
          // Gestiamo l'autoscroll
          if (handleAutoScroll(clientOffset.x)) {
            // Se abbiamo fatto scroll, richiediamo un altro frame per continuare
            requestAnimationFrame(() => {
              const newOffset = monitor.getClientOffset();
              if (newOffset) {
                handleAutoScroll(newOffset.x);
              }
            });
          }
        },
      }),
      [id, isOverState, handleAutoScroll]
    );
    
    // Colleghiamo il ref con il connettore tramite useEffect
    useEffect(() => {
      if (bodyRef.current) {
        connectDrop(bodyRef.current);
      }
    }, [connectDrop]);

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
          ref={bodyRef}
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
  };

  return (
    <DndProvider
      backend={DndBackend}
      options={isTouchDevice() ? touchBackendOptions : undefined}
    >
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