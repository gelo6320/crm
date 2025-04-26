// components/sales-funnel/CustomFunnelBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import FunnelCard from "./FunnelCard";

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
  
  // Drag state
  const [draggedLead, setDraggedLead] = useState<FunnelItem | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{ status: string, x: number, y: number } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number, y: number } | null>(null);
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const draggedLeadRef = useRef<FunnelItem | null>(null);
  const dragOriginRef = useRef<{ status: string, x: number, y: number } | null>(null);
  const dragPositionRef = useRef<{ x: number, y: number } | null>(null);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      cleanupAutoScroll();
    };
  }, []);

  const updateDragPreviewPosition = (clientX: number, clientY: number): void => {
    if (!dragItemRef.current || !dragOrigin) return;
    
    const left = clientX - dragOrigin.x;
    const top = clientY - dragOrigin.y;
    
    dragItemRef.current.style.left = `${left}px`;
    dragItemRef.current.style.top = `${top}px`;
    dragItemRef.current.style.borderLeftColor = draggedLead ? getBorderColor(draggedLead.status) : '';
  };
  
  // Start dragging a lead
  const handleDragStart = (lead: FunnelItem, e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): void => {
    // Prevent default browser drag behavior
    e.preventDefault();
    
    console.log(`[DRAG DEBUG] 🟢 Iniziando drag per lead: ${lead.name} (${lead._id})`);
    
    // Store the lead being dragged in both state and ref
    setDraggedLead(lead);
    draggedLeadRef.current = lead;
    
    // Get client coordinates based on event type
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      console.log(`[DRAG DEBUG] 📱 Evento touch - Coordinate: (${clientX}, ${clientY})`);
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
      console.log(`[DRAG DEBUG] 🖱️ Evento mouse - Coordinate: (${clientX}, ${clientY})`);
    }
    
    // Store drag origin in both state and ref
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const originX = clientX - rect.left;
    const originY = clientY - rect.top;
    
    console.log(`[DRAG DEBUG] 📌 Origine drag - Offset relativo al card: (${originX}, ${originY})`);
    console.log(`[DRAG DEBUG] 📐 Dimensioni card: ${rect.width}x${rect.height}, Posizione: (${rect.left}, ${rect.top})`);
    
    const originData = {
      status: lead.status,
      x: originX,
      y: originY
    };
    
    setDragOrigin(originData);
    dragOriginRef.current = originData;
    
    // Set initial drag position in both state and ref
    const positionData = { x: clientX, y: clientY };
    setDragPosition(positionData);
    dragPositionRef.current = positionData;
    
    console.log(`[DRAG DEBUG] 🎯 Posizione drag iniziale impostata: (${clientX}, ${clientY})`);
    
    // Add event listeners for drag motion and end
    if ('touches' in e) {
      // Touch events are handled within the component stesso
      console.log(`[DRAG DEBUG] 👆 Eventi touch saranno gestiti dai listener del componente`);
    } else {
      // Mouse events
      console.log(`[DRAG DEBUG] 🔄 Aggiungendo listener globali per mousemove e mouseup`);
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
    
    // Inizializza il preview drag prima che inizi il movimento
    if (dragItemRef.current) {
      console.log(`[DRAG DEBUG] 🖼️ Mostrando il preview del drag`);
      
      // Imposta il contenuto del preview
      dragItemRef.current.innerHTML = `
        <div class="flex justify-between items-center mb-1">
          <div class="font-medium text-sm truncate pr-1">
            ${lead.name}
          </div>
          <button class="p-1 rounded-full hover:bg-zinc-700 transition-colors">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
        </div>
        <div class="text-xs text-zinc-400">
          <div>${formatDate(lead.createdAt)}</div>
          ${lead.value ? `<div class="text-primary font-medium my-1">€${formatMoney(lead.value)}</div>` : ''}
          ${lead.service ? `<div class="italic">${lead.service}</div>` : ''}
        </div>
      `;
      
      // Imposta la posizione iniziale corretta
      const left = clientX - originX;
      const top = clientY - originY;
      
      dragItemRef.current.style.left = `${left}px`;
      dragItemRef.current.style.top = `${top}px`;
      dragItemRef.current.style.borderLeftColor = getBorderColor(lead.status);
      dragItemRef.current.style.display = 'block';
      
      // Log per vedere le proprietà CSS del preview
      const computedStyle = window.getComputedStyle(dragItemRef.current);
      console.log(`[DRAG DEBUG] 🎨 Stile preview - Position: ${computedStyle.position}, Z-Index: ${computedStyle.zIndex}, Display: ${computedStyle.display}`);
      console.log(`[DRAG DEBUG] 📍 Posizione iniziale del preview: left=${left}px, top=${top}px`);
    } else {
      console.error(`[DRAG DEBUG] ❌ ERRORE: dragItemRef.current è null!`);
    }
  };
  
  // Handle drag movement
  const handleDragMove = (e: MouseEvent): void => {
    // Usa le ref per un accesso immediato invece degli stati
    if (!draggedLeadRef.current || !dragOriginRef.current) {
      return;
    }
    
    // Update drag position state e ref (minimizzando gli aggiornamenti di stato)
    const positionData = { x: e.clientX, y: e.clientY };
    dragPositionRef.current = positionData;
    
    // Aggiorna direttamente la posizione del preview DOM senza passare per lo stato React
    if (dragItemRef.current) {
      const left = e.clientX - dragOriginRef.current.x;
      const top = e.clientY - dragOriginRef.current.y;
      
      dragItemRef.current.style.left = `${left}px`;
      dragItemRef.current.style.top = `${top}px`;
    }
    
    // Throttling del rilevamento della colonna (esegui solo ogni 5 pixel di movimento)
    const lastPos = dragPositionRef.current;
    const lastTarget = targetColumn;
    
    // Calcola la distanza dal precedente rilevamento
    const distance = lastPos ? Math.sqrt(
      Math.pow(positionData.x - lastPos.x, 2) + 
      Math.pow(positionData.y - lastPos.y, 2)
    ) : Infinity;
    
    // Ottimizzazione: rileva la colonna target solo se ci siamo spostati abbastanza
    // o se non abbiamo ancora un target
    if (distance > 10 || !lastTarget) {
      // Update target column - versione più leggera
      const newTargetColumn = detectTargetColumn(e.clientX, e.clientY);
      if (newTargetColumn !== targetColumn) {
        setTargetColumn(newTargetColumn);
      }
    }
    
    // Aggiorniamo lo stato solo alla fine per ridurre i re-render
    setDragPosition(positionData);
    
    // Handle auto-scrolling
    handleAutoScroll(e.clientX);
  };

  let funnelColumnsCache: NodeListOf<Element> | null = null;

  const detectTargetColumn = (clientX: number, clientY: number): string | null => {
    // Memorizza il risultato delle query DOM
    if (!funnelColumnsCache) {
      funnelColumnsCache = document.querySelectorAll('.funnel-column');
    }
    
    const columns = funnelColumnsCache;
    let foundColumn: Element | null = null;
    
    // Controllo rapido solo su X prima di fare il controllo completo
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const rect = column.getBoundingClientRect();
      
      if (clientX >= rect.left && clientX <= rect.right) {
        // Controllo completo solo se l'X è già dentro
        if (clientY >= rect.top && clientY <= rect.bottom) {
          foundColumn = column;
          break;
        }
      }
    }
    
    return foundColumn ? (foundColumn as HTMLElement).id : null;
  };
  
  // Handler for touch move events
  // Handler per eventi touch
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    // Usa le ref per un accesso immediato invece degli stati
    if (!draggedLeadRef.current || !dragOriginRef.current) {
      console.log(`[DRAG DEBUG] ❌ handleTouchMove chiamato ma draggedLeadRef o dragOriginRef è null`);
      return;
    }
    
    // Prevent default to disable page scrolling while dragging
    e.preventDefault();
    
    const touch = e.touches[0];
    console.log(`[DRAG DEBUG] 👆 Touch in movimento - Coordinate: (${touch.clientX}, ${touch.clientY})`);
    
    // Update drag position state and ref
    const positionData = { x: touch.clientX, y: touch.clientY };
    setDragPosition(positionData);
    dragPositionRef.current = positionData;
    
    // Aggiorna direttamente la posizione del preview DOM
    if (dragItemRef.current) {
      const left = touch.clientX - dragOriginRef.current.x;
      const top = touch.clientY - dragOriginRef.current.y;
      
      dragItemRef.current.style.left = `${left}px`;
      dragItemRef.current.style.top = `${top}px`;
      
      console.log(`[DRAG DEBUG] 📍 Aggiornata posizione preview (touch): left=${left}px, top=${top}px`);
    } else {
      console.log(`[DRAG DEBUG] ❌ dragItemRef.current è null durante il movimento touch!`);
    }
    
    // Check which column we're over
    const columns = document.querySelectorAll('.funnel-column');
    let hoveredColumn: Element | null = null;
    
    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right) {
        hoveredColumn = column;
      }
    });
    
    // Update target column
    const newTargetColumn = detectTargetColumn(touch.clientX, touch.clientY);
    if (newTargetColumn !== targetColumn) {
      console.log(`[DRAG DEBUG] 🎯 Cambiato target column (touch): ${targetColumn} -> ${newTargetColumn}`);
      setTargetColumn(newTargetColumn);
    }
    
    // Handle auto-scrolling
    handleAutoScroll(touch.clientX);
  };

  const SCROLL_ZONE_SIZE = 25; // 25% su ciascun lato
  const SCROLL_SPEED = 15;
  
  // Handle auto-scrolling when dragging near the edges
  const handleAutoScroll = (clientX: number) => {
    if (!boardRef.current) return;
    
    // Ferma qualsiasi scroll precedente
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    
    // Calcola le zone di scroll (percentuale della larghezza del viewport)
    const leftScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    const rightScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    
    // Limiti delle zone di scroll
    const leftScrollZone = boardRect.left + leftScrollZoneWidth;
    const rightScrollZone = boardRect.right - rightScrollZoneWidth;
    
    // Determina se dobbiamo fare scroll e in quale direzione
    if (clientX < leftScrollZone) {
      // Scroll verso sinistra a velocità costante
      scrollIntervalRef.current = setInterval(() => {
        board.scrollLeft -= SCROLL_SPEED;
      }, 16); // Circa 60fps
    } else if (clientX > rightScrollZone) {
      // Scroll verso destra a velocità costante
      scrollIntervalRef.current = setInterval(() => {
        board.scrollLeft += SCROLL_SPEED;
      }, 16); // Circa 60fps
    }
  };
  
  // Non dimenticare di pulire l'intervallo quando il drag termina
  const cleanupAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };
  
  // End dragging
  const handleDragEnd = (e: MouseEvent): void => {
    console.log(`[DRAG DEBUG] 🛑 Fine drag (mouse) - Coordinate: (${e.clientX}, ${e.clientY})`);
    
    // Cleanup autoscroll
    cleanupAutoScroll();
    
    // Controllo finale della colonna al rilascio
    const finalTargetColumn = detectTargetColumn(e.clientX, e.clientY);
    if (finalTargetColumn && finalTargetColumn !== targetColumn) {
      console.log(`[DRAG DEBUG] 🎯 Colonna target finale aggiornata: ${targetColumn} -> ${finalTargetColumn}`);
      setTargetColumn(finalTargetColumn);
    }
    
    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Registra la posizione finale del drag preview prima della pulizia
    if (dragItemRef.current) {
      const rect = dragItemRef.current.getBoundingClientRect();
      console.log(`[DRAG DEBUG] 📏 Posizione finale preview prima della pulizia: (${rect.left}, ${rect.top})`);
    }
    
    endDrag(finalTargetColumn || targetColumn);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>): void => {
    console.log(`[DRAG DEBUG] 🛑 Fine drag (touch)`);
    
    // Cleanup autoscroll
    cleanupAutoScroll();
    
    // Registra la posizione finale del drag preview prima della pulizia
    if (dragItemRef.current) {
      const rect = dragItemRef.current.getBoundingClientRect();
      console.log(`[DRAG DEBUG] 📏 Posizione finale preview prima della pulizia (touch): (${rect.left}, ${rect.top})`);
    }
    
    endDrag();
  };
  
  // Common end drag logic
  const endDrag = (finalTargetColumn?: string | null): void => {
    // Usa la colonna passata, altrimenti usa targetColumn
    const effectiveTargetColumn = finalTargetColumn || targetColumn;
    console.log(`[DRAG DEBUG] 🧹 Esecuzione pulizia drag comune`);
    
    // Ferma lo scroll automatico
    cleanupAutoScroll();  
    
    // Handle the drop if over a valid column
    if (draggedLeadRef.current && effectiveTargetColumn) {
      if (effectiveTargetColumn !== draggedLeadRef.current.status) {
        console.log(`[DRAG DEBUG] ✅ Drop completato - Spostamento lead da ${draggedLeadRef.current.status} a ${effectiveTargetColumn}`);
        handleMoveLead(draggedLeadRef.current, effectiveTargetColumn);
      } else {
        console.log(`[DRAG DEBUG] ℹ️ Drop nella stessa colonna (${effectiveTargetColumn}) - Nessun'azione`);
      }
    } else {
      console.log(`[DRAG DEBUG] ⚠️ Drop non valido - draggedLeadRef: ${!!draggedLeadRef.current}, targetColumn: ${effectiveTargetColumn}`);
    }
    
    // Hide the drag preview
    if (dragItemRef.current) {
      console.log(`[DRAG DEBUG] 🖼️ Nascondendo preview`);
      dragItemRef.current.style.display = 'none';
      
      // Verifica che sia effettivamente nascosto
      setTimeout(() => {
        if (dragItemRef.current) {
          const displayStyle = window.getComputedStyle(dragItemRef.current).display;
          console.log(`[DRAG DEBUG] 👁️ Display dello stile del preview dopo nasconderlo: ${displayStyle}`);
        }
      }, 0);
    } else {
      console.log(`[DRAG DEBUG] ❌ dragItemRef.current è null durante la pulizia`);
    }
    
    console.log(`[DRAG DEBUG] 🗑️ Reset degli stati di drag`);
    // Reset drag state e anche le ref
    setDraggedLead(null);
    draggedLeadRef.current = null;
    
    setDragOrigin(null);
    dragOriginRef.current = null;
    
    setDragPosition(null);
    dragPositionRef.current = null;
    
    setTargetColumn(null);
  };

  // Handle lead movement between columns
  const handleMoveLead = (lead: FunnelItem, targetStatus: string) => {
    if (lead.status === targetStatus) return;

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
  
  // Drag preview style
  const getDragPreviewStyle = () => {
    if (!dragPosition || !dragOrigin) {
      console.log(`[DRAG DEBUG] ❌ getDragPreviewStyle chiamato ma dragPosition o dragOrigin è null`);
      return { display: 'none' };
    }
    
    const left = dragPosition.x - dragOrigin.x;
    const top = dragPosition.y - dragOrigin.y;
    
    console.log(`[DRAG DEBUG] 🎨 Creando stile per preview - Position: (${left}, ${top})`);
    console.log(`[DRAG DEBUG] 📊 Dati usati: dragPosition=(${dragPosition.x}, ${dragPosition.y}), dragOrigin=(${dragOrigin.x}, ${dragOrigin.y})`);
    
    const style = {
      display: 'block',
      position: 'fixed' as 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      opacity: 0.8,
      zIndex: 1000,
      pointerEvents: 'none' as 'none',
      transform: 'rotate(4deg)',
      width: '250px',
    };
    
    console.log(`[DRAG DEBUG] 🖌️ Stile finale preview:`, style);
    
    return style;
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
                    <FunnelCard
                      key={lead._id}
                      lead={lead}
                      onEdit={handleEditLead}
                      onDragStart={handleDragStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      isDragging={draggedLead?._id === lead._id}
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

      {/* Drag preview - sempre presente ma nascosto di default */}
      <div 
        ref={dragItemRef}
        className="funnel-card drag-preview"
        style={{ 
          display: 'none',
          position: 'fixed',
          left: '0px',
          top: '0px',
          opacity: 0.8,
          zIndex: 1000,
          pointerEvents: 'none',
          transform: 'rotate(4deg)',
          width: '250px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Contenuto vuoto che verrà popolato dinamicamente */}
      </div>
      
      {/* CSS extra per il debugging */}
      <style jsx global>{`
        .drag-preview {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          cursor: grabbing !important;
          transform: rotate(4deg);
          transition: none !important;
          animation: none !important;
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