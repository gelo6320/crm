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
      
      // LOG: Inizio della funzione hover
      console.log(`[SCROLL DEBUG] Hover in colonna ${id}`);
      
      // Quando l'elemento è sopra questa colonna, imposta isOver a true
      const isHovering = monitor.isOver({ shallow: true });
      setIsOver(isHovering);
      
      // Ottieni la posizione del mouse
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        console.log("[SCROLL DEBUG] Nessun clientOffset disponibile");
        return;
      }
      
      console.log(`[SCROLL DEBUG] Mouse position - clientX: ${clientOffset.x}, clientY: ${clientOffset.y}`);
      
      // Ottieni il contenitore delle colonne
      const boardContainer = document.getElementById('funnel-board-container');
      if (!boardContainer) {
        console.error("[SCROLL DEBUG] ERRORE: Elemento #funnel-board-container non trovato!");
        return;
      }
      
      // Calcola le dimensioni e la posizione del contenitore
      const containerRect = boardContainer.getBoundingClientRect();
      console.log(`[SCROLL DEBUG] Container bounds - left: ${containerRect.left}, width: ${containerRect.width}, right: ${containerRect.right}`);
      
      // Calcola la posizione del mouse relativa al contenitore
      const relativeMouseX = clientOffset.x - containerRect.left;
      console.log(`[SCROLL DEBUG] Mouse X relativo al container: ${relativeMouseX}`);
      
      // Larghezza totale del contenitore
      const containerWidth = containerRect.width;
      
      // Dividiamo il contenitore in tre parti: 15% a sinistra, 70% al centro, 15% a destra
      const leftZone = containerWidth * 0.15;
      const rightZone = containerWidth * 0.85;
      console.log(`[SCROLL DEBUG] Zone - leftZone: 0-${leftZone}, rightZone: ${rightZone}-${containerWidth}`);
      
      // Velocità di scorrimento progressiva - più vicino al bordo, più veloce lo scorrimento
      const calculateScrollSpeed = (distance: number, max: number) => {
        // Velocità di base: da 5px a 25px per scorrimento
        const baseSpeed = 5;
        const maxAdditionalSpeed = 20;
        const ratio = 1 - (distance / max);
        return baseSpeed + (maxAdditionalSpeed * ratio);
      };
      
      // Se siamo nella zona sinistra, scorriamo a sinistra con velocità proporzionale
      if (relativeMouseX < leftZone) {
        const speed = calculateScrollSpeed(relativeMouseX, leftZone);
        console.log(`[SCROLL DEBUG] SCROLLING LEFT con velocità ${speed}px (relativeMouseX ${relativeMouseX} < leftZone ${leftZone})`);
        
        // Controlla se è possibile scorrere (non siamo già all'inizio)
        if (boardContainer.scrollLeft > 0) {
          console.log(`[SCROLL DEBUG] Esecuzione scrollBy(-${speed}). scrollLeft attuale: ${boardContainer.scrollLeft}`);
          boardContainer.scrollBy({ left: -speed, behavior: 'auto' });
          
          // LOG dello scrollLeft dopo lo scroll per verifica
          setTimeout(() => {
            console.log(`[SCROLL DEBUG] Nuovo scrollLeft dopo LEFT scroll: ${boardContainer.scrollLeft}`);
          }, 10);
        } else {
          console.log(`[SCROLL DEBUG] Già all'inizio del container, scrollLeft: ${boardContainer.scrollLeft}`);
        }
      }
      
      // Se siamo nella zona destra, scorriamo a destra con velocità proporzionale
      else if (relativeMouseX > rightZone) {
        const speed = calculateScrollSpeed(containerWidth - relativeMouseX, containerWidth - rightZone);
        console.log(`[SCROLL DEBUG] SCROLLING RIGHT con velocità ${speed}px (relativeMouseX ${relativeMouseX} > rightZone ${rightZone})`);
        
        // Controlla se è possibile scorrere (non siamo già alla fine)
        const maxScroll = boardContainer.scrollWidth - boardContainer.clientWidth;
        if (boardContainer.scrollLeft < maxScroll) {
          console.log(`[SCROLL DEBUG] Esecuzione scrollBy(${speed}). scrollLeft attuale: ${boardContainer.scrollLeft}, maxScroll: ${maxScroll}`);
          boardContainer.scrollBy({ left: speed, behavior: 'auto' });
          
          // LOG dello scrollLeft dopo lo scroll per verifica
          setTimeout(() => {
            console.log(`[SCROLL DEBUG] Nuovo scrollLeft dopo RIGHT scroll: ${boardContainer.scrollLeft}`);
          }, 10);
        } else {
          console.log(`[SCROLL DEBUG] Già alla fine del container, scrollLeft: ${boardContainer.scrollLeft}, maxScroll: ${maxScroll}`);
        }
      }
      else {
        console.log(`[SCROLL DEBUG] In zona centrale - nessuno scroll (${leftZone} < ${relativeMouseX} < ${rightZone})`);
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

  // Log delle dimensioni del container quando il componente viene montato
  useEffect(() => {
    const logContainerDimensions = () => {
      const boardContainer = document.getElementById('funnel-board-container');
      if (boardContainer) {
        const rect = boardContainer.getBoundingClientRect();
        console.log(`[SCROLL DEBUG] Dimensioni iniziali container - width: ${rect.width}, height: ${rect.height}`);
        console.log(`[SCROLL DEBUG] Scroll info - scrollWidth: ${boardContainer.scrollWidth}, clientWidth: ${boardContainer.clientWidth}`);
        console.log(`[SCROLL DEBUG] Overflow scroll disponibile: ${boardContainer.scrollWidth > boardContainer.clientWidth ? 'SÌ' : 'NO'}`);
      } else {
        console.error("[SCROLL DEBUG] Elemento #funnel-board-container non trovato durante l'inizializzazione!");
      }
    };
    
    // Esegui dopo che il DOM è completamente caricato
    setTimeout(logContainerDimensions, 500);
  }, []);

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