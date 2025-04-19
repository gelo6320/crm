// components/sales-funnel/FunnelColumn.tsx
"use client";

import { useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import { FunnelItem } from "@/types";

interface FunnelColumnProps {
  id: string;
  title: string;
  color: string;
  children: React.ReactNode;
  onMoveLead: (lead: FunnelItem, targetStatus: string) => void;
}

export default function FunnelColumn({ id, title, color, children, onMoveLead }: FunnelColumnProps) {
  // Crea un ref React standard
  const dropRef = useRef<HTMLDivElement>(null);
  
  // Set up the drop target
  const [{ isOver }, dropTarget] = useDrop({
    accept: 'LEAD',
    drop: (item: { lead: FunnelItem }) => {
      // Only move if the status is different
      if (item.lead.status !== id) {
        onMoveLead(item.lead, id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Collega il ref drop al ref del componente
  useEffect(() => {
    if (dropRef.current) {
      dropTarget(dropRef.current);
    }
  }, [dropTarget]);

  return (
    <div className="funnel-column">
      <div className={`funnel-header ${color}`}>
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-xs font-medium">
          {Array.isArray(children) ? children.length : 0}
        </div>
      </div>
      
      <div 
        ref={dropRef} 
        className={`funnel-body ${isOver ? "drag-over" : ""}`}
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