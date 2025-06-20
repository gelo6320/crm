// components/sales-funnel/FunnelBoard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FunnelData, FunnelItem } from "@/types";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import { toast } from "@/components/ui/toaster";
import axios from "axios";
import { updateLeadMetadata } from "@/lib/api/funnel";
import { AnimatePresence } from "motion/react";

// dnd-kit imports
import {
  DndContext,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

// Utils
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Columns configuration with color mappings
const COLUMNS = [
  { id: "new", title: "Nuovi", color: "bg-zinc-700", borderColor: "#71717a", glowColor: "71, 113, 122" },
  { id: "contacted", title: "Contattati", color: "bg-info", borderColor: "#3b82f6", glowColor: "59, 130, 246" },
  { id: "qualified", title: "Qualificati", color: "bg-primary", borderColor: "#FF6B00", glowColor: "255, 107, 0" },
  { id: "opportunity", title: "Opportunità", color: "bg-warning", borderColor: "#f59e0b", glowColor: "245, 158, 11" },
  { id: "proposal", title: "Proposta", color: "bg-primary-hover", borderColor: "#FF8C38", glowColor: "255, 140, 56" },
  { id: "customer", title: "Clienti", color: "bg-success", borderColor: "#10b981", glowColor: "16, 185, 129" },
  { id: "lost", title: "Persi", color: "bg-danger", borderColor: "#ef4444", glowColor: "239, 68, 68" },
];

// Configurazione dell'animazione di drop
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

// Helper function to get column colors
const getColumnColors = (columnId: string) => {
  const column = COLUMNS.find(col => col.id === columnId);
  return {
    borderColor: column?.borderColor || "#71717a",
    glowColor: column?.glowColor || "71, 113, 122"
  };
};

interface CustomFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
  highlightedLeadId?: string | null;
}

// Main Component
export default function CustomFunnelBoard({
  funnelData,
  setFunnelData,
  onLeadMove,
  highlightedLeadId = null
}: CustomFunnelBoardProps) {
  // State per modali e operazioni sulle lead
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [editTriggerRect, setEditTriggerRect] = useState<DOMRect | null>(null); // NUOVO STATO per coordinate
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);

  // State per drag and drop
  const [activeDrag, setActiveDrag] = useState<{
    lead: FunnelItem;
    sourceColumn: string;
  } | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  // Ref per il contenitore principale
  const boardRef = useRef<HTMLDivElement>(null);

  // Rilevamento del dispositivo
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Rileva dispositivo touch al mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Configurazione dei sensori per desktop e mobile
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Configurazione per mouse (desktop)
      activationConstraint: {
        distance: 3, // Ridotta la distanza minima per attivare il drag
      },
    }),
    useSensor(TouchSensor, {
      // Configurazione per touch (mobile)
      activationConstraint: {
        delay: 150, // Ridotto il ritardo per una migliore reattività
        tolerance: 5, // Ridotta la tolleranza per una migliore risposta
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Mappa gli stati del database agli stati del funnel
  const mapDatabaseStatusToFunnelStatus = (dbStatus: string): string => {
    // Mappatura inversa da stato database a stato funnel
    const reverseBookingStatusMap: Record<string, string> = {
      pending: "new",
      confirmed: "contacted",
      completed: "qualified",
      cancelled: "lost",
      // Questi sono gli stessi in entrambe le direzioni
      opportunity: "opportunity",
      proposal: "proposal",
      customer: "customer",
    };

    return reverseBookingStatusMap[dbStatus] || dbStatus;
  };

  // Inizializza i dati del funnel
  useEffect(() => {
    // Logica di inizializzazione omessa per brevità - rimane invariata
    // Verifica delle colonne e mappatura degli stati
  }, []);

  // Gestisce l'inizio del trascinamento
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    // Controlla se stiamo trascinando una lead (formato id: "lead-ID:COLUMN")
    if (typeof active.id === 'string' && active.id.startsWith('lead-')) {
      const [fullId, columnId] = active.id.split(':');
      const leadId = fullId.replace('lead-', '');
      
      // Trova la lead nella colonna di origine
      const lead = funnelData[columnId as keyof FunnelData]?.find(
        item => item._id === leadId
      );
      
      if (lead) {
        setActiveDrag({
          lead,
          sourceColumn: columnId
        });
        document.body.style.cursor = "grabbing";
        document.body.classList.add("is-dragging");
      }
    }
  };

  // Gestisce il movimento durante il trascinamento
  const handleDragMove = (event: DragMoveEvent) => {
    // L'autoscroll è gestito automaticamente da dnd-kit
  };

  // Gestisce il passaggio sopra una colonna
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active || !activeDrag) return;
    
    // Verifica se stiamo sopra una colonna (formato id: "column-ID")
    if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      const columnId = over.id.replace('column-', '');
      
      // Aggiorna la colonna attiva per feedback visivo
      setActiveColumn(columnId);
      
      // Aggiungi questo log per debug
      console.log("Dragging over column:", columnId);
    }
  };

  // Gestisce la fine del trascinamento
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    document.body.style.cursor = "";
    document.body.classList.remove("is-dragging");
    
    if (!over || !active || !activeDrag) {
      setActiveDrag(null);
      setActiveColumn(null);
      return;
    }
    
    // Verifica se stiamo rilasciando su una colonna (formato id: "column-ID")
    if (typeof over.id === 'string' && over.id.startsWith('column-')) {
      const targetColumnId = over.id.replace('column-', '');
      
      // Sposta solo se la lead viene spostata in una colonna diversa
      if (activeDrag.lead.status !== targetColumnId) {
        handleMoveLead(activeDrag.lead, targetColumnId);
      }
    }
    
    setActiveDrag(null);
    setActiveColumn(null);
  };

  // Gestisce lo spostamento di una lead tra colonne con gestione degli errori
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    if (!lead || lead.status === targetStatus) return;

    // Mappa lo stato della lead da stato database a stato funnel se necessario
    const mappedPrevStatus = mapDatabaseStatusToFunnelStatus(lead.status);
    
    // Memorizza lo stato precedente (ora mappato se necessario)
    const prevStatus = mappedPrevStatus;

    // Aggiorna lo state per mostrare che lo spostamento è in corso
    setIsMoving(true);

    try {
      // Prima aggiorna l'UI immediatamente per una migliore UX
      const updatedFunnelData = { ...funnelData };

      // Verifica che lo stato precedente esista e sia un array prima di filtrare
      if (
        prevStatus &&
        prevStatus in updatedFunnelData &&
        updatedFunnelData[prevStatus as keyof FunnelData] &&
        Array.isArray(updatedFunnelData[prevStatus as keyof FunnelData])
      ) {
        // Rimuovi lead dalla colonna di origine
        updatedFunnelData[prevStatus as keyof FunnelData] = updatedFunnelData[
          prevStatus as keyof FunnelData
        ].filter((item) => item._id !== lead._id);
      } else {
        console.warn(`Invalid source status: ${lead.status} (mapped to ${prevStatus})`);
      }

      // Verifica che lo stato di destinazione esista e sia un array prima di aggiungerlo
      if (
        !(targetStatus in updatedFunnelData) ||
        !updatedFunnelData[targetStatus as keyof FunnelData] ||
        !Array.isArray(updatedFunnelData[targetStatus as keyof FunnelData])
      ) {
        // Inizializza la colonna di destinazione se non esiste
        updatedFunnelData[targetStatus as keyof FunnelData] = [];
      }

      // Aggiorna lo stato della lead
      const updatedLead = { ...lead, status: targetStatus };

      // Aggiungi lead alla colonna di destinazione
      updatedFunnelData[targetStatus as keyof FunnelData] = [
        ...updatedFunnelData[targetStatus as keyof FunnelData],
        updatedLead,
      ];

      // Aggiorna lo state
      setFunnelData(updatedFunnelData);

      // Mostra il modale di conferma solo per gli spostamenti a "customer" (acquisto)
      if (targetStatus === "customer") {
        // Memorizza i dati della lead in movimento per il modale
        setMovingLead({
          lead: {
            ...updatedLead,
            // Assicurati che leadId sia sempre disponibile
            leadId: lead.leadId || lead._id,
          },
          prevStatus: lead.status,
          newStatus: targetStatus,
        });
      } else {
        // Per altri stati, aggiorna direttamente tramite API
        await updateLeadDirectly(updatedLead, lead.status, targetStatus);
      }
    } catch (error) {
      console.error("Error during lead move preparation:", error);
      toast("error", "Errore spostamento", "Si è verificato un errore durante lo spostamento del lead");
      
      // Ripristina lo stato dell'UI in modo sicuro in caso di errore
      try {
        if (lead) {
          handleUndoMoveWithLead(lead, targetStatus, lead.status);
        } else if (movingLead) {
          handleUndoMove();
        }
      } catch (undoError) {
        console.error("Failed to undo move:", undoError);
        // Forza aggiornamento come ultima risorsa
        onLeadMove().catch((e) => console.error("Failed to refresh funnel data:", e));
      }
    } finally {
      if (targetStatus !== "customer") {
        setIsMoving(false);
      }
    }
  };

  // Funzione per aggiornare direttamente una lead senza mostrare il modale
  const updateLeadDirectly = async (lead: FunnelItem, fromStage: string, toStage: string) => {
    try {
      // Usa leadId invece di _id per la chiamata API
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/leads/${lead.leadId || lead._id}`,
        { withCredentials: true }
      );

      // Ottieni lo stato attuale dal database
      const currentDbStatus = checkResponse.data?.status;

      // Determina la mappatura degli stati solo per il tipo booking
      let actualFromStage = fromStage;
      let actualToStage = toStage;

      if (lead.type === "booking") {
        // Mappa gli stati del funnel agli stati del database per il tipo booking
        const bookingStatusMap: Record<string, string> = {
          new: "pending",
          contacted: "confirmed",
          qualified: "completed",
          opportunity: "opportunity",
          proposal: "proposal",
          customer: "customer",
          lost: "cancelled",
        };

        // Se lo stato nel database è uno degli stati nativi delle prenotazioni,
        // usa quello come actualFromStage
        if (["pending", "confirmed", "completed", "cancelled"].includes(currentDbStatus)) {
          actualFromStage = currentDbStatus;
        }

        // Mappa lo stato di destinazione se necessario
        if (bookingStatusMap[toStage]) {
          actualToStage = bookingStatusMap[toStage];
        }
      }

      // Chiamata API per lo spostamento effettivo
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: lead.leadId || lead._id, // Usa leadId con fallback
          leadType: lead.type,
          fromStage: actualFromStage,
          toStage: actualToStage,
          originalFromStage: fromStage,
          originalToStage: toStage,
        },
        { withCredentials: true }
      );

      // Se la chiamata API è riuscita, aggiorna i dati del funnel
      if (response.data.success) {
        // Aggiorna dati funnel tramite callback
        await onLeadMove();

        toast("success", "Lead spostato", `Lead spostato con successo in ${toStage}`);
      } else {
        throw new Error(response.data.message || "Errore durante lo spostamento del lead");
      }
    } catch (error) {
      console.error("Error during lead move:", error);

      // Ripristina lo stato precedente in caso di errore
      handleUndoMoveWithLead(lead, toStage, fromStage);

      // Estrai il messaggio di errore per il feedback all'utente
      let errorMessage = "Si è verificato un errore durante lo spostamento del lead";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast("error", "Errore spostamento", errorMessage);

      // Aggiorna i dati del funnel per garantire la coerenza
      await onLeadMove();
    } finally {
      setIsMoving(false);
    }
  };

  // Gestisce la conferma dello spostamento della lead dopo aver mostrato il modale
  const handleConfirmMove = async () => {
    if (!movingLead) return;

    try {
      // Usa sempre l'ID corretto
      const idToUse = movingLead.lead.leadId || movingLead.lead._id;

      // Find the lead status check section in handleConfirmMove
      const checkResponse = await axios.get(`${API_BASE_URL}/api/leads/${idToUse}`, {
        withCredentials: true,
      });
      
      const currentDbStatus = checkResponse.data?.status || movingLead.prevStatus;
      // Map the database status to funnel status before comparing
      const currentFunnelStatus = mapDatabaseStatusToFunnelStatus(currentDbStatus);
      
      // Now compare the properly mapped status
      if (currentFunnelStatus !== movingLead.prevStatus) {
        console.warn(`Status mismatch: expected ${movingLead.prevStatus}, got ${currentFunnelStatus}`);
        
        toast(
          "warning",
          "Stato aggiornato",
          "Lo stato del lead è stato aggiornato da un altro utente"
        );

        // Aggiorna i dati del funnel per sincronizzare con il server
        await onLeadMove();

        setMovingLead(null);
        setIsMoving(false);
        return;
      }

      // Chiamata all'API per aggiornare allo stato "customer"
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: movingLead.lead.leadId || movingLead.lead._id, // Usa leadId con fallback
          leadType: movingLead.lead.type,
          fromStage: movingLead.prevStatus,
          toStage: movingLead.newStatus,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Aggiorna i dati del funnel tramite callback
        await onLeadMove();

        toast("success", "Lead convertito", "Lead convertito in cliente con successo");
      } else {
        throw new Error(response.data.message || "Errore durante la conversione del lead");
      }
    } catch (error) {
      console.error("Error during lead conversion:", error);

      // Ripristina lo stato precedente in caso di errore
      if (movingLead) {
        handleUndoMoveWithLead(movingLead.lead, movingLead.newStatus, movingLead.prevStatus);
      }

      // Estrai il messaggio di errore per il feedback all'utente
      let errorMessage = "Si è verificato un errore durante la conversione del lead";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast("error", "Errore conversione", errorMessage);

      // Aggiorna i dati del funnel per garantire la coerenza
      await onLeadMove();
    } finally {
      setMovingLead(null);
      setIsMoving(false);
    }
  };

  // Gestisce l'annullamento dello spostamento della lead
  const handleUndoMove = () => {
    // Se abbiamo i dati movingLead, usali per annullare lo spostamento
    if (movingLead) {
      handleUndoMoveWithLead(movingLead.lead, movingLead.newStatus, movingLead.prevStatus);

      setMovingLead(null);
    } else {
      // Se non abbiamo i dati movingLead, aggiorna i dati dal server
      toast("info", "Aggiornamento dati", "Aggiornamento dei dati del funnel in corso...");

      onLeadMove().catch((error) => {
        console.error("Error refreshing funnel data:", error);
        toast(
          "error",
          "Errore aggiornamento",
          "Si è verificato un errore durante l'aggiornamento dei dati"
        );
      });
    }

    setIsMoving(false);
  };

  // Funzione di supporto per il ripristino dello stato con mappatura dello stato
  const handleUndoMoveWithLead = (
    lead: FunnelItem,
    currentStatus: string,
    targetStatus: string
  ) => {
    try {
      const updatedFunnelData = { ...funnelData };

      // Mappa gli stati da stato database a stato funnel se necessario
      const mappedCurrentStatus = mapDatabaseStatusToFunnelStatus(currentStatus);
      const mappedTargetStatus = mapDatabaseStatusToFunnelStatus(targetStatus);

      // Verifica che lo stato attuale esista prima di tentare di filtrare
      if (
        mappedCurrentStatus &&
        mappedCurrentStatus in updatedFunnelData &&
        updatedFunnelData[mappedCurrentStatus as keyof FunnelData] &&
        Array.isArray(updatedFunnelData[mappedCurrentStatus as keyof FunnelData])
      ) {
        // Rimuovi lead dalla colonna attuale
        updatedFunnelData[mappedCurrentStatus as keyof FunnelData] = updatedFunnelData[
          mappedCurrentStatus as keyof FunnelData
        ].filter((item) => item._id !== lead._id);
      } else {
        console.warn(
          `Invalid current status during undo: ${currentStatus} (mapped to ${mappedCurrentStatus})`
        );
        // Continueremo e cercheremo di aggiungere alla colonna di destinazione
      }

      // Verifica che lo stato di destinazione esista prima di aggiungere la lead
      if (
        !(mappedTargetStatus in updatedFunnelData) ||
        !updatedFunnelData[mappedTargetStatus as keyof FunnelData] ||
        !Array.isArray(updatedFunnelData[mappedTargetStatus as keyof FunnelData])
      ) {
        // Inizializza la colonna di destinazione se non esiste
        updatedFunnelData[mappedTargetStatus as keyof FunnelData] = [];
      }

      // Ripristina lead nella colonna di destinazione con stato originale
      const revertedLead = { ...lead, status: targetStatus }; // Mantieni lo stato originale del database
      updatedFunnelData[mappedTargetStatus as keyof FunnelData] = [
        ...updatedFunnelData[mappedTargetStatus as keyof FunnelData],
        revertedLead,
      ];

      // Aggiorna lo state
      setFunnelData(updatedFunnelData);
    } catch (error) {
      console.error("Error during undo move:", error);
      toast(
        "error",
        "Errore ripristino",
        "Si è verificato un errore durante il ripristino dello stato precedente"
      );

      // Forza aggiornamento dati dal server come ultima risorsa
      onLeadMove().catch((e) => console.error("Failed to refresh funnel data:", e));
    }
  };

  // AGGIORNATO: Gestisce la modifica di valore e servizio di una lead CON COORDINATE
  const handleEditLead = (lead: FunnelItem, event: React.MouseEvent) => {
    // Se c'è già un modal aperto, chiudilo immediatamente
    if (editingLead) {
      setEditingLead(null);
      setEditTriggerRect(null);
    }
    
    // Ottieni le coordinate dell'elemento cliccato
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    
    console.log('Edit lead clicked:', lead.name, 'at coordinates:', rect);
    
    // Piccolo delay per assicurarsi che il cleanup sia completato
    setTimeout(() => {
      // Imposta il nuovo lead da modificare con le coordinate
      setEditTriggerRect(rect);
      setEditingLead(lead);
    }, 10);
  };

  // AGGIORNATO: Gestisce il salvataggio delle modifiche a una lead CON SUPPORTO ALLE NOTE
  const handleSaveLeadValue = async (value: number, service: string, notes?: string) => {
    if (!editingLead) return;

    try {
      // Aggiorna i metadati della lead tramite API usando leadId
      await updateLeadMetadata(
        editingLead.leadId || editingLead._id, // Usa leadId con fallback
        editingLead.type,
        value,
        service,
        notes // Aggiungi il parametro notes
      );

      // Aggiorna lo state locale per un aggiornamento immediato dell'UI
      const updatedFunnelData = { ...funnelData };
      const mappedStatus = mapDatabaseStatusToFunnelStatus(editingLead.status);

      // Trova e aggiorna la lead nella sua colonna
      if (
        mappedStatus in updatedFunnelData &&
        Array.isArray(updatedFunnelData[mappedStatus as keyof FunnelData])
      ) {
        updatedFunnelData[mappedStatus as keyof FunnelData] = updatedFunnelData[
          mappedStatus as keyof FunnelData
        ].map((item) => (item._id === editingLead._id ? { 
          ...item, 
          value, 
          service,
          extendedData: {
            ...item.extendedData,
            notes: notes || item.extendedData?.notes
          }
        } : item));

        setFunnelData(updatedFunnelData);
        toast("success", "Lead aggiornato", "Dati aggiornati con successo");
      } else {
        // Se non riusciamo a trovare la colonna, aggiorna i dati del funnel
        console.warn(`Could not find column ${mappedStatus} for edited lead`);
        await onLeadMove();
        toast("info", "Lead aggiornato", "Dati aggiornati, ricaricamento funnel");
      }

      setEditingLead(null);
      setEditTriggerRect(null);
    } catch (error) {
      console.error("Error updating lead value:", error);
      toast(
        "error",
        "Errore aggiornamento",
        "Si è verificato un errore durante l'aggiornamento dei dati"
      );
    }
  };

  // Componente Card della Lead con design moderno
  const LeadCard = React.memo(
    ({ lead, columnId, isOverlay = false }: { lead: FunnelItem; columnId?: string; isOverlay?: boolean }) => {
      const colors = columnId ? getColumnColors(columnId) : { borderColor: "#71717a", glowColor: "71, 113, 122" };
      
      const cardStyle: React.CSSProperties = {
        border: `1px solid ${colors.borderColor}`,
        boxShadow: `0 0 8px rgba(${colors.glowColor}, 0.15)`,
        background: 'rgba(39, 39, 42, 0.95)', // zinc-800 with transparency
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '12px',
        margin: '4px 0',
        cursor: isOverlay ? 'grabbing' : 'grab',
        transition: 'all 0.2s ease',
        position: 'relative' as const,
      };

      if (isOverlay) {
        cardStyle.transform = 'rotate(3deg)';
        cardStyle.boxShadow = `0 8px 32px rgba(${colors.glowColor}, 0.4)`;
        cardStyle.zIndex = 1000;
      }

      return (
        <div
          className="funnel-card"
          style={cardStyle}
          onMouseEnter={(e) => {
            if (!isOverlay) {
              e.currentTarget.style.boxShadow = `0 0 16px rgba(${colors.glowColor}, 0.3)`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOverlay) {
              e.currentTarget.style.boxShadow = `0 0 8px rgba(${colors.glowColor}, 0.15)`;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-sm text-white truncate pr-2">{lead.name}</div>
            {!isOverlay && (
              <button
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                style={{ color: colors.borderColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditLead(lead, e); // PASSA L'EVENTO
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="text-xs space-y-1">
            <div className="text-zinc-400">{formatDate(lead.createdAt)}</div>
            {lead.value ? (
              <div className="font-semibold text-white">€{formatMoney(lead.value)}</div>
            ) : null}
            {lead.service ? (
              <div className="text-zinc-300 italic truncate">{lead.service}</div>
            ) : null}
            {lead.extendedData?.notes ? (
              <div className="text-zinc-400 text-xs truncate italic">Note: {lead.extendedData.notes}</div>
            ) : null}
          </div>
        </div>
      );
    }
  );

  LeadCard.displayName = "LeadCard";

  // Componente Lead trascinabile
  const DraggableLeadCard = ({ lead, columnId }: { lead: FunnelItem; columnId: string }) => {
    // Utilizziamo direttamente useSortable per gestire il drag and drop
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
      id: `lead-${lead._id}:${columnId}`, // Formato dell'ID: "lead-LEAD_ID:COLUMN_ID"
      data: {
        type: 'lead',
        lead,
        columnId
      }
    });

    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`${isDragging ? "opacity-0" : ""}`}
        style={{ touchAction: "none" }} // Importante per dispositivi touch
      >
        <LeadCard lead={lead} columnId={columnId} />
      </div>
    );
  };

  // Componente per la colonna droppable
  const DroppableColumn = ({ 
    id, 
    title, 
    color, 
    leads 
  }: { 
    id: string; 
    title: string; 
    color: string; 
    leads: FunnelItem[] 
  }) => {
    // Utilizziamo useDroppable per rendere la colonna una zona di destinazione
    const { setNodeRef, isOver } = useDroppable({
      id: `column-${id}`, // Formato dell'ID: "column-COLUMN_ID"
      data: {
        type: 'column',
        accepts: 'lead',
        columnId: id
      }
    });
  
    return (
      <div className={`funnel-column ${isMoving ? "column-fade-transition" : ""} h-full flex flex-col`}>
        <div className={`funnel-header ${color}`}>
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
            {leads.length}
          </div>
        </div>
  
        <div 
          ref={setNodeRef}
          className={`funnel-body ${isOver ? "drag-over" : ""} flex-1 overflow-y-auto p-2`}
          data-column-id={id}
          style={{
            background: isOver ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            transition: 'background 0.2s ease'
          }}
        >
          <SortableContext
            items={leads.map((lead) => `lead-${lead._id}:${id}`)}
            strategy={verticalListSortingStrategy}
          >
            {leads.length > 0 ? (
              leads.map((lead) => (
                <DraggableLeadCard key={`lead-${lead._id}:${id}`} lead={lead} columnId={id} />
              ))
            ) : (
              <div className="text-center text-zinc-500 text-xs italic py-8">Nessun lead</div>
            )}
          </SortableContext>
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      autoScroll={{
        enabled: true,
        acceleration: 5,
        interval: 5,
        threshold: {
          x: 0.15,
          y: 0.15,
        },
      }}
    >
      <div
        ref={boardRef}
        className="funnel-board-container w-full overflow-x-auto overscroll-x-none h-[calc(100vh-220px)]"
        id="funnel-board-container"
        style={{ 
          willChange: 'transform, scroll-position',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div 
          className="funnel-board min-w-max flex gap-4 h-full"
          style={{ 
            willChange: 'transform', 
            contain: 'layout style'
          }}
        >
          {COLUMNS.map((column) => (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              leads={funnelData[column.id as keyof FunnelData] || []}
            />
          ))}
        </div>
      </div>

      {/* Overlay per drag and drop */}
      <DragOverlay 
        adjustScale={false} 
        dropAnimation={dropAnimation}
        zIndex={999}
      >
        {activeDrag ? (
          <LeadCard 
            lead={activeDrag.lead} 
            columnId={activeDrag.sourceColumn}
            isOverlay={true} 
          />
        ) : null}
      </DragOverlay>

      {/* Facebook Event Modal per lo spostamento delle Lead - Solo per lo stato "customer" */}
      {movingLead && (
        <FacebookEventModal
          lead={movingLead.lead}
          previousStatus={movingLead.prevStatus}
          onClose={handleUndoMove}
          onSave={handleConfirmMove}
          onUndo={handleUndoMove}
        />
      )}

      {/* AGGIORNATO: Modale per la modifica del valore con AnimatePresence e coordinate */}
      <AnimatePresence mode="wait">
        {editingLead && (
          <ValueModal
            key={editingLead._id} // Key unica per ogni modal
            lead={editingLead}
            onClose={() => {
              setEditingLead(null);
              setEditTriggerRect(null);
            }}
            onSave={handleSaveLeadValue}
            triggerRect={editTriggerRect}
          />
        )}
      </AnimatePresence>
    </DndContext>
  );
}