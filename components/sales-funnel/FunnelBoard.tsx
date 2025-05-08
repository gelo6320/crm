// components/sales-funnel/FunnelBoard.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { FunnelData, FunnelItem } from "@/types";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import { toast } from "@/components/ui/toaster";
import axios from "axios";
import { updateLeadMetadata } from "@/lib/api/funnel";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragMoveEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Utils
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

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

interface CustomFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
}

// Main Component
export default function CustomFunnelBoard({ funnelData, setFunnelData, onLeadMove }: CustomFunnelBoardProps) {
  // State for modals and lead operations
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);
  
  // State for drag and drop
  const [activeLead, setActiveLead] = useState<FunnelItem | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  
  // Refs for the board and its elements
  const boardRef = useRef<HTMLDivElement>(null);
  // Usiamo due ref separate per i diversi tipi di timer
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastClientX = useRef<number | null>(null);
  
  // Determine if it's a touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Initialize sensors for drag and drop - optimized based on device type
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Pointer sensor for desktop with short delay
      activationConstraint: {
        delay: isTouchDevice ? 180 : 100,
        tolerance: isTouchDevice ? 8 : 5,
        // On touch devices, require press and hold before dragging starts
        // This allows normal scrolling without triggering drag
        ...( isTouchDevice ? { 
          pressure: 0.3, // Requires moderate pressure on touch devices
          pressDelay: 200 // Wait a bit before considering a press valid
        } : {})
      },
    }),
    useSensor(TouchSensor, {
      // Touch sensor with optimized constraints
      activationConstraint: {
        delay: 200,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {})
  );

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
      setFunnelData(updatedFunnelData);
    }
  }, []); // Run only on mount to avoid infinite loops

  // Auto-scroll function

  const handleAutoScroll = useCallback((clientX: number) => {
    if (!boardRef.current) return;
    
    const container = boardRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollWidth = container.scrollWidth;
    const containerWidth = containerRect.width;
    
    // Define scroll zones - 20% of container width on each side
    const scrollZoneSize = Math.min(150, containerWidth * 0.2);
    const leftScrollZone = containerRect.left + scrollZoneSize;
    const rightScrollZone = containerRect.right - scrollZoneSize;
    
    // Calculate scroll speed based on position in scroll zone (max 20px per frame)
    let scrollSpeed = 0;
    
    if (clientX < leftScrollZone) {
      // Left scroll zone - calculate distance from edge for dynamic speed
      const distanceFromEdge = Math.max(0, clientX - containerRect.left);
      const scrollFactor = 1 - (distanceFromEdge / scrollZoneSize);
      scrollSpeed = -Math.round(Math.min(20, 8 + (scrollFactor * 12)));
    } else if (clientX > rightScrollZone) {
      // Right scroll zone - calculate distance from edge for dynamic speed
      const distanceFromEdge = Math.max(0, containerRect.right - clientX);
      const scrollFactor = 1 - (distanceFromEdge / scrollZoneSize);
      scrollSpeed = Math.round(Math.min(20, 8 + (scrollFactor * 12)));
    }
    
    // If we need to scroll
    if (scrollSpeed !== 0) {
      // Check if we can scroll further in this direction
      if ((scrollSpeed < 0 && container.scrollLeft > 0) || 
          (scrollSpeed > 0 && container.scrollLeft < scrollWidth - containerWidth)) {
        
        // Auto-scroll in the calculated direction and speed
        container.scrollBy({
          left: scrollSpeed,
          behavior: 'auto' // Use instant scroll for smoother animation
        });
        
        // Store the last known client X position
        lastClientX.current = clientX;
        
        // Continue scrolling in the next frame if we're not already
        if (!animationFrameRef.current) {
          animationFrameRef.current = requestAnimationFrame(() => {
            animationFrameRef.current = null;
            if (lastClientX.current !== null) {
              handleAutoScroll(lastClientX.current);
            }
          });
        }
      }
    } else {
      // If not in a scroll zone, stop auto-scrolling
      lastClientX.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, []);

  // Clean up auto-scroll on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Get lead and column from the active element
    const [leadId, columnId] = active.id.toString().split('||');
    
    // Find the lead in the column
    const lead = funnelData[columnId as keyof FunnelData]?.find(
      item => item._id === leadId
    );
    
    if (lead) {
      setActiveLead(lead);
      setActiveColumnId(columnId);
      document.body.classList.add('is-dragging');
    }
    
    // Reset auto-scroll
    lastClientX.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Handle drag move - for auto-scrolling
  const handleDragMove = (event: DragMoveEvent) => {
    // Get pointer coordinates safely from the event
    const clientX = event.delta ? 
      (document.documentElement.clientWidth / 2) + event.delta.x :
      0;
    
    // If we have a valid clientX, start auto-scrolling
    if (clientX > 0) {
      handleAutoScroll(clientX);
    }
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    // Extract lead ID and source column ID from active
    const [leadId, sourceColumnId] = active.id.toString().split('||');
    
    // Get the target column ID
    const targetColumnId = over.id.toString();
    
    // If the target is the same column or not a valid column, ignore
    if (targetColumnId === sourceColumnId || !COLUMNS.some(col => col.id === targetColumnId)) {
      return;
    }
    
    // Source column must exist
    if (!sourceColumnId || !funnelData[sourceColumnId as keyof FunnelData]) {
      return;
    }
    
    // Find the lead in the source column
    const leadIndex = funnelData[sourceColumnId as keyof FunnelData].findIndex(
      item => item._id === leadId
    );
    
    if (leadIndex < 0) return;
    
    const lead = funnelData[sourceColumnId as keyof FunnelData][leadIndex];
    
    // Update the active lead's current location for visual feedback
    setActiveColumnId(targetColumnId);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    document.body.classList.remove('is-dragging');
    
    // Clear auto-scroll
    lastClientX.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (!over || !active || !activeLead) {
      setActiveLead(null);
      setActiveColumnId(null);
      return;
    }
    
    // Get target column ID
    const targetColumnId = over.id.toString();
    
    // Check if it's a valid column
    if (!COLUMNS.some(col => col.id === targetColumnId)) {
      setActiveLead(null);
      setActiveColumnId(null);
      return;
    }
    
    // Only move if the lead is being moved to a different column
    if (activeLead.status !== targetColumnId) {
      handleMoveLead(activeLead, targetColumnId);
    }
    
    setActiveLead(null);
    setActiveColumnId(null);
  };

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
        console.warn(`Invalid source status: ${lead.status} (mapped to ${prevStatus})`);
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
          lead: {
            ...updatedLead,
            // Ensure leadId is always available
            leadId: lead.leadId || lead._id
          },
          prevStatus: lead.status,
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
      // Use leadId instead of _id for the API call
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/leads/${lead.leadId || lead._id}`,
        { withCredentials: true }
      );
      
      // Get current status from database
      const currentDbStatus = checkResponse.data?.status;
      
      // Determine status mapping only for booking type
      let actualFromStage = fromStage;
      let actualToStage = toStage;
      
      if (lead.type === 'booking') {
        // Map funnel statuses to database statuses for booking type
        const bookingStatusMap: Record<string, string> = {
          'new': 'pending',
          'contacted': 'confirmed', 
          'qualified': 'completed',
          'opportunity': 'opportunity',
          'proposal': 'proposal',
          'customer': 'customer',
          'lost': 'cancelled'
        };
        
        // If the status in the database is one of the native booking statuses,
        // use that as the actual fromStage
        if (['pending', 'confirmed', 'completed', 'cancelled'].includes(currentDbStatus)) {
          actualFromStage = currentDbStatus;
        }
        
        // Map the destination status if needed
        if (bookingStatusMap[toStage]) {
          actualToStage = bookingStatusMap[toStage];
        }
      }
      
      // API call for actual move
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: lead.leadId || lead._id, // Use leadId with fallback
          leadType: lead.type,
          fromStage: actualFromStage,
          toStage: actualToStage,
          originalFromStage: fromStage,
          originalToStage: toStage
        },
        { withCredentials: true }
      );
      
      // If the API call is successful, update funnel data
      if (response.data.success) {
        // Update funnel data via callback
        await onLeadMove();
        
        toast("success", "Lead spostato", `Lead spostato con successo in ${toStage}`);
      } else {
        throw new Error(response.data.message || "Errore durante lo spostamento del lead");
      }
    } catch (error) {
      console.error("Error during lead move:", error);
      
      // Restore previous state in case of error
      handleUndoMoveWithLead(lead, toStage, fromStage);
      
      // Extract error message for user feedback
      let errorMessage = "Si è verificato un errore durante lo spostamento del lead";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast("error", "Errore spostamento", errorMessage);
      
      // Update funnel data to ensure consistency
      await onLeadMove();
    } finally {
      setIsMoving(false);
    }
  };

  // Handle confirming the lead move after showing the modal
  const handleConfirmMove = async () => {
    if (!movingLead) return;
    
    try {
      // Always get and use the right ID
      const idToUse = movingLead.lead.leadId || movingLead.lead._id;
      
      const checkResponse = await axios.get(
        `${API_BASE_URL}/api/leads/${idToUse}`,
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
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: movingLead.lead.leadId || movingLead.lead._id, // Use leadId with fallback
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
        console.warn(`Invalid current status during undo: ${currentStatus} (mapped to ${mappedCurrentStatus})`);
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
      // Update the lead metadata via API using leadId
      await updateLeadMetadata(
        editingLead.leadId || editingLead._id, // Use leadId with fallback
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

  // Lead card component
  const LeadCard = React.memo(({ lead, columnId }: { lead: FunnelItem, columnId: string }) => {
    return (
      <div 
        className="funnel-card"
        style={{
          borderLeftColor: getBorderColor(lead.status),
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

  // Draggable lead card
  const DraggableLeadCard = React.memo(({ lead, columnId }: { lead: FunnelItem, columnId: string }) => {
    // Create a composite ID for the lead (lead._id + column)
    const compositeId = `${lead._id}||${columnId}`;
    
    return (
      <div 
        className="funnel-draggable"
        data-lead-id={lead._id}
        data-column-id={columnId}
      >
        <LeadCard lead={lead} columnId={columnId} />
      </div>
    );
  });
  
  DraggableLeadCard.displayName = 'DraggableLeadCard';

  // Column component
  const FunnelColumn = React.memo(({ 
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
    return (
      <div className={`funnel-column ${isMoving ? 'column-fade-transition' : ''}`}>
        <div className={`funnel-header ${color}`}>
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
            {leads.length}
          </div>
        </div>
        
        <div
          className={`funnel-body ${activeColumnId === id ? 'drag-over' : ''}`}
          data-column-id={id}
        >
          <SortableContext 
            items={leads.map(lead => `${lead._id}||${id}`)}
            strategy={verticalListSortingStrategy}
          >
            {leads.length > 0 ? (
              leads.map((lead) => (
                <DraggableLeadCard 
                  key={`${lead._id}||${id}`}
                  lead={lead} 
                  columnId={id}
                />
              ))
            ) : (
              <div className="text-center text-zinc-500 text-xs italic py-4">
                Nessun lead
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    );
  });
  
  FunnelColumn.displayName = 'FunnelColumn';

  // Custom DragOverlay component is no longer needed since we're using the one from dnd-kit
  // We'll use the official DragOverlay component from dnd-kit directly

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              leads={funnelData[column.id as keyof FunnelData] || []}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay - enhanced visualization */}
      <DragOverlay>
        {activeLead && (
          <div 
            style={{
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
              width: '250px', // Fixed width for preview
              borderLeft: `3px solid ${getBorderColor(activeLead.status)}`,
              background: '#18181b',
              borderRadius: '6px',
              transform: isTouchDevice ? 'scale(1.05)' : 'scale(1.02)',
              opacity: 0.9,
              cursor: 'grabbing'
            }}
          >
            <LeadCard lead={activeLead} columnId={activeColumnId || ''} />
          </div>
        )}
      </DragOverlay>

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
    case "pending": return "#71717a"; // same as new
    case "confirmed": return "#3498db"; // same as contacted
    case "completed": return "#FF6B00"; // same as qualified
    case "cancelled": return "#e74c3c"; // same as lost
    default: return "#71717a"; // zinc-500
  }
}