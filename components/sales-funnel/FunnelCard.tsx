// components/sales-funnel/FunnelCard.tsx
import { useRef, useEffect, useState } from "react";
import { Pencil, Clock, Tag } from "lucide-react";
import { FunnelItem } from "@/types";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

interface FunnelCardProps {
  lead: FunnelItem;
  onEdit: (lead: FunnelItem) => void;
  onDragStart: (lead: FunnelItem, e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}

export default function FunnelCard({ 
  lead, 
  onEdit, 
  onDragStart, 
  onTouchMove, 
  onTouchEnd, 
  isDragging 
}: FunnelCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouched, setIsTouched] = useState(false);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      setIsTouched(true);
      
      const timer = setTimeout(() => {
        if (cardElement) {
          cardElement.classList.add('touch-ready-to-drag');
        }
      }, 120);
      
      setTouchTimer(timer);
    };
    
    const handleTouchEnd = () => {
      setIsTouched(false);
      
      if (cardElement) {
        cardElement.classList.remove('touch-ready-to-drag');
      }
      
      if (touchTimer) {
        clearTimeout(touchTimer);
        setTouchTimer(null);
      }
    };
    
    const handleTouchMove = () => {
      if (cardElement) {
        cardElement.classList.remove('touch-ready-to-drag');
      }
      
      if (touchTimer) {
        clearTimeout(touchTimer);
        setTouchTimer(null);
      }
    };
    
    cardElement.addEventListener('touchstart', handleTouchStart);
    cardElement.addEventListener('touchend', handleTouchEnd);
    cardElement.addEventListener('touchcancel', handleTouchEnd);
    cardElement.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      cardElement.removeEventListener('touchstart', handleTouchStart);
      cardElement.removeEventListener('touchend', handleTouchEnd);
      cardElement.removeEventListener('touchcancel', handleTouchEnd);
      cardElement.removeEventListener('touchmove', handleTouchMove);
      
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
    };
  }, [touchTimer]);

  // Funzione per determinare il colore del badge
  const getStatusBadge = (status: string) => {
    let bgColor = "bg-zinc-600";
    let text = "Nuovo";
    
    switch (status) {
      case "new": 
        bgColor = "bg-zinc-600"; 
        text = "Nuovo";
        break;
      case "contacted": 
        bgColor = "bg-blue-600"; 
        text = "Contattato";
        break;
      case "qualified": 
        bgColor = "bg-primary"; 
        text = "Qualificato";
        break;
      case "opportunity": 
        bgColor = "bg-amber-600"; 
        text = "Opportunità";
        break;
      case "proposal": 
        bgColor = "bg-primary-hover"; 
        text = "Proposta";
        break;
      case "customer": 
        bgColor = "bg-green-600"; 
        text = "Cliente";
        break;
      case "lost": 
        bgColor = "bg-red-600"; 
        text = "Perso";
        break;
    }
    
    return { bgColor, text };
  };

  const { bgColor, text } = getStatusBadge(lead.status);
  
  return (
    <div
      ref={cardRef}
      className={`funnel-card ${isDragging ? "opacity-40" : ""} ${isTouched ? "touched" : ""}`}
      style={{ 
        borderLeftColor: getBorderColor(lead.status)
      }}
      onMouseDown={(e) => onDragStart(lead, e)}
      onTouchStart={(e) => onDragStart(lead, e)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-sm truncate pr-1">
          {lead.name}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(lead);
          }}
          className="p-1.5 rounded-full hover:bg-black/20 transition-colors"
          aria-label="Edit lead"
        >
          <Pencil size={12} className="text-zinc-400 hover:text-primary" />
        </button>
      </div>
      
      <div className="text-xs text-zinc-400">
        <div className="flex items-center mb-1.5">
          <Clock size={12} className="mr-1 text-zinc-500" />
          {formatDate(lead.createdAt)}
        </div>
        
        {lead.value ? (
          <div className="text-primary font-medium my-1.5 flex items-center">
            <span className="text-primary">€{formatMoney(lead.value)}</span>
          </div>
        ) : null}
        
        {lead.service ? (
          <div className="flex items-center">
            <Tag size={12} className="mr-1 text-zinc-500" />
            <span className="text-zinc-300 text-xs">{lead.service}</span>
          </div>
        ) : null}
        
        <div className="mt-2 flex items-center justify-between">
          <div className={`${bgColor} text-[10px] font-medium px-1.5 py-0.5 rounded-sm`}>
            {text}
          </div>
        </div>
      </div>
    </div>
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