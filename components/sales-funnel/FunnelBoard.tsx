// components/sales-funnel/FunnelBoard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FunnelData, FunnelItem } from "@/types";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import { toast } from "@/components/ui/toaster";
import axios from "axios";
import { updateLeadMetadata } from "@/lib/api/funnel";

// React-dnd imports
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isTouchDevice } from "@/lib/utils/device";
import CustomDragLayer from "./CustomDragLayer";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

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

// Conditional backend detection
const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;

// Optimized touch backend options
const touchBackendOptions = {
  enableMouseEvents: true,
  delayTouchStart: 150,      // Increased delay to avoid accidental drags
  touchSlop: 5,              // Reduced to make dragging start with smaller movements
  ignoreContextMenu: true,
  enableKeyboardEvents: true,
  enableTouchEvents: true,   // Make sure touch events are enabled
  enableHoverOutsideTarget: true,
  scrollAngleRanges: [       // Define vertical/horizontal scroll thresholds
    { start: 30, end: 150 }, // Horizontal-ish scrolling
    { start: 210, end: 330 } // Horizontal-ish scrolling (other direction)
  ]
};

interface CustomFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
}

// Main Component
export default function CustomFunnelBoard({ funnelData, setFunnelData, onLeadMove }: CustomFunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);
  
  // Ref for the main container
  const boardRef = useRef<HTMLDivElement>(null);
  
  // State for auto scrolling
  const [isScrolling, setIsScrolling] = useState<"left" | "right" | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number>(Date.now());

  // Map database statuses to funnel statuses
  const mapDatabaseStatusToFunnelStatus = (dbStatus: string): string => {
    // Reverse mapping from database status to funnel status
    const reverseBookingStatusMap: Record<string, string> = {
      'pending': 'new',
      'confirmed': 'contacted',
      'completed': 'qualified',
      'cancelled': 'lost',
      // These are the same in both directions
      'opportunity': 'opportunity',
      'proposal': 'proposal',
      'customer': 'customer'
    };

    // Return the mapped funnel status or the original if no mapping exists
    return reverseBookingStatusMap[dbStatus] || dbStatus;
  };

  // Initialize funnel data - ensure all columns exist and leads are in correct columns
  useEffect(() => {
    // Make sure all columns defined in COLUMNS exist in funnelData and are arrays
    const updatedFunnelData = { ...funnelData };
    let needsUpdate = false;
    
    // Check each column and ensure it exists as an array
    COLUMNS.forEach(column => {
      if (
        !(column.id in updatedFunnelData) || 
        !updatedFunnelData[column.id as keyof FunnelData] ||
        !Array.isArray(updatedFunnelData[column.id as keyof FunnelData])
      ) {
        // Initialize missing column
        updatedFunnelData[column.id as keyof FunnelData] = [];
        needsUpdate = true;
        console.log(`Initialized missing column: ${column.id}`);
      }
    });
    
    // Handle any items with database statuses
    Object.keys(updatedFunnelData).forEach(columnId => {
      const column = updatedFunnelData[columnId as keyof FunnelData];
      if (Array.isArray(column)) {
        // Check each lead in the column
        column.forEach(lead => {
          // If the lead's status doesn't match a funnel column, needs mapping
          if (!COLUMNS.some(col => col.id === lead.status)) {
            const mappedStatus = mapDatabaseStatusToFunnelStatus(lead.status);
            console.log(`Found lead with database status: ${lead.status}, mapped to: ${mappedStatus}`);
            
            // Only move the lead if the mapping is different from its current position
            if (mappedStatus !== columnId) {
              // Create a copy to place in the correct column
              const updatedLead = { ...lead };
              
              // Remove from current column
              updatedFunnelData[columnId as keyof FunnelData] = updatedFunnelData[
                columnId as keyof FunnelData
              ].filter(item => item._id !== lead._id);
              
              // Add to mapped column
              if (
                !(mappedStatus in updatedFunnelData) || 
                !updatedFunnelData[mappedStatus as keyof FunnelData] ||
                !Array.isArray(updatedFunnelData[mappedStatus as keyof FunnelData])
              ) {
                updatedFunnelData[mappedStatus as keyof FunnelData] = [];
              }
              
              updatedFunnelData[mappedStatus as keyof FunnelData].push(updatedLead);
              needsUpdate = true;
            }
          }
        });
      }
    });
    
    // Update state if needed
    if (needsUpdate) {
      console.log("Updating funnel data with initialized columns");
      setFunnelData(updatedFunnelData);
    }
  }, []); // Run only on mount to avoid infinite loops

  // Optimized auto-scroll when isScrolling changes
  useEffect(() => {
    if (!boardRef.current || !isScrolling) {
      if (scrollIntervalRef.current) {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }
    
    const container = boardRef.current;
    
    // Dynamic scroll speed - faster when closer to the edge
    const calculateScrollSpeed = () => {
      // Base speed: 8px per interval
      const baseSpeed = 8;
      // Maximum additional speed: 20px
      const maxAdditionalSpeed = 20;
      // Acceleration factor (0-1)
      const acceleration = 0.7;
      
      // Increase speed the longer we scroll in one direction
      const scrollDuration = Date.now() - scrollStartTimeRef.current;
      const accelerationFactor = Math.min(1, scrollDuration / 1000 * acceleration);
      
      return Math.round(baseSpeed + (maxAdditionalSpeed * accelerationFactor));
    };
    
    // Create interval for continuous scrolling with dynamic speed
    scrollIntervalRef.current = window.setInterval(() => {
      if (container) {
        const speed = calculateScrollSpeed();
        const scrollAmount = isScrolling === "left" ? -speed : speed;
        
        // Check if we can scroll further
        if (
          (isScrolling === "left" && container.scrollLeft > 0) ||
          (isScrolling === "right" && 
           container.scrollLeft < container.scrollWidth - container.clientWidth)
        ) {
          container.scrollBy({ left: scrollAmount, behavior: "auto" });
        } else {
          // Stop scrolling if we reached the edge
          setIsScrolling(null);
        }
      }
    }, 16); // ~60fps for smooth scrolling
    
    return () => {
      if (scrollIntervalRef.current) {
        window.clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isScrolling]);

  // Handle lead movement between columns with error handling
  const handleMoveLead = async (lead: FunnelItem, targetStatus: string) => {
    if (!lead || lead.status === targetStatus) return;

    // Map the lead's status from database status to funnel status if needed
    const mappedPrevStatus = mapDatabaseStatusToFunnelStatus(lead.status);
    
    // Store the previous status (now mapped if needed)
    const prevStatus = mappedPrevStatus;

    // Update state to show movement is in progress
    setIsMoving(true);

    try {
      // First update the UI immediately for better UX
      const updatedFunnelData = { ...funnelData };

      // Verify the previous status exists and is an array before filtering
      if (
        prevStatus && 
        prevStatus in updatedFunnelData && 
        updatedFunnelData[prevStatus as keyof FunnelData] && 
        Array.isArray(updatedFunnelData[prevStatus as keyof FunnelData])
      ) {
        // Remove lead from the source column
        updatedFunnelData[prevStatus as keyof FunnelData] = updatedFunnelData[
          prevStatus as keyof FunnelData
        ].filter((item) => item._id !== lead._id);
      } else {
        console.warn(`Invalid source status: ${lead.status} (mapped to ${prevStatus})`, {
          originalStatus: lead.status,
          mappedStatus: prevStatus,
          hasKey: prevStatus in updatedFunnelData,
          valueType: updatedFunnelData[prevStatus as keyof FunnelData] ? 
            typeof updatedFunnelData[prevStatus as keyof FunnelData] : 'undefined',
          isArray: updatedFunnelData[prevStatus as keyof FunnelData] ? 
            Array.isArray(updatedFunnelData[prevStatus as keyof FunnelData]) : false
        });
        
        // Instead of returning early, let's try to continue if we can add to the target
        console.log("Continuing with move operation despite invalid source status");
      }

      // Verify the target status exists and is an array before adding to it
      if (
        !(targetStatus in updatedFunnelData) || 
        !updatedFunnelData[targetStatus as keyof FunnelData] ||
        !Array.isArray(updatedFunnelData[targetStatus as keyof FunnelData])
      ) {
        // Initialize the target column if it doesn't exist
        updatedFunnelData[targetStatus as keyof FunnelData] = [];
      }

      // Update lead status
      const updatedLead = { ...lead, status: targetStatus };

      // Add lead to the target column
      updatedFunnelData[targetStatus as keyof FunnelData] = [
        ...updatedFunnelData[targetStatus as keyof FunnelData],
        updatedLead,
      ];

      // Update state
      setFunnelData(updatedFunnelData);

      // Show confirmation modal only for moves to "customer" (purchase)
      if (targetStatus === "customer") {
        // Store the moving lead data for the modal
        setMovingLead({
          lead: updatedLead,
          prevStatus: lead.status, // Keep original status for API call
          newStatus: targetStatus,
        });
      } else {
        // For other statuses, update directly via API
        await updateLeadDirectly(updatedLead, lead.status, targetStatus); // Use original status for API call
      }
    } catch (error) {
      console.error("Error during lead move preparation:", error);
      toast("error", "Errore spostamento", "Si è verificato un errore durante lo spostamento del lead");
      
      // Safely revert UI state in case of error
      try {
        if (lead) {
          handleUndoMoveWithLead(lead, targetStatus, lead.status); // Use original status
        } else if (movingLead) {
          handleUndoMove();
        }
      } catch (undoError) {
        console.error("Failed to undo move:", undoError);
        // Force refresh as last resort
        onLeadMove().catch(e => console.error("Failed to refresh funnel data:", e));
      }
    } finally {
      if (targetStatus !== "customer") {
        setIsMoving(false);
      }
    }
  };

  // Function to directly update lead without showing modal
  const updateLeadDirectly = async (lead: FunnelItem, fromStage: string, toStage: string) => {
    try {
      // Recupera lo stato attuale dal server
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/leads/${lead._id}`,
        { withCredentials: true }
      );
      
      // Ottieni lo stato attuale dal database
      const currentDbStatus = checkResponse.data?.status;
      
      // Determina la mappatura degli stati solo per tipo booking
      let actualFromStage = fromStage;
      let actualToStage = toStage;
      
      if (lead.type === 'booking') {
        // Mappa gli stati del funnel a quelli del database per il tipo booking
        const bookingStatusMap: Record<string, string> = {
          'new': 'pending',
          'contacted': 'confirmed', 
          'qualified': 'completed',
          'opportunity': 'opportunity',
          'proposal': 'proposal',
          'customer': 'customer',
          'lost': 'cancelled'
        };
        
        // Se lo stato nel database è uno degli stati nativi delle prenotazioni,
        // usiamo quello come actual fromStage
        if (['pending', 'confirmed', 'completed', 'cancelled'].includes(currentDbStatus)) {
          // Nessun avviso, sappiamo che c'è una mappatura
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
          leadId: lead._id,
          leadType: lead.type,
          fromStage: actualFromStage, // Usa lo stato effettivo del database
          toStage: actualToStage,     // Usa lo stato mappato per la destinazione
          originalFromStage: fromStage, // Invia anche lo stato originale per riferimento
          originalToStage: toStage      // Invia anche lo stato destinazione originale
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

  // Handle confirming the lead move after showing the modal
  const handleConfirmMove = async () => {
    if (!movingLead) return;
    
    try {
      // Fetch the latest lead status first to ensure consistency
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/leads/${movingLead.lead._id}`,
        { withCredentials: true }
      );
      
      const currentStatus = checkResponse.data?.status || movingLead.prevStatus;
      
      // Only proceed if the current status matches our expected fromStage
      if (currentStatus !== movingLead.prevStatus) {
        console.warn(`Status mismatch: expected ${movingLead.prevStatus}, got ${currentStatus}`);
        
        // Show notification to user
        toast("warning", "Stato aggiornato", "Lo stato del lead è stato aggiornato da un altro utente");
        
        // Refresh funnel data to sync with server
        await onLeadMove();
        
        setMovingLead(null);
        setIsMoving(false);
        return;
      }
      
      // Call directly to the API to update to "customer" status
      // Purchase event will be handled by options in the modal
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: movingLead.lead._id,
          leadType: movingLead.lead.type,
          fromStage: movingLead.prevStatus,
          toStage: movingLead.newStatus
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Update funnel data via callback
        await onLeadMove();
        
        toast("success", "Lead convertito", "Lead convertito in cliente con successo");
      } else {
        throw new Error(response.data.message || "Errore durante la conversione del lead");
      }
    } catch (error) {
      console.error("Error during lead conversion:", error);
      
      // Restore previous state in case of error
      if (movingLead) {
        handleUndoMoveWithLead(
          movingLead.lead, 
          movingLead.newStatus, 
          movingLead.prevStatus
        );
      }
      
      // Extract error message for user feedback
      let errorMessage = "Si è verificato un errore durante la conversione del lead";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast("error", "Errore conversione", errorMessage);
      
      // Refresh funnel data to ensure consistency
      await onLeadMove();
    } finally {
      setMovingLead(null);
      setIsMoving(false);
    }
  };

  // Handle undoing the lead move if canceled
  const handleUndoMove = () => {
    // If we have movingLead data, use it to undo the move
    if (movingLead) {
      handleUndoMoveWithLead(
        movingLead.lead, 
        movingLead.newStatus, 
        movingLead.prevStatus
      );
      
      setMovingLead(null);
    } else {
      // If we don't have movingLead data, refresh the data from the server
      toast("info", "Aggiornamento dati", "Aggiornamento dei dati del funnel in corso...");
      
      onLeadMove().catch(error => {
        console.error("Error refreshing funnel data:", error);
        toast("error", "Errore aggiornamento", "Si è verificato un errore durante l'aggiornamento dei dati");
      });
    }
    
    setIsMoving(false);
  };
  
  // Support function for state restoration with status mapping
  const handleUndoMoveWithLead = (lead: FunnelItem, currentStatus: string, targetStatus: string) => {
    try {
      const updatedFunnelData = { ...funnelData };
      
      // Map the statuses from database status to funnel status if needed
      const mappedCurrentStatus = mapDatabaseStatusToFunnelStatus(currentStatus);
      const mappedTargetStatus = mapDatabaseStatusToFunnelStatus(targetStatus);

      // Verify the current status exists before attempting to filter
      if (
        mappedCurrentStatus && 
        mappedCurrentStatus in updatedFunnelData && 
        updatedFunnelData[mappedCurrentStatus as keyof FunnelData] && 
        Array.isArray(updatedFunnelData[mappedCurrentStatus as keyof FunnelData])
      ) {
        // Remove lead from the current column
        updatedFunnelData[mappedCurrentStatus as keyof FunnelData] = updatedFunnelData[
          mappedCurrentStatus as keyof FunnelData
        ].filter((item) => item._id !== lead._id);
      } else {
        console.warn(`Invalid current status during undo: ${currentStatus} (mapped to ${mappedCurrentStatus})`, {
          originalStatus: currentStatus,
          mappedStatus: mappedCurrentStatus,
          leadId: lead._id
        });
        // We'll continue and try to add to the target column
      }

      // Verify the target status exists before adding the lead back
      if (
        !(mappedTargetStatus in updatedFunnelData) || 
        !updatedFunnelData[mappedTargetStatus as keyof FunnelData] ||
        !Array.isArray(updatedFunnelData[mappedTargetStatus as keyof FunnelData])
      ) {
        // Initialize the target column if it doesn't exist
        updatedFunnelData[mappedTargetStatus as keyof FunnelData] = [];
      }

      // Restore lead to the target column with original status
      const revertedLead = { ...lead, status: targetStatus }; // Keep the original database status
      updatedFunnelData[mappedTargetStatus as keyof FunnelData] = [
        ...updatedFunnelData[mappedTargetStatus as keyof FunnelData],
        revertedLead,
      ];

      // Update state
      setFunnelData(updatedFunnelData);
    } catch (error) {
      console.error("Error during undo move:", error);
      toast("error", "Errore ripristino", "Si è verificato un errore durante il ripristino dello stato precedente");
      
      // Force refresh data from server as last resort
      onLeadMove().catch(e => 
        console.error("Failed to refresh funnel data:", e)
      );
    }
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
      await updateLeadMetadata(
        editingLead._id,
        editingLead.type,
        value,
        service
      );

      // Update local state for immediate UI update
      const updatedFunnelData = { ...funnelData };
      const mappedStatus = mapDatabaseStatusToFunnelStatus(editingLead.status);
      
      // Find and update the lead in its column
      if (
        mappedStatus in updatedFunnelData && 
        Array.isArray(updatedFunnelData[mappedStatus as keyof FunnelData])
      ) {
        updatedFunnelData[mappedStatus as keyof FunnelData] = updatedFunnelData[mappedStatus as keyof FunnelData].map((item) =>
          item._id === editingLead._id
            ? { ...item, value, service }
            : item
        );

        setFunnelData(updatedFunnelData);
        toast("success", "Lead aggiornato", "Valore e servizio aggiornati con successo");
      } else {
        // If we can't find the column, refresh the funnel data
        console.warn(`Could not find column ${mappedStatus} for edited lead`);
        await onLeadMove();
        toast("info", "Lead aggiornato", "Dati aggiornati, ricaricamento funnel");
      }
      
      setEditingLead(null);
    } catch (error) {
      console.error("Error updating lead value:", error);
      toast("error", "Errore aggiornamento", "Si è verificato un errore durante l'aggiornamento dei dati");
    }
  };

  // Draggable component
  const LeadCard = React.memo(({ lead }: { lead: FunnelItem }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    
    // useDrag with collection
    const [{ isDragging }, connectDrag] = useDrag(
      () => ({
        type: 'LEAD',
        item: { lead },
        collect: (monitor) => ({
          isDragging: !!monitor.isDragging(),
        }),
        end: (item, monitor) => {
          // Handle case where drag ends without a drop
          if (!monitor.didDrop()) {
            console.log('Drag terminated without drop');
          }
        }
      }),
      [lead]
    );
    
    // Connect the ref with connector via useEffect
    useEffect(() => {
      if (cardRef.current) {
        connectDrag(cardRef.current);
      }
    }, [connectDrag]);

    return (
      <div
        ref={cardRef}
        className={`funnel-card ${isDragging ? 'dragging' : ''}`}
        style={{
          borderLeftColor: getBorderColor(lead.status),
          opacity: isDragging ? 0.5 : 1,
          willChange: 'transform, opacity' // Performance optimization
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
  });
  
  LeadCard.displayName = 'LeadCard';

  // Column component
  const FunnelColumn = React.memo(({ id, title, color, leads }: { id: string; title: string; color: string; leads: FunnelItem[] }) => {
    const [isOver, setIsOver] = useState(false);
    
    // Standard ref for column body
    const bodyRef = useRef<HTMLDivElement>(null);
    
    // useDrop with collection - SIMPLIFIED hover handler
    const [{ isOverCurrent }, connectDrop] = useDrop(
      () => ({
        accept: 'LEAD',
        drop: (item: { lead: FunnelItem }) => {
          handleMoveLead(item.lead, id);
          return { status: id };
        },
        collect: (monitor) => ({
          isOverCurrent: !!monitor.isOver({ shallow: true }),
        }),
        hover: (item, monitor) => {
          if (!boardRef.current) return;
          
          // Update isOver state
          const isHovering = monitor.isOver({ shallow: true });
          if (isOver !== isHovering) {
            setIsOver(isHovering);
          }
          
          // Get mouse position
          const clientOffset = monitor.getClientOffset();
          if (!clientOffset) return;
          
          // Handle auto-scroll based on mouse position
          const containerRect = boardRef.current.getBoundingClientRect();
          const scrollAreaSize = Math.min(150, containerRect.width * 0.2);
          
          // Define scroll zones - 20% of container width on each side
          const leftScrollZone = containerRect.left + scrollAreaSize;
          const rightScrollZone = containerRect.right - scrollAreaSize;
          
          // Update scroll start time if we change direction or start scrolling
          if (
            (clientOffset.x < leftScrollZone && isScrolling !== "left") ||
            (clientOffset.x > rightScrollZone && isScrolling !== "right")
          ) {
            scrollStartTimeRef.current = Date.now();
          }
          
          // Determine if we should scroll and in which direction
          if (clientOffset.x < leftScrollZone) {
            setIsScrolling("left");
          } else if (clientOffset.x > rightScrollZone) {
            setIsScrolling("right");
          } else {
            setIsScrolling(null);
          }
        },
      }),
      [id, isOver, isScrolling]
    );
    
    // Connect the ref with connector via useEffect
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
          className={`funnel-body ${isOverCurrent ? 'drag-over' : ''}`}
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
  });
  
  FunnelColumn.displayName = 'FunnelColumn';

  return (
    <DndProvider
      backend={DndBackend}
      options={isTouchDevice() ? touchBackendOptions : undefined}
    >
      {/* Add our custom drag layer for better visual experience */}
      <CustomDragLayer snapToGrid={false} />
      
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

      {/* Facebook Event Modal for Lead Movement - Only for "customer" status */}
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
    case "pending": return "#71717a"; // same as new
    case "confirmed": return "#3498db"; // same as contacted
    case "completed": return "#FF6B00"; // same as qualified
    case "cancelled": return "#e74c3c"; // same as lost
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