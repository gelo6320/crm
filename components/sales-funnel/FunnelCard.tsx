// components/sales-funnel/FunnelCard.tsx
import { useRef, useEffect, useState, useCallback } from "react";
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
  // Create a React ref
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Simplified state management
  const [isTouched, setIsTouched] = useState(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };
  }, []);

  // Memoized handlers for better performance
  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Set touch active state
    setIsTouched(true);
    
    // Clear any existing timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    
    // Create a timer for "ready to drag" animation
    touchTimerRef.current = setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.classList.add('touch-ready-to-drag');
      }
    }, 100); // Slightly faster than before (was 120ms)
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    // Reset touch state
    setIsTouched(false);
    
    // Remove animation class
    if (cardRef.current) {
      cardRef.current.classList.remove('touch-ready-to-drag');
    }
    
    // Clear timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);
  
  const handleTouchMove = useCallback(() => {
    // Remove animation class when user starts dragging
    if (cardRef.current) {
      cardRef.current.classList.remove('touch-ready-to-drag');
    }
    
    // Clear timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  // Add event listeners with useEffect
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement) return;
    
    // Add event listeners with passive: true for better performance
    cardElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    cardElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    cardElement.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    cardElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      // Remove event listeners on cleanup
      cardElement.removeEventListener('touchstart', handleTouchStart);
      cardElement.removeEventListener('touchend', handleTouchEnd);
      cardElement.removeEventListener('touchcancel', handleTouchEnd);
      cardElement.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchStart, handleTouchEnd, handleTouchMove]);

  return (
    <div
      ref={cardRef}
      className={`funnel-card ${isDragging ? "opacity-40" : ""} ${isTouched ? "touched" : ""}`}
      style={{ 
        borderLeftColor: getBorderColor(lead.status),
        willChange: isTouched ? 'transform, opacity' : 'auto' // Optimize rendering
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