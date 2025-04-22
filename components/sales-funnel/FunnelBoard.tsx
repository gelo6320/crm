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

// Custom scroll zone sizes (percentage of viewport width)
const SCROLL_ZONE_SIZE = 25; // 25% on each side

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
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);
  
  // Start dragging a lead
  const handleDragStart = (lead: FunnelItem, e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent default browser drag behavior
    e.preventDefault();
    
    // Store the lead being dragged
    setDraggedLead(lead);
    
    // Store drag origin
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOrigin({
      status: lead.status,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Set initial drag position
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Add event listeners for drag motion and end
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Show the drag preview
    if (dragItemRef.current) {
      dragItemRef.current.style.display = 'block';
    }
  };
  
  // Handle drag movement
  const handleDragMove = (e: MouseEvent) => {
    if (!draggedLead || !dragOrigin) return;
    
    // Update drag position
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Check which column we're over
    const columns = document.querySelectorAll('.funnel-column');
    let hoveredColumn: Element | null = null;
    
    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right) {
        hoveredColumn = column;
      }
    });
    
    // Update target column
    setTargetColumn(hoveredColumn ? (hoveredColumn as HTMLElement).id : null);
    
    // Handle auto-scrolling
    handleAutoScroll(e);
  };
  
  // Handle auto-scrolling when dragging near the edges
  const handleAutoScroll = (e: MouseEvent) => {
    if (!boardRef.current) return;
    
    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    
    // Calculate scroll zones (percentage of viewport width)
    const leftScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    const rightScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    
    // Left and right boundaries for scroll zones
    const leftScrollZone = boardRect.left + leftScrollZoneWidth;
    const rightScrollZone = boardRect.right - rightScrollZoneWidth;
    
    // Clear any existing scroll interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Check if the mouse is in a scroll zone
    if (e.clientX < leftScrollZone) {
      // Calculate scroll speed - faster as you get closer to the edge
      const distanceFromEdge = e.clientX - boardRect.left;
      const scrollSpeed = calculateScrollSpeed(distanceFromEdge, leftScrollZoneWidth);
      
      // Start scrolling left
      scrollIntervalRef.current = setInterval(() => {
        board.scrollLeft -= scrollSpeed;
      }, 16); // ~60fps
    } 
    else if (e.clientX > rightScrollZone) {
      // Calculate scroll speed
      const distanceFromEdge = boardRect.right - e.clientX;
      const scrollSpeed = calculateScrollSpeed(distanceFromEdge, rightScrollZoneWidth);
      
      // Start scrolling right
      scrollIntervalRef.current = setInterval(() => {
        board.scrollLeft += scrollSpeed;
      }, 16);
    }
  };
  
  // Calculate scroll speed based on distance from edge
  const calculateScrollSpeed = (distance: number, maxDistance: number): number => {
    // Map distance to a speed between 5 and 25 pixels per tick
    // Closer to the edge = faster scrolling
    const minSpeed = 5;
    const maxSpeed = 25;
    const speedRange = maxSpeed - minSpeed;
    
    // Calculate normalized distance (0 = edge, 1 = farthest from edge)
    const normalizedDistance = Math.min(1, distance / maxDistance);
    
    // Invert and scale to get higher speed closer to edge
    const speed = minSpeed + speedRange * (1 - normalizedDistance);
    
    return Math.round(speed);
  };
  
  // End dragging
  const handleDragEnd = (e: MouseEvent) => {
    // Clean up event listeners
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Clear any scroll interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Handle the drop if over a valid column
    if (draggedLead && targetColumn && targetColumn !== draggedLead.status) {
      handleMoveLead(draggedLead, targetColumn);
    }
    
    // Hide the drag preview
    if (dragItemRef.current) {
      dragItemRef.current.style.display = 'none';
    }
    
    // Reset drag state
    setDraggedLead(null);
    setDragOrigin(null);
    setDragPosition(null);
    setTargetColumn(null);
  };
  
  // Handle touch start for mobile
  const handleTouchStart = (lead: FunnelItem, e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    
    // Store the lead being dragged
    setDraggedLead(lead);
    
    // Store drag origin
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOrigin({
      status: lead.status,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    
    // Set initial drag position
    setDragPosition({ x: touch.clientX, y: touch.clientY });
    
    // Show the drag preview
    if (dragItemRef.current) {
      dragItemRef.current.style.display = 'block';
    }
  };
  
  // Handle touch move for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggedLead || !dragOrigin) return;
    
    // Prevent scrolling
    e.preventDefault();
    
    const touch = e.touches[0];
    
    // Update drag position
    setDragPosition({ x: touch.clientX, y: touch.clientY });
    
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
    setTargetColumn(hoveredColumn ? (hoveredColumn as HTMLElement).id : null);
    
    // Handle auto-scrolling for touch
    if (boardRef.current) {
      const board = boardRef.current;
      const boardRect = board.getBoundingClientRect();
      
      // Calculate scroll zones (percentage of viewport width)
      const leftScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
      const rightScrollZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
      
      // Clear any existing scroll interval
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      
      // Check if touch is in a scroll zone
      if (touch.clientX < boardRect.left + leftScrollZoneWidth) {
        // Start scrolling left
        const distanceFromEdge = touch.clientX - boardRect.left;
        const scrollSpeed = calculateScrollSpeed(distanceFromEdge, leftScrollZoneWidth);
        
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft -= scrollSpeed;
        }, 16);
      } 
      else if (touch.clientX > boardRect.right - rightScrollZoneWidth) {
        // Start scrolling right
        const distanceFromEdge = boardRect.right - touch.clientX;
        const scrollSpeed = calculateScrollSpeed(distanceFromEdge, rightScrollZoneWidth);
        
        scrollIntervalRef.current = setInterval(() => {
          board.scrollLeft += scrollSpeed;
        }, 16);
      }
    }
  };
  
  // Handle touch end for mobile
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // Clear any scroll interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Handle the drop if over a valid column
    if (draggedLead && targetColumn && targetColumn !== draggedLead.status) {
      handleMoveLead(draggedLead, targetColumn);
    }
    
    // Hide the drag preview
    if (dragItemRef.current) {
      dragItemRef.current.style.display = 'none';
    }
    
    // Reset drag state
    setDraggedLead(null);
    setDragOrigin(null);
    setDragPosition(null);
    setTargetColumn(null);
  };

  // Debugging functions for drag positions
  const DEBUG = false;
  const logDragPos = () => {
    if (!DEBUG || !dragPosition) return null;
    
    const leftZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    const rightZoneWidth = window.innerWidth * (SCROLL_ZONE_SIZE / 100);
    
    const inLeftZone = dragPosition.x < leftZoneWidth;
    const inRightZone = dragPosition.x > window.innerWidth - rightZoneWidth;
    
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs">
        <div>Mouse X: {dragPosition.x}</div>
        <div>Mouse Y: {dragPosition.y}</div>
        <div>
          Zone: {inLeftZone ? "LEFT" : inRightZone ? "RIGHT" : "CENTER"}
        </div>
        <div>Target: {targetColumn || "none"}</div>
      </div>
    );
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
    if (!dragPosition || !dragOrigin) return { display: 'none' };
    
    return {
      display: 'block',
      position: 'fixed' as 'fixed',
      left: `${dragPosition.x - (dragOrigin?.x || 0)}px`,
      top: `${dragPosition.y - (dragOrigin?.y || 0)}px`,
      opacity: 0.8,
      zIndex: 1000,
      pointerEvents: 'none' as 'none',
      transform: 'rotate(4deg)',
      width: '250px',
    };
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
                      className={`funnel-card ${draggedLead?._id === lead._id ? 'opacity-40' : ''}`}
                      style={{ 
                        borderLeftColor: getBorderColor(lead.status),
                      }}
                      onMouseDown={(e) => handleDragStart(lead, e)}
                      onTouchStart={(e) => handleTouchStart(lead, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-medium text-sm truncate pr-1">
                          {lead.name}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLead(lead);
                          }}
                          className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-zinc-400">
                        <div>{formatDate(lead.createdAt)}</div>
                        {lead.value && (
                          <div className="text-primary font-medium my-1">
                            €{formatMoney(lead.value)}
                          </div>
                        )}
                        {lead.service && (
                          <div className="italic">{lead.service}</div>
                        )}
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
      
      {/* Drag preview */}
      {draggedLead && (
        <div 
          ref={dragItemRef}
          className="funnel-card"
          style={{ 
            ...getDragPreviewStyle(),
            borderLeftColor: getBorderColor(draggedLead.status),
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium text-sm truncate pr-1">
              {draggedLead.name}
            </div>
            <button className="p-1 rounded-full hover:bg-zinc-700 transition-colors">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-zinc-400">
            <div>{formatDate(draggedLead.createdAt)}</div>
            {draggedLead.value && (
              <div className="text-primary font-medium my-1">
                €{formatMoney(draggedLead.value)}
              </div>
            )}
            {draggedLead.service && (
              <div className="italic">{draggedLead.service}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Debug overlay */}
      {logDragPos()}

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