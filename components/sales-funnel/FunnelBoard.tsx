// components/sales-funnel/FunnelBoard.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  
  const boardRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<{[id: string]: HTMLDivElement | null}>({});
  const columnsRef = useRef<{[id: string]: HTMLDivElement | null}>({});
  const draggableInstancesRef = useRef<any[]>([]);
  
  // Callback per gestire il ref delle colonne
  const setColumnRef = useCallback((el: HTMLDivElement | null, columnId: string) => {
    columnsRef.current[columnId] = el;
  }, []);
  
  // Callback per gestire il ref delle card
  const setCardRef = useCallback((el: HTMLDivElement | null, leadId: string) => {
    cardsRef.current[leadId] = el;
  }, []);
  
  // Carica GSAP e inizializza Draggable dopo che il componente è montato
  useEffect(() => {
    // Attendi che GSAP e Draggable siano completamente caricate
    const checkGSAPLoaded = () => {
      if (typeof window !== 'undefined' && window.gsap && window.Draggable) {
        console.log("GSAP e Draggable sono caricate, inizializzo...");
        initializeDraggables();
      } else {
        console.log("GSAP o Draggable non ancora caricate, riprovo tra 100ms...");
        setTimeout(checkGSAPLoaded, 100);
      }
    };
    
    // Avvia il controllo dopo un breve ritardo per assicurarsi che i componenti siano renderizzati
    const timer = setTimeout(checkGSAPLoaded, 500);
    
    return () => {
      clearTimeout(timer);
      // Cleanup draggable instances
      if (draggableInstancesRef.current.length > 0) {
        draggableInstancesRef.current.forEach(instance => {
          if (instance && instance.kill) {
            instance.kill();
          }
        });
        draggableInstancesRef.current = [];
      }
    };
  }, [funnelData]);

  // Initialize Draggable instances for each card
  const initializeDraggables = () => {
    if (!window.Draggable || !window.gsap) {
      console.error("GSAP o Draggable non disponibili");
      return;
    }
    
    console.log("Inizializzazione Draggable...");
    
    // Clear previous instances
    draggableInstancesRef.current.forEach(instance => {
      if (instance && instance.kill) {
        instance.kill();
      }
    });
    draggableInstancesRef.current = [];
    
    // Create new instances for each card
    COLUMNS.forEach(column => {
      const leadItems = funnelData[column.id as keyof FunnelData];
      
      leadItems.forEach(lead => {
        const cardElement = cardsRef.current[lead._id];
        if (!cardElement) {
          console.warn(`Elemento card per lead ${lead._id} non trovato`);
          return;
        }
        
        // Assicurati che la posizione sia corretta prima di inizializzare Draggable
        window.gsap.set(cardElement, { clearProps: "all" });
        
        try {
          const draggable = window.Draggable.create(cardElement, {
            type: "x,y",
            bounds: boardRef.current,
            edgeResistance: 0.65,
            inertia: true,
            dragClickables: false, // Impedisce il trascinamento quando si fa clic su elementi clickabili interni
            onClick: function() {
              // Gestisci il click qui se necessario
              console.log("Click sulla card", lead._id);
            },
            onDragStart: function() {
              console.log("Drag start", lead._id);
              cardElement.classList.add("dragging");
              // Aumenta lo z-index per posizionare sopra gli altri elementi
              window.gsap.set(cardElement, { zIndex: 100 });
            },
            onDrag: function() {
              // Check for column overlap and auto-scroll
              handleDragOver(cardElement, lead, this);
            },
            onDragEnd: function() {
              console.log("Drag end", lead._id);
              cardElement.classList.remove("dragging");
              // Ripristina lo z-index
              window.gsap.set(cardElement, { zIndex: 10 });
              
              // Get the final column
              const targetColumn = getOverlappingColumn(cardElement);
              console.log("Target column:", targetColumn);
              
              if (targetColumn && targetColumn !== column.id) {
                handleMoveLead(lead, targetColumn);
              } else {
                // Reset position if no valid target
                window.gsap.to(cardElement, {
                  duration: 0.3,
                  x: 0,
                  y: 0,
                  ease: "power2.out"
                });
              }
            }
          });
          
          console.log(`Draggable creato per lead ${lead._id}`);
          draggableInstancesRef.current.push(draggable[0]);
        } catch (error) {
          console.error(`Errore nella creazione di Draggable per lead ${lead._id}:`, error);
        }
      });
    });
    
    console.log(`Creati ${draggableInstancesRef.current.length} istanze di Draggable`);
  };
  
  // Handle autoscroll and position checking during drag
  const handleDragOver = (element: HTMLDivElement, lead: FunnelItem, draggable: any) => {
    if (!boardRef.current) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    // Auto-scroll logic
    const scrollSpeed = 15;
    const scrollZone = 100; // px from edge
    
    if (elementRect.right > boardRect.right - scrollZone) {
      boardRef.current.scrollLeft += scrollSpeed;
    } else if (elementRect.left < boardRect.left + scrollZone) {
      boardRef.current.scrollLeft -= scrollSpeed;
    }
  };
  
  // Get the column that a card is overlapping with
  const getOverlappingColumn = (element: HTMLDivElement): string | null => {
    const elementRect = element.getBoundingClientRect();
    const centerX = elementRect.left + elementRect.width / 2;
    
    for (const column of COLUMNS) {
      const columnElement = columnsRef.current[column.id];
      if (!columnElement) continue;
      
      const columnRect = columnElement.getBoundingClientRect();
      
      if (
        centerX >= columnRect.left &&
        centerX <= columnRect.right
      ) {
        return column.id;
      }
    }
    
    return null;
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
        className="funnel-board-container"
      >
        <div className="funnel-board">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              ref={(el) => setColumnRef(el, column.id)}
              className={`funnel-column ${isMoving ? 'column-fade-transition' : ''}`}
            >
              <div className={`funnel-header ${column.color}`}>
                <h3 className="text-sm font-medium">{column.title}</h3>
                <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
                  {funnelData[column.id as keyof FunnelData].length}
                </div>
              </div>
              
              <div className="funnel-body">
                <div className="funnel-cards-horizontal">
                  {funnelData[column.id as keyof FunnelData].length > 0 ? (
                    funnelData[column.id as keyof FunnelData].map((lead) => (
                      <div 
                        key={lead._id}
                        ref={(el) => setCardRef(el, lead._id)}
                        className="funnel-card"
                        style={{ borderLeftColor: getBorderColor(lead.status) }}
                        data-id={lead._id}
                        data-status={lead.status}
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
                    ))
                  ) : (
                    <div className="text-center text-zinc-500 text-xs italic py-4">
                      Nessun lead
                    </div>
                  )}
                </div>
              </div>
            </div>
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

// Declare global Draggable for TypeScript
declare global {
  interface Window {
    Draggable: any;
    gsap: any;
  }
}