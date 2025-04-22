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
      if (!clientOffset) {
        console.log("[SCROLL DEBUG] Nessun clientOffset disponibile");
        return;
      }
      
      // Ottieni il contenitore delle colonne
      const boardContainer = document.getElementById('funnel-board-container');
      if (!boardContainer) {
        console.error("[SCROLL DEBUG] ERRORE: Elemento #funnel-board-container non trovato!");
        return;
      }
      
      // NUOVO APPROCCIO: Calcola il viewport effettivo del container visibile
      const containerRect = boardContainer.getBoundingClientRect();
      
      // Qui otteniamo i limiti visibili del container nella viewport
      const visibleLeft = Math.max(0, containerRect.left);
      const visibleRight = Math.min(window.innerWidth, containerRect.right);
      const visibleWidth = visibleRight - visibleLeft;
      
      // Creiamo zone di scroll ai bordi dell'area visibile del container
      // Le zone saranno del 15% a sinistra e a destra dell'area visibile
      const scrollZoneSize = Math.min(150, visibleWidth * 0.15); // 15% o max 150px
      
      const leftScrollZone = visibleLeft + scrollZoneSize;
      const rightScrollZone = visibleRight - scrollZoneSize;
      
      // Log per debug
      console.log(`[SCROLL DEBUG] Container visibile: ${visibleLeft}-${visibleRight}, larghezza: ${visibleWidth}px`);
      console.log(`[SCROLL DEBUG] Zone di scroll: sinistra <${leftScrollZone}, destra >${rightScrollZone}`);
      console.log(`[SCROLL DEBUG] Mouse position: ${clientOffset.x}`);
      
      // Velocità di scorrimento progressiva - più vicino al bordo, più veloce lo scorrimento
      const calculateScrollSpeed = (distance: number, max: number) => {
        // Velocità di base: da 8px a 28px per scorrimento
        const baseSpeed = 8;
        const maxAdditionalSpeed = 20;
        const ratio = Math.min(1, 1 - (distance / max));
        return Math.round(baseSpeed + (maxAdditionalSpeed * ratio));
      };
      
      // Se siamo nella zona sinistra, scorriamo a sinistra con velocità proporzionale
      if (clientOffset.x < leftScrollZone) {
        // Calcola quanto siamo "dentro" la zona di scroll
        const distanceFromEdge = clientOffset.x - visibleLeft;
        const speed = calculateScrollSpeed(distanceFromEdge, scrollZoneSize);
        
        console.log(`[SCROLL DEBUG] SCROLLING LEFT con velocità ${speed}px (distanza dal bordo: ${distanceFromEdge}px)`);
        
        // Controlla se è possibile scorrere (non siamo già all'inizio)
        if (boardContainer.scrollLeft > 0) {
          boardContainer.scrollBy({ left: -speed, behavior: 'auto' });
        } else {
          console.log(`[SCROLL DEBUG] Già all'inizio del container, scrollLeft: ${boardContainer.scrollLeft}`);
        }
      }
      
      // Se siamo nella zona destra, scorriamo a destra con velocità proporzionale
      else if (clientOffset.x > rightScrollZone) {
        // Calcola quanto siamo "dentro" la zona di scroll
        const distanceFromEdge = visibleRight - clientOffset.x;
        const speed = calculateScrollSpeed(distanceFromEdge, scrollZoneSize);
        
        console.log(`[SCROLL DEBUG] SCROLLING RIGHT con velocità ${speed}px (distanza dal bordo: ${distanceFromEdge}px)`);
        
        // Controlla se è possibile scorrere (non siamo già alla fine)
        const maxScroll = boardContainer.scrollWidth - boardContainer.clientWidth;
        if (boardContainer.scrollLeft < maxScroll) {
          boardContainer.scrollBy({ left: speed, behavior: 'auto' });
        } else {
          console.log(`[SCROLL DEBUG] Già alla fine del container, scrollLeft: ${boardContainer.scrollLeft}, maxScroll: ${maxScroll}`);
        }
      }
      else {
        console.log(`[SCROLL DEBUG] In zona centrale - nessuno scroll (${leftScrollZone} < ${clientOffset.x} < ${rightScrollZone})`);
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