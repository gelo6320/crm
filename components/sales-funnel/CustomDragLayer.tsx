// components/sales-funnel/CustomDragLayer.tsx
"use client";

import { useDragLayer } from 'react-dnd';
import { FunnelItem } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/format';

interface CustomDragLayerProps {
  snapToGrid?: boolean;
}

// Componente per visualizzare un'anteprima personalizzata durante il trascinamento
export default function CustomDragLayer({ snapToGrid = false }: CustomDragLayerProps) {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  // Se non stiamo trascinando o non abbiamo offset validi, non mostriamo nulla
  if (!isDragging || !currentOffset || !initialOffset) {
    return null;
  }

  // Funzione per calcolare lo stile dell'anteprima
  const getItemStyles = () => {
    const { x, y } = currentOffset;
    
    const transform = `translate(${x}px, ${y}px)`;
    return {
      transform,
      WebkitTransform: transform,
    };
  };

  // Funzione per determinare il colore del bordo in base allo stato
  const getBorderColor = (status: string): string => {
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
  };

  // Renderizziamo l'anteprima in base al tipo di elemento trascinato
  const renderItem = () => {
    // Se il tipo è 'LEAD', renderizziamo un'anteprima di card
    if (itemType === 'LEAD' && item.lead) {
      const lead = item.lead as FunnelItem;
      
      return (
        <div
          className="funnel-card"
          style={{
            width: '250px', // Larghezza fissa per una buona visualizzazione
            borderLeftColor: getBorderColor(lead.status),
            borderLeftWidth: '3px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            background: '#18181b',
            borderRadius: '6px',
            padding: '12px',
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="font-medium text-sm truncate pr-1">
              {lead.name}
            </div>
          </div>
          <div className="text-xs text-zinc-400">
            <div>{formatDate(lead.createdAt)}</div>
            {lead.value ? (
              <div className="text-primary font-medium my-1">
                €{formatMoney(lead.value)}
              </div>
            ) : null}
            {lead.service ? <div className="italic">{lead.service}</div> : null}
          </div>
        </div>
      );
    }
    
    // Se non riconosciamo il tipo, restituiamo null
    return null;
  };

  // Se non sappiamo come renderizzare questo tipo, non mostriamo nulla
  if (!renderItem()) {
    return null;
  }

  // Renderizziamo l'anteprima personalizzata
  return (
    <div
      className="funnel-drag-preview"
      style={getItemStyles()}
    >
      {renderItem()}
    </div>
  );
}