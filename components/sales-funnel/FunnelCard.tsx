// components/sales-funnel/FunnelCard.tsx
import { useRef, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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
  // Crea un ref React
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Sposta gli stati all'interno del componente
  const [isTouched, setIsTouched] = useState(false);
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null);

  // Effetto per il touch feedback
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      console.log(`[Touch Debug] Touch start su card ${lead._id} (${lead.name})`, e.touches[0].clientX, e.touches[0].clientY);
      
      // Imposta lo stato di touch attivo
      setIsTouched(true);
      
      // Crea un timer per indicare all'utente quando può iniziare a trascinare
      const timer = setTimeout(() => {
        // Aggiungi una classe per l'animazione "pronto per il trascinamento"
        if (cardElement) {
          cardElement.classList.add('touch-ready-to-drag');
        }
      }, 120); // Breve ritardo per attivare l'animazione
      
      setTouchTimer(timer);
    };
    
    const handleTouchEnd = () => {
      // Resetta lo stato di touch
      setIsTouched(false);
      
      // Rimuovi la classe per l'animazione
      if (cardElement) {
        cardElement.classList.remove('touch-ready-to-drag');
      }
      
      // Cancella il timer se esiste
      if (touchTimer) {
        clearTimeout(touchTimer);
        setTouchTimer(null);
      }
    };
    
    const handleTouchMove = () => {
      // Se l'utente inizia a trascinare, la classe verrà rimossa automaticamente
      if (cardElement) {
        cardElement.classList.remove('touch-ready-to-drag');
      }
      
      // Cancella il timer se esiste
      if (touchTimer) {
        clearTimeout(touchTimer);
        setTouchTimer(null);
      }
    };
    
    // Aggiungi event listener
    cardElement.addEventListener('touchstart', handleTouchStart);
    cardElement.addEventListener('touchend', handleTouchEnd);
    cardElement.addEventListener('touchcancel', handleTouchEnd);
    cardElement.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      // Rimuovi event listener alla pulizia
      cardElement.removeEventListener('touchstart', handleTouchStart);
      cardElement.removeEventListener('touchend', handleTouchEnd);
      cardElement.removeEventListener('touchcancel', handleTouchEnd);
      cardElement.removeEventListener('touchmove', handleTouchMove);
      
      // Cancella il timer se esiste
      if (touchTimer) {
        clearTimeout(touchTimer);
      }
    };
  }, [lead._id, lead.name, touchTimer]);

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