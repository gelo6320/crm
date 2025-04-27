// components/sales-funnel/FunnelBoard.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import FacebookEventModal from "./FacebookEventModal";
import ValueModal from "./ValueModal";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

// React DnD imports
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

// Conditional backend detection
const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;
const touchBackendOptions = {
  enableMouseEvents: true, // Allow mouse events on touch devices
  delayTouchStart: 100, // Small delay to avoid conflict with scroll
};

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

  // Auto-scroll handler function that can be reused
  const handleAutoScroll = useCallback((clientX: number) => {
    if (!boardRef.current) return false;
    
    // Get container dimensions
    const containerRect = boardRef.current.getBoundingClientRect();
    const containerScrollLeft = boardRef.current.scrollLeft;
    const containerWidth = boardRef.current.clientWidth;
    const containerScrollWidth = boardRef.current.scrollWidth;
    
    // Define auto-scroll zones (20% of each side)
    const scrollZoneSize = Math.min(150, containerWidth * 0.2);
    
    // Calculate scroll zone positions relative to the container
    const leftScrollZone = containerRect.left + scrollZoneSize;
    const rightScrollZone = containerRect.right - scrollZoneSize;
    
    // Calculate scroll speed based on distance from edge
    const calculateScrollSpeed = (distance: number, maxDistance: number) => {
      const baseSpeed = 5;
      const maxSpeed = 20;
      const ratio = 1 - Math.min(1, Math.max(0, distance / maxDistance));
      return Math.round(baseSpeed + ((maxSpeed - baseSpeed) * ratio));
    };
    
    // Scroll left if in left zone
    if (clientX < leftScrollZone) {
      const distance = clientX - containerRect.left;
      const scrollSpeed = calculateScrollSpeed(distance, scrollZoneSize);
      
      // Check if we can scroll further left
      if (containerScrollLeft > 0) {
        boardRef.current.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
        return true; // We scrolled
      }
    }
    // Scroll right if in right zone
    else if (clientX > rightScrollZone) {
      const distance = containerRect.right - clientX;
      const scrollSpeed = calculateScrollSpeed(distance, scrollZoneSize);
      
      // Check if we can scroll further right
      if (containerScrollLeft < containerScrollWidth - containerWidth) {
        boardRef.current.scrollBy({ left: scrollSpeed, behavior: 'auto' });
        return true; // We scrolled
      }
    }
    
    return false; // No scroll occurred
  }, []);

  // Draggable component
  const LeadCard = ({ lead }: { lead: FunnelItem }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
      type: 'LEAD',
      item: { lead },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      end: (item, monitor) => {
        if (!monitor.didDrop()) {
          console.log('Drag terminated without drop');
        }
      }
    });
    
    // Set up the ref using a function instead of direct assignment
    // This fixes the TypeScript error
    const setCardRef = useCallback((node: HTMLDivElement | null) => {
      // First update our internal ref
      cardRef.current = node;
      // Then call the drag ref function
      drag(node);
    }, [drag]);

    return (
      <div
        ref={setCardRef}
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
            <Pencil size={12} />
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

  // Column component
  const FunnelColumn = ({ id, title, color, leads }: { id: string; title: string; color: string; leads: FunnelItem[] }) => {
    const columnBodyRef = useRef<HTMLDivElement>(null);
    
    const [{ isOver }, drop] = useDrop({
      accept: 'LEAD',
      drop: (item: { lead: FunnelItem }) => {
        handleMoveLead(item.lead, id);
        return { status: id };
      },
      hover: (item, monitor) => {
        // Handle auto-scrolling during hover
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        
        // Call auto-scroll function
        if (handleAutoScroll(clientOffset.x)) {
          // If we scrolled, request another frame to continue
          requestAnimationFrame(() => {
            const newOffset = monitor.getClientOffset();
            if (newOffset) {
              handleAutoScroll(newOffset.x);
            }
          });
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    });
    
    // Set up the ref using a function instead of direct assignment
    // This fixes the TypeScript error
    const setColumnBodyRef = useCallback((node: HTMLDivElement | null) => {
      // First update our internal ref
      columnBodyRef.current = node;
      // Then call the drop ref function
      drop(node);
    }, [drop]);

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
          ref={setColumnBodyRef}
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
      {/* Add our custom drag layer for better visual experience */}
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