// components/sales-funnel/CustomDragLayer.tsx
"use client";

import { useDragLayer } from 'react-dnd';
import { FunnelItem } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/format';

interface CustomDragLayerProps {
  snapToGrid?: boolean;
}

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

  if (!isDragging || !currentOffset || !initialOffset) {
    return null;
  }

  const getItemStyles = () => {
    const { x, y } = currentOffset;
    
    const transform = `translate(${x}px, ${y}px)`;
    return {
      transform,
      WebkitTransform: transform,
    };
  };

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

  const renderItem = () => {
    if (itemType === 'LEAD' && item.lead) {
      const lead = item.lead as FunnelItem;
      
      return (
        <div
          className="funnel-card-preview"
          style={{
            width: '250px',
            borderLeftColor: getBorderColor(lead.status),
            borderLeftWidth: '3px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
            background: '#222222',
            borderRadius: '8px',
            padding: '14px',
            animation: 'dragPulse 1.5s infinite ease-in-out',
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
            {lead.service ? (
              <div className="italic">
                {lead.service}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (!renderItem()) {
    return null;
  }

  return (
    <div 
      className="funnel-drag-preview"
      style={{
        ...getItemStyles(),
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      {renderItem()}
      <style jsx global>{`
        @keyframes dragPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .funnel-card-preview {
          transform-origin: center center;
        }
      `}</style>
    </div>
  );
}