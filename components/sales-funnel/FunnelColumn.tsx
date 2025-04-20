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
      
      // Ottieni la posizione del mouse
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Auto-scroll laterale - ora funziona su tutta la viewport
      const viewportWidth = window.innerWidth;
      
      // Dividiamo lo schermo in tre parti: 30% a sinistra, 40% al centro, 30% a destra
      const leftZone = viewportWidth * 0.3;
      const rightZone = viewportWidth * 0.7;
      
      // Velocità di scorrimento progressiva - più vicino al bordo, più veloce lo scorrimento
      const calculateScrollSpeed = (distance: number, max: number) => {
        // Velocità di base: da 5px a 25px per scorrimento
        const baseSpeed = 5;
        const maxAdditionalSpeed = 20;
        const ratio = 1 - (distance / max);
        return baseSpeed + (maxAdditionalSpeed * ratio);
      };
      
      // Se siamo nella zona sinistra, scorriamo a sinistra con velocità proporzionale
      if (clientOffset.x < leftZone) {
        const speed = calculateScrollSpeed(clientOffset.x, leftZone);
        const boardContainer = document.getElementById('funnel-board-container');
        if (boardContainer) {
          boardContainer.scrollBy({ left: -speed, behavior: 'auto' });
        }
      }
      
      // Se siamo nella zona destra, scorriamo a destra con velocità proporzionale
      else if (clientOffset.x > rightZone) {
        const speed = calculateScrollSpeed(viewportWidth - clientOffset.x, viewportWidth - rightZone);
        const boardContainer = document.getElementById('funnel-board-container');
        if (boardContainer) {
          boardContainer.scrollBy({ left: speed, behavior: 'auto' });
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