// components/sales-funnel/FunnelColumn.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import { FunnelItem } from "@/types";

interface FunnelColumnProps {
  id: string;
  title: string;
  color: string;
  children: React.ReactNode;
  onMoveLead: (lead: FunnelItem, targetStatus: string) => void;
  isMoving: boolean;
}

export default function FunnelColumn({ id, title, color, children, onMoveLead, isMoving }: FunnelColumnProps) {
  // Create a standard React ref
  const dropRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  
  // Set up the drop target - SIMPLIFIED without competing autoscroll
  const [{ isOverCurrent }, dropTarget] = useDrop({
    accept: 'LEAD',
    drop: (item: { lead: FunnelItem }) => {
      // Only move if the status is different
      if (item.lead.status !== id) {
        onMoveLead(item.lead, id);
      }
    },
    hover: (item, monitor) => {
      if (!dropRef.current) return;
      
      // When element is over this column, set isOver to true
      const isHovering = monitor.isOver({ shallow: true });
      setIsOver(isHovering);
      
      // We removed all auto-scroll logic from here - it's now handled in FunnelBoard.tsx
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true })
    }),
  });

  // Connect the drop ref to the component ref
  useEffect(() => {
    if (dropRef.current) {
      dropTarget(dropRef.current);
    }
  }, [dropTarget]);

  return (
    <div className={`funnel-column ${isMoving ? 'column-fade-transition' : ''}`}>
      <div className={`funnel-header ${color}`}>
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
          {Array.isArray(children) ? children.length : 0}
        </div>
      </div>
      
      <div 
        ref={dropRef} 
        className={`funnel-body ${isOverCurrent ? "drag-over" : ""}`}
      >
        {Array.isArray(children) && children.length > 0 ? (
          children
        ) : (
          <div className="text-center text-zinc-500 text-xs italic py-4">
            Nessun lead
          </div>
        )}
      </div>
    </div>
  );
}