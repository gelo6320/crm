// components/sales-funnel/FunnelCard.tsx
import { useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useDrag, DragPreviewImage } from "react-dnd";
import { FunnelItem } from "@/types";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

interface FunnelCardProps {
  lead: FunnelItem;
  onEdit: (lead: FunnelItem) => void;
}

export default function FunnelCard({ lead, onEdit }: FunnelCardProps) {
  // Crea un ref React
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Set up drag source with preview
  const [{ isDragging }, dragRef, preview] = useDrag({
    type: 'LEAD',
    item: { lead },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // Rimuoviamo begin che non è supportato nell'API
    end: (item, monitor) => {
      // Pulizia dopo il drag
      const cardElement = cardRef.current;
      if (cardElement) {
        cardElement.style.transform = "";
        cardElement.style.webkitTransform = "";
      }
      
      console.log(`[DnD Debug] Fine drag per: ${lead.name} (${lead._id}), drop avvenuto: ${monitor.didDrop()}`);
      
      if (!monitor.didDrop()) {
        console.log('[DnD Debug] Drop non avvenuto - torna alla posizione originale');
      }
    }
  });

  // Aggiungere log all'inizio del trascinamento usando useEffect
  useEffect(() => {
    if (isDragging) {
      console.log(`[DnD Debug] Inizio drag per: ${lead.name} (${lead._id})`);
    }
  }, [isDragging, lead._id, lead.name]);
  
  // Aggiungere debug event listener per i dispositivi touch nel useEffect
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      console.log(`[DnD Debug] Touch start su card ${lead._id} (${lead.name})`, e.touches[0].clientX, e.touches[0].clientY);
    };
    
    // Aggiunta di event listener solo in modalità di sviluppo o condizionalmente
    if (process.env.NODE_ENV === 'development' || true) {
      cardElement.addEventListener('touchstart', handleTouchStart);
    }
    
    return () => {
      cardElement.removeEventListener('touchstart', handleTouchStart);
    };
  }, [lead._id, lead.name]);

  // Collega il ref drag al ref del componente
  useEffect(() => {
    if (cardRef.current) {
      dragRef(cardRef.current);
    }
  }, [dragRef]);

  return (
    <>
      {/* Preview personalizzata durante il dragging */}
      <DragPreviewImage 
        connect={preview} 
        src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>`} 
      />
      <div
        ref={cardRef}
        className={`funnel-card ${isDragging ? "dragging" : ""}`}
        style={{ 
          borderLeftColor: getBorderColor(lead.status),
          opacity: isDragging ? 0.5 : 1
        }}
      >
        <div className="flex justify-between items-center mb-1">
          <div className="font-medium text-sm truncate pr-1">
            {lead.name}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
          >
            <Pencil size={12} />
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
    </>
  );
}

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