// components/sales-funnel/CustomFunnelBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import FunnelCard from "./FunnelCard";
import Script from "next/script";

// Definiamo il tipo per GSAP e Draggable
declare global {
  interface Window {
    gsap: any;
    Draggable: any;
  }
}

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
  const gsapLoaded = useRef(false);
  const draggableInstances = useRef<Map<string, any>>(new Map());
  
  // Ref per tenere traccia dell'attuale lead trascinato
  const currentDragInfo = useRef<{
    lead: FunnelItem | null;
    element: HTMLElement | null;
    startStatus: string | null;
  }>({
    lead: null,
    element: null,
    startStatus: null
  });

  // Effetto per caricare GSAP e configurare i Draggable dopo che il componente è montato
  useEffect(() => {
    // Verifica se GSAP è già caricato globalmente
    if (window.gsap && window.Draggable) {
      gsapLoaded.current = true;
      initializeDraggables();
    }
    
    return () => {
      // Pulizia dei draggables quando il componente viene smontato
      if (gsapLoaded.current) {
        draggableInstances.current.forEach(instance => {
          if (instance && instance.kill) {
            instance.kill();
          }
        });
        draggableInstances.current.clear();
      }
    };
  }, [funnelData]);

  // Funzione per inizializzare i Draggable per ogni lead
  const initializeDraggables = () => {
    if (!window.Draggable || !window.gsap) {
      console.error("GSAP e/o Draggable non sono disponibili");
      return;
    }
    
    // Pulizia dei draggable esistenti
    draggableInstances.current.forEach(instance => {
      if (instance && instance.kill) {
        instance.kill();
      }
    });
    draggableInstances.current.clear();
    
    // Crea nuovi draggable per ogni lead
    const cards = document.querySelectorAll('.funnel-card:not(.drag-preview)');
    
    cards.forEach(card => {
      const id = card.getAttribute('data-id');
      if (!id) return;
      
      // Trova il lead corrispondente
      let leadItem: FunnelItem | undefined;
      
      // Cerca il lead in tutte le colonne
      for (const column of COLUMNS) {
        const columnId = column.id as keyof FunnelData;
        const found = funnelData[columnId].find(item => item._id === id);
        if (found) {
          leadItem = found;
          break;
        }
      }
      
      if (!leadItem) return;
      
      // Crea il Draggable
      const draggable = window.Draggable.create(card, {
        type: "x,y",
        autoScroll: 1, // Abilita l'autoscroll con velocità normale
        edgeResistance: 0.65,
        zIndexBoost: true,
        dragClickables: false,
        onDragStart: function(this: any) {
          // Salva l'informazione sul lead trascinato
          currentDragInfo.current = {
            lead: leadItem,
            element: this.target,
            startStatus: leadItem?.status || null
          };
          
          setDraggedLead(leadItem);
          
          // Aggiungi classe per lo stile durante il drag
          this.target.classList.add('dragging');
          
          console.log(`[DRAG DEBUG] 🟢 Iniziando drag per lead: ${leadItem.name} (${leadItem._id})`);
        },
        onDrag: function(this: any) {
          // Determina la colonna target
          const columns = document.querySelectorAll('.funnel-column');
          const cardRect = this.target.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const cardCenterY = cardRect.top + cardRect.height / 2;
          
          let hoveredColumn: Element | null = null;
          
          columns.forEach(column => {
            const rect = column.getBoundingClientRect();
            if (
              cardCenterX >= rect.left && 
              cardCenterX <= rect.right && 
              cardCenterY >= rect.top && 
              cardCenterY <= rect.bottom
            ) {
              hoveredColumn = column;
            }
          });
          
          const newTargetColumn = hoveredColumn ? (hoveredColumn as HTMLElement).id : null;
          
          if (newTargetColumn !== targetColumn) {
            console.log(`[DRAG DEBUG] 🎯 Cambiato target column: ${targetColumn} -> ${newTargetColumn}`);
            setTargetColumn(newTargetColumn);
          }
        },
        onDragEnd: function(this: any) {
          // Ripristina lo stile
          this.target.classList.remove('dragging');
          
          if (currentDragInfo.current.lead && targetColumn) {
            const startStatus = currentDragInfo.current.startStatus;
            
            // Solo se la colonna è cambiata, facciamo il move
            if (startStatus !== targetColumn) {
              console.log(`[DRAG DEBUG] ✅ Drop completato - Spostamento lead da ${startStatus} a ${targetColumn}`);
              handleMoveLead(currentDragInfo.current.lead, targetColumn);
            } else {
              console.log(`[DRAG DEBUG] ℹ️ Drop nella stessa colonna (${targetColumn}) - Nessun'azione`);
            }
          }
          
          // Reset dello stato
          setDraggedLead(null);
          setTargetColumn(null);
          
          // Riporta l'elemento alla posizione originale con animazione
          window.gsap.to(this.target, {
            duration: 0.3,
            x: 0,
            y: 0,
            ease: "power2.out"
          });
          
          // Reset del riferimento al drag corrente
          currentDragInfo.current = {
            lead: null,
            element: null,
            startStatus: null
          };
        }
      })[0]; // Prendiamo il primo elemento dell'array restituito
      
      // Salva l'istanza di Draggable
      draggableInstances.current.set(id, draggable);
    });
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

  return (
    <>
      {/* Scripts per GSAP */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" 
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("GSAP loaded");
        }}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/Draggable.min.js" 
        strategy="beforeInteractive"
        onLoad={() => {
          console.log("Draggable loaded");
          gsapLoaded.current = true;
          initializeDraggables();
        }}
      />
      
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
                      className={`funnel-card ${draggedLead?._id === lead._id ? 'opacity-50' : ''}`}
                      data-id={lead._id}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-sm truncate pr-1">
                          {lead.name}
                        </div>
                        <button 
                          className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                          onClick={() => handleEditLead(lead)}
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
      
      {/* CSS extra per il drag and drop */}
      <style jsx global>{`
        .funnel-card {
          position: relative;
          padding: 10px;
          margin: 8px;
          background: #2a2a2a;
          border-radius: 6px;
          border-left: 3px solid;
          user-select: none;
          touch-action: none; /* Importante per Draggable */
        }
        
        .funnel-card.dragging {
          z-index: 1000;
          opacity: 0.8;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
          transform: rotate(3deg) scale(1.02);
        }
        
        .drop-target-active {
          background-color: rgba(255, 255, 255, 0.05);
          transition: background-color 0.2s ease;
        }
        
        /* Animazione durante il trascinamento */
        .column-fade-transition {
          transition: opacity 0.3s ease;
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