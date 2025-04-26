// components/sales-funnel/CustomFunnelBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";

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
  const [draggedLead, setDraggedLead] = useState<FunnelItem | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Ref per tenere traccia dell'elemento trascinato
  const dragElementRef = useRef<{
    element: HTMLElement | null;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    lead: FunnelItem | null;
    startStatus: string | null;
  }>({
    element: null,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
    lead: null,
    startStatus: null
  });

  // Aggiungi gli event listener quando il componente viene montato
  useEffect(() => {
    // Prepara i card per il drag and drop
    setupCards();
    
    // Re-prepara i card quando cambiano i dati
    return () => {
      // Cleanup se necessario
    };
  }, [funnelData]);
  
  // Configura i card per il drag and drop
  const setupCards = () => {
    const cards = document.querySelectorAll('.funnel-card');
    
    cards.forEach(card => {
      const element = card as HTMLElement;
      
      // Aggiungi gli eventi per il drag and drop
      element.onmousedown = handleMouseDown;
      element.ontouchstart = handleTouchStart;
      
      // Assicurati che il card sia draggable
      element.draggable = false; // Disabilita il comportamento draggable nativo del browser
      element.style.touchAction = 'none'; // Previene lo scrolling su touch device
      element.style.userSelect = 'none'; // Previene la selezione del testo
    });
  };
  
  // Handle per l'inizio del drag con mouse
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // Solo click sinistro
    
    const target = e.currentTarget as HTMLElement;
    const leadId = target.getAttribute('data-id');
    if (!leadId) return;
    
    // Trova il lead corrispondente
    let leadItem: FunnelItem | undefined;
    let leadStatus: string | null = null;
    
    // Cerca il lead in tutte le colonne
    for (const column of COLUMNS) {
      const columnId = column.id as keyof FunnelData;
      const found = funnelData[columnId].find(item => item._id === leadId);
      if (found) {
        leadItem = found;
        leadStatus = column.id;
        break;
      }
    }
    
    if (!leadItem) return;
    
    // Previeni il comportamento di default
    e.preventDefault();
    
    // Inizia il drag
    startDrag(target, e.clientX, e.clientY, leadItem, leadStatus);
    
    // Aggiungi listener globali per il movimento e il rilascio
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle per l'inizio del drag con touch
  const handleTouchStart = (e: TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const leadId = target.getAttribute('data-id');
    if (!leadId) return;
    
    // Trova il lead corrispondente
    let leadItem: FunnelItem | undefined;
    let leadStatus: string | null = null;
    
    // Cerca il lead in tutte le colonne
    for (const column of COLUMNS) {
      const columnId = column.id as keyof FunnelData;
      const found = funnelData[columnId].find(item => item._id === leadId);
      if (found) {
        leadItem = found;
        leadStatus = column.id;
        break;
      }
    }
    
    if (!leadItem) return;
    
    // Previeni il comportamento di default
    e.preventDefault();
    
    // Usa il primo touch point
    const touch = e.touches[0];
    
    // Inizia il drag
    startDrag(target, touch.clientX, touch.clientY, leadItem, leadStatus);
    
    // Aggiungi listener globali per il movimento e il rilascio
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  // Inizia il processo di drag
  const startDrag = (element: HTMLElement, clientX: number, clientY: number, lead: FunnelItem, status: string | null) => {
    // Calcola l'offset del mouse rispetto all'elemento
    const rect = element.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    
    // Memorizza i dati iniziali
    dragElementRef.current = {
      element,
      offsetX,
      offsetY,
      startX: clientX,
      startY: clientY,
      lead,
      startStatus: status
    };
    
    // Applica stile durante il trascinamento
    element.style.position = 'absolute';
    element.style.zIndex = '1000';
    element.style.transform = 'scale(1.05)';
    element.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
    element.style.opacity = '0.8';
    
    // Aggiorna lo stato
    setDraggedLead(lead);
    
    // Posiziona l'elemento
    moveAt(clientX, clientY);
  };
  
  // Muove l'elemento alla posizione del cursore
  const moveAt = (clientX: number, clientY: number) => {
    if (!dragElementRef.current.element) return;
    
    const element = dragElementRef.current.element;
    const { offsetX, offsetY } = dragElementRef.current;
    
    // Calcola la nuova posizione
    const left = clientX - offsetX;
    const top = clientY - offsetY;
    
    // Applica la nuova posizione
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
  };
  
  // Gestisce il movimento del mouse durante il drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragElementRef.current.element) return;
    
    // Muovi l'elemento
    moveAt(e.clientX, e.clientY);
    
    // Rileva la colonna sotto il cursore
    updateTargetColumn(e.clientX, e.clientY);
  };
  
  // Gestisce il movimento del touch durante il drag
  const handleTouchMove = (e: TouchEvent) => {
    if (!dragElementRef.current.element) return;
    
    // Previeni lo scrolling
    e.preventDefault();
    
    // Usa il primo touch point
    const touch = e.touches[0];
    
    // Muovi l'elemento
    moveAt(touch.clientX, touch.clientY);
    
    // Rileva la colonna sotto il cursore
    updateTargetColumn(touch.clientX, touch.clientY);
  };
  
  // Aggiorna la colonna target in base alla posizione
  const updateTargetColumn = (clientX: number, clientY: number) => {
    // Ottieni tutte le colonne
    const columns = document.querySelectorAll('.funnel-column');
    let newTarget: string | null = null;
    
    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      if (
        clientX >= rect.left && 
        clientX <= rect.right && 
        clientY >= rect.top && 
        clientY <= rect.bottom
      ) {
        newTarget = (column as HTMLElement).id;
      }
    });
    
    // Aggiorna la colonna target se cambiata
    if (newTarget !== targetColumn) {
      setTargetColumn(newTarget);
    }
  };
  
  // Gestisce il rilascio del mouse
  const handleMouseUp = () => {
    finishDrag();
    
    // Rimuovi i listener globali
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Gestisce il rilascio del touch
  const handleTouchEnd = () => {
    finishDrag();
    
    // Rimuovi i listener globali
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
  
  // Termina il processo di drag
  const finishDrag = () => {
    const { element, lead, startStatus } = dragElementRef.current;
    
    if (!element || !lead) return;
    
    // Ripristina lo stile dell'elemento
    element.style.position = '';
    element.style.zIndex = '';
    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.opacity = '';
    element.style.left = '';
    element.style.top = '';
    
    // Completa il drag solo se abbiamo una colonna target valida
    if (targetColumn && startStatus !== targetColumn) {
      handleMoveLead(lead, targetColumn);
    }
    
    // Reset dello stato
    setDraggedLead(null);
    setTargetColumn(null);
    
    // Reset del riferimento
    dragElementRef.current = {
      element: null,
      offsetX: 0,
      offsetY: 0,
      startX: 0,
      startY: 0,
      lead: null,
      startStatus: null
    };
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

  return (
    <>
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
                targetColumn === column.id ? 'drop-target-active' : ''
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
                    <div 
                      key={lead._id}
                      className="funnel-card"
                      data-id={lead._id}
                      style={{
                        borderLeftColor: getBorderColor(lead.status),
                        opacity: draggedLead?._id === lead._id ? 0.5 : 1
                      }}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-sm truncate pr-1">
                          {lead.name}
                        </div>
                        <button 
                          className="p-1 rounded-full hover:bg-zinc-700 transition-colors edit-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // Importante per evitare conflitti con Draggable
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
    </>
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