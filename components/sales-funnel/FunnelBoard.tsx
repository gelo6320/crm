// components/sales-funnel/CustomFunnelBoard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";

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
  const initialized = useRef(false);
  const draggableInstancesRef = useRef<any[]>([]);
  
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

  // Funzione per caricare GSAP e Draggable
  useEffect(() => {
    // Carica GSAP in modo dinamico
    const loadGSAP = async () => {
      try {
        // Verifica se gsap è già disponibile globalmente
        if (!window.gsap) {
          // Carica GSAP
          const gsapScript = document.createElement('script');
          gsapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
          gsapScript.async = true;
          gsapScript.onload = loadDraggable;
          document.body.appendChild(gsapScript);
        } else {
          loadDraggable();
        }
      } catch (error) {
        console.error("Errore nel caricare GSAP:", error);
      }
    };

    // Carica il plugin Draggable dopo GSAP
    const loadDraggable = () => {
      try {
        if (!window.Draggable) {
          const draggableScript = document.createElement('script');
          draggableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/Draggable.min.js';
          draggableScript.async = true;
          draggableScript.onload = () => {
            console.log("GSAP e Draggable caricati correttamente");
            // Inizializza draggable solo dopo che entrambi sono caricati
            setTimeout(initializeDraggables, 100); // Piccolo timeout per assicurarsi che tutto sia pronto
          };
          document.body.appendChild(draggableScript);
        } else {
          console.log("Draggable già disponibile");
          setTimeout(initializeDraggables, 100);
        }
      } catch (error) {
        console.error("Errore nel caricare Draggable:", error);
      }
    };

    loadGSAP();

    // Cleanup quando il componente viene smontato
    return () => {
      destroyDraggables();
    };
  }, []);

  // Re-inizializza i draggable quando cambiano i dati
  useEffect(() => {
    if (initialized.current && window.Draggable) {
      console.log("Data changed, re-initializing draggables");
      // Piccolo timeout per assicurarsi che il DOM sia aggiornato
      setTimeout(initializeDraggables, 100);
    }
  }, [funnelData]);

  // Distrugge tutte le istanze Draggable
  const destroyDraggables = () => {
    if (draggableInstancesRef.current.length) {
      console.log("Destroying draggables...");
      draggableInstancesRef.current.forEach(instance => {
        if (instance && typeof instance.kill === 'function') {
          instance.kill();
        }
      });
      draggableInstancesRef.current = [];
    }
  };

  // Inizializza i Draggable per ogni card
  const initializeDraggables = () => {
    if (!window.Draggable || !window.gsap) {
      console.error("GSAP o Draggable non sono disponibili");
      return;
    }

    // Pulisci le istanze esistenti prima di crearne di nuove
    destroyDraggables();

    const gsap = window.gsap;
    const Draggable = window.Draggable;

    console.log("Initializing draggables...");

    // Seleziona tutte le card
    const cards = document.querySelectorAll('.funnel-card');
    console.log(`Found ${cards.length} cards to make draggable`);

    if (cards.length === 0) {
      setTimeout(initializeDraggables, 500); // Riprova se non ci sono ancora card
      return;
    }

    // Crea un'istanza draggable per ogni card
    cards.forEach((card, index) => {
      try {
        // Identifica il lead associato a questa card
        const leadId = card.getAttribute('data-id');
        let currentLead: FunnelItem | null = null;
        let currentStatus: string | null = null;

        // Cerca il lead in tutte le colonne
        for (const colId in funnelData) {
          const found = funnelData[colId as keyof FunnelData].find(item => item._id === leadId);
          if (found) {
            currentLead = found;
            currentStatus = colId;
            break;
          }
        }

        if (!currentLead) {
          console.warn(`Lead non trovato per card con ID: ${leadId}`);
          return;
        }

        console.log(`Creating draggable for lead: ${currentLead.name}`);

        // Crea il draggable
        const draggable = Draggable.create(card, {
          type: "x,y",
          bounds: boardRef.current,
          autoScroll: 3,
          edgeResistance: 0.65,
          cursor: "grab",
          activeCursor: "grabbing",
          onPress: function(this: any) {
            // Stile quando premuto
            gsap.to(this.target, {
              duration: 0.2,
              scale: 1.05,
              boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
              zIndex: 1000
            });
            
            // Salva le info sul lead corrente
            const leadData = currentLead as FunnelItem;
            currentDragInfo.current = {
              lead: leadData,
              element: this.target,
              startStatus: leadData.status
            };
            
            console.log(`Drag started for ${leadData.name}`);
            setDraggedLead(leadData);
          },
          onDrag: function(this: any) {
            if (!currentLead) return;
            
            // Trova la colonna sotto il cursore
            const dragRect = this.target.getBoundingClientRect();
            const centerX = dragRect.left + dragRect.width / 2;
            const centerY = dragRect.top + dragRect.height / 2;
            
            // Ottieni tutte le colonne
            const columns = document.querySelectorAll('.funnel-column');
            let newTarget: string | null = null;
            
            columns.forEach(column => {
              const rect = column.getBoundingClientRect();
              if (
                centerX >= rect.left && 
                centerX <= rect.right && 
                centerY >= rect.top && 
                centerY <= rect.bottom
              ) {
                newTarget = (column as HTMLElement).id;
              }
            });
            
            // Aggiorna la colonna target se cambiata
            if (newTarget !== targetColumn) {
              console.log(`Target column changed to: ${newTarget}`);
              setTargetColumn(newTarget);
            }
          },
          onRelease: function(this: any) {
            // Ripristina lo stile
            gsap.to(this.target, {
              duration: 0.3,
              scale: 1,
              boxShadow: "0px 0px 0px rgba(0,0,0,0)",
              clearProps: "zIndex"
            });
            
            // Completa il drag solo se abbiamo una colonna target valida
            if (targetColumn && currentDragInfo.current.lead) {
              const lead = currentDragInfo.current.lead;
              const fromStatus = currentDragInfo.current.startStatus;
              
              if (fromStatus !== targetColumn) {
                console.log(`Moving lead from ${fromStatus} to ${targetColumn}`);
                handleMoveLead(lead, targetColumn);
              }
            }
            
            // Riporta l'elemento alla posizione originale
            gsap.to(this.target, {
              duration: 0.3,
              x: 0,
              y: 0,
              onComplete: () => {
                // Reset stati
                setDraggedLead(null);
                setTargetColumn(null);
                
                // Reset drag info
                currentDragInfo.current = {
                  lead: null,
                  element: null,
                  startStatus: null
                };
              }
            });
          }
        })[0]; // Prendi la prima istanza dell'array

        draggableInstancesRef.current.push(draggable);
      } catch (error) {
        console.error(`Error creating draggable for card ${index}:`, error);
      }
    });

    initialized.current = true;
    console.log(`Successfully initialized ${draggableInstancesRef.current.length} draggables`);
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
        .funnel-column {
          min-width: 300px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
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
          min-height: 100px;
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