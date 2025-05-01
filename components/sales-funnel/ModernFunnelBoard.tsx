// components/sales-funnel/ModernFunnelBoard.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls } from "framer-motion";
import { FunnelData, FunnelItem } from "@/types";
import { updateLeadMetadata } from "@/lib/api/funnel";
import { toast } from "@/components/ui/toaster";
import axios from "axios";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";
import ValueModal from "./ModernValueModal";
import FacebookEventModal from "./ModernFacebookEventModal";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.costruzionedigitale.com";

// Columns configuration
const COLUMNS = [
  { id: "new", title: "Nuovi", color: "#FF6B00" },
  { id: "contacted", title: "Contattati", color: "#FF7A1F" },
  { id: "qualified", title: "Qualificati", color: "#FF8A3E" },
  { id: "opportunity", title: "Opportunità", color: "#FF9A5D" },
  { id: "proposal", title: "Proposta", color: "#FFAA7C" },
  { id: "customer", title: "Clienti", color: "#27ae60" },
  { id: "lost", title: "Persi", color: "#e74c3c" },
];

interface ModernFunnelBoardProps {
  funnelData: FunnelData;
  setFunnelData: React.Dispatch<React.SetStateAction<FunnelData>>;
  onLeadMove: () => Promise<void>;
}

export default function ModernFunnelBoard({ funnelData, setFunnelData, onLeadMove }: ModernFunnelBoardProps) {
  const [editingLead, setEditingLead] = useState<FunnelItem | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingLead, setMovingLead] = useState<{
    lead: FunnelItem;
    prevStatus: string;
    newStatus: string;
  } | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [currentlyDragging, setCurrentlyDragging] = useState<FunnelItem | null>(null);
  
  // Ref for the main container
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Handle scrolling functionality
  useEffect(() => {
    const handleScroll = () => {
      const container = boardRef.current;
      if (container) {
        // Logic for scroll indicators
        const isAtStart = container.scrollLeft === 0;
        const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
        
        // Add classes for styling scroll indicators
        if (isAtStart) {
          container.classList.remove('can-scroll-left');
        } else {
          container.classList.add('can-scroll-left');
        }
        
        if (isAtEnd) {
          container.classList.remove('can-scroll-right');
        } else {
          container.classList.add('can-scroll-right');
        }
      }
    };
    
    const container = boardRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      // Handle resize events
      window.addEventListener('resize', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
  // Scroll to a column
  const scrollToColumn = (direction: 'left' | 'right') => {
    const container = boardRef.current;
    if (!container) return;
    
    const scrollAmount = 300; // px to scroll
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
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

    // Show confirmation modal only for movements to "customer" (acquisition)
    if (targetStatus === "customer") {
      // Store the moving lead data for the modal
      setMovingLead({
        lead: updatedLead,
        prevStatus,
        newStatus: targetStatus,
      });
    } else {
      // For other statuses, update directly via API
      updateLeadDirectly(updatedLead, prevStatus, targetStatus);
    }
  };

  // Function to directly update the lead without showing modal
  const updateLeadDirectly = async (lead: FunnelItem, fromStage: string, toStage: string) => {
    try {
      // Call the funnel API directly for normal movement
      const response = await axios.post(
        `${API_BASE_URL}/api/sales-funnel/move`,
        {
          leadId: lead._id,
          leadType: lead.type,
          fromStage: fromStage,
          toStage: toStage
        },
        { withCredentials: true }
      );
      
      // If the API call is successful, update the funnel data
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
      toast("error", "Errore spostamento", "Si è verificato un errore durante lo spostamento del lead");
    } finally {
      setIsMoving(false);
    }
  };

  // Handle confirming the lead move after showing the modal
  const handleConfirmMove = async () => {
    if (!movingLead) return;
    
    try {
      // Directly call the API to update the state to "customer"
      // The purchase event will be handled by the options in the modal
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
      
      toast("error", "Errore conversione", "Si è verificato un errore durante la conversione del lead");
    } finally {
      setMovingLead(null);
      setIsMoving(false);
    }
  };

  // Handle undoing the lead move if canceled
  const handleUndoMove = () => {
    if (!movingLead) return;
    
    handleUndoMoveWithLead(
      movingLead.lead, 
      movingLead.newStatus, 
      movingLead.prevStatus
    );
    
    setMovingLead(null);
    setIsMoving(false);
  };
  
  // Support function for state restoration
  const handleUndoMoveWithLead = (lead: FunnelItem, currentStatus: string, targetStatus: string) => {
    const updatedFunnelData = { ...funnelData };

    // Remove lead from the current column
    updatedFunnelData[currentStatus as keyof FunnelData] = updatedFunnelData[
      currentStatus as keyof FunnelData
    ].filter((item) => item._id !== lead._id);

    // Restore lead to the target column with original status
    const revertedLead = { ...lead, status: targetStatus };
    updatedFunnelData[targetStatus as keyof FunnelData] = [
      ...updatedFunnelData[targetStatus as keyof FunnelData],
      revertedLead,
    ];

    // Update state
    setFunnelData(updatedFunnelData);
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
      
      toast("success", "Lead aggiornato", "Valore e servizio aggiornati con successo");
    } catch (error) {
      console.error("Error updating lead value:", error);
      toast("error", "Errore aggiornamento", "Si è verificato un errore durante l'aggiornamento dei dati");
    }
  };

  // Draggable card component
  const LeadCard = ({ lead, columnId }: { lead: FunnelItem; columnId: string }) => {
    const dragControls = useDragControls();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const scale = useTransform(y, [-100, 0, 100], [0.8, 1, 0.8]);
    const rotate = useTransform(x, [-100, 0, 100], [-10, 0, 10]);
    const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);
    
    // Get border color
    const getBorderColor = (status: string): string => {
      const column = COLUMNS.find(col => col.id === status);
      return column ? column.color : "#71717a";
    };
    
    return (
      <motion.div
        drag
        dragControls={dragControls}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        style={{
    x, 
    y, 
    scale, 
    rotate, 
    opacity,
    borderLeftColor: getBorderColor(lead.status),
    borderLeftWidth: '3px',
  }}
        whileDrag={{ 
          zIndex: 50, 
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          cursor: "grabbing"
        }}
        onDragStart={() => {
          setCurrentlyDragging(lead);
          setActiveColumn(columnId);
        }}
        onDragEnd={(e, info) => {
          // Reset states
          setCurrentlyDragging(null);
          setActiveColumn(null);
          
          // Calculate if we should move the lead based on drag distance
          // For simplicity, we'll just check vertical drag distance
          // In a real implementation, we'd check which column we're over
          if (Math.abs(info.offset.y) > 100) {
            const columnIndex = COLUMNS.findIndex(col => col.id === columnId);
            let targetColumnId;
            
            // Determine if dragging up (previous column) or down (next column)
            if (info.offset.y < -100 && columnIndex > 0) {
              // Dragged up - move to previous column
              targetColumnId = COLUMNS[columnIndex - 1].id;
            } else if (info.offset.y > 100 && columnIndex < COLUMNS.length - 1) {
              // Dragged down - move to next column
              targetColumnId = COLUMNS[columnIndex + 1].id;
            }
            
            if (targetColumnId) {
              handleMoveLead(lead, targetColumnId);
            }
          }
        }}
        className="funnel-card-modern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="font-medium text-sm truncate pr-1 text-white">
            {lead.name}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleEditLead(lead);
            }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </motion.button>
        </div>
        <div className="text-xs text-zinc-400">
          <div>{formatDate(lead.createdAt)}</div>
          {lead.value ? 
            <div className="text-orange-400 font-medium my-1">€{formatMoney(lead.value)}</div> : ''}
          {lead.service ? <div className="italic">{lead.service}</div> : ''}
        </div>
      </motion.div>
    );
  };

  // Column component
  const FunnelColumn = ({ id, title, color, leads }: { id: string; title: string; color: string; leads: FunnelItem[] }) => {
    const isActive = activeColumn === id || (!activeColumn && currentlyDragging === null);
    
    return (
      <motion.div 
        className={`funnel-column-modern ${isActive ? 'active' : ''} ${isMoving ? 'column-fade' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: COLUMNS.findIndex(col => col.id === id) * 0.05 }}
        layout
      >
        <div 
          className="funnel-header-modern" 
          style={{ backgroundColor: color, color: "#000" }}
        >
          <h3 className="text-sm font-semibold">{title}</h3>
          <motion.div 
            className="counter"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {leads.length}
          </motion.div>
        </div>
        
        <motion.div 
          className={`funnel-body-modern ${currentlyDragging && !isActive ? 'dimmed' : ''}`}
          onDragOver={() => {
            if (currentlyDragging && currentlyDragging.status !== id) {
              setActiveColumn(id);
            }
          }}
          onDragLeave={() => {
            if (activeColumn === id) {
              setActiveColumn(null);
            }
          }}
          onDrop={() => {
            if (currentlyDragging && activeColumn === id) {
              handleMoveLead(currentlyDragging, id);
              setCurrentlyDragging(null);
              setActiveColumn(null);
            }
          }}
          layout
        >
          <AnimatePresence>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <LeadCard key={lead._id} lead={lead} columnId={id} />
              ))
            ) : (
              <motion.div 
                className="empty-column"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center text-zinc-500 text-xs italic py-4">
                  Nessun lead
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  };
  
  // Custom drag overlay for mobile
  const DragOverlay = () => {
    if (!currentlyDragging) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/30">
        <div className="text-white text-center text-sm">
          <div className="mb-2">Trascina a:</div>
          <div className="flex gap-2 justify-center">
            {COLUMNS.map(column => (
              <div 
                key={column.id}
                className={`px-2 py-1 rounded text-xs ${currentlyDragging.status === column.id ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-white'}`}
              >
                {column.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="funnel-container-modern">
      {/* Navigation arrows for horizontal scrolling */}
      <div className="scroll-controls">
        <motion.button 
          className="scroll-arrow left"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scrollToColumn('left')}
        >
          <ChevronLeft size={20} />
        </motion.button>
        
        <motion.button 
          className="scroll-arrow right"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scrollToColumn('right')}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>
      
      {/* Main board container */}
      <div
        ref={boardRef}
        className="funnel-board-container-modern"
      >
        <motion.div 
          className="funnel-board-modern"
          layout
        >
          {COLUMNS.map((column) => (
            <FunnelColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              leads={funnelData[column.id as keyof FunnelData]}
            />
          ))}
        </motion.div>
      </div>
      
      {/* Custom drag overlay for mobile */}
      {currentlyDragging && <DragOverlay />}

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
    </div>
  );
}