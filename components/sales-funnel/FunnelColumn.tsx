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
  // Crea un ref React standard
  const dropRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  
  // Set up the drop target
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
      
      // Quando l'elemento è sopra questa colonna, imposta isOver a true
      const isHovering = monitor.isOver({ shallow: true });
      setIsOver(isHovering);
      
      // Auto-scroll laterale quando si arriva al bordo
      const boardContainer = document.getElementById('funnel-board-container');
      if (boardContainer && isHovering) {
        const containerRect = boardContainer.getBoundingClientRect();
        const columnRect = dropRef.current.getBoundingClientRect();
        
        // Calcola la distanza dal bordo destro e sinistro
        const rightEdgeDistance = containerRect.right - columnRect.right;
        const leftEdgeDistance = columnRect.left - containerRect.left;
        
        // Se siamo vicini al bordo destro, scorri a destra
        if (rightEdgeDistance < 100) {
          boardContainer.scrollBy({ left: 10, behavior: 'smooth' });
        }
        
        // Se siamo vicini al bordo sinistro, scorri a sinistra
        if (leftEdgeDistance < 100) {
          boardContainer.scrollBy({ left: -10, behavior: 'smooth' });
        }
      }
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true })
    }),
  });

  // Collega il ref drop al ref del componente
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