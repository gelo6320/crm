// components/sales-funnel/CustomDragLayer.tsx
"use client";

import { useDragLayer } from 'react-dnd';
import { FunnelItem } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/format';
import { useEffect, useState } from 'react';

interface CustomDragLayerProps {
  snapToGrid?: boolean;
}

// Component to display a custom preview during dragging
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

  // State to track if touch is being used
  const [isTouch, setIsTouch] = useState(false);
  
  // Detect touch device on mount
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Add body class while dragging to prevent iOS scroll issues
    if (isDragging) {
      document.body.classList.add('is-dragging');
    } else {
      document.body.classList.remove('is-dragging');
    }
    
    return () => {
      document.body.classList.remove('is-dragging');
    };
  }, [isDragging]);

  // If we're not dragging or don't have valid offsets, show nothing
  if (!isDragging || !currentOffset || !initialOffset) {
    return null;
  }

  // Function to calculate the preview style
  const getItemStyles = () => {
    const { x, y } = currentOffset;
    
    // Apply scale for touch devices to make preview larger & more visible
    const scale = isTouch ? 1.1 : 1;
    
    // Apply constraints to keep the preview within the viewport
    const windowWidth = window.innerWidth;
    const previewWidth = 250; // Our fixed preview width
    
    // Constrain X to ensure the preview doesn't go off-screen
    const constrainedX = Math.max(0, Math.min(windowWidth - previewWidth, x));
    
    const transform = `translate(${constrainedX}px, ${y}px) scale(${scale})`;
    
    return {
      transform,
      WebkitTransform: transform,
      opacity: 0.8,
      zIndex: 1000,
    };
  };

  // Function to determine border color based on status
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

  // Render the preview based on the type of dragged element
  const renderItem = () => {
    // If type is 'LEAD', render a card preview
    if (itemType === 'LEAD' && item.lead) {
      const lead = item.lead as FunnelItem;
      
      return (
        <div
          className="funnel-card"
          style={{
            width: '250px', // Fixed width for good visualization
            borderLeftColor: getBorderColor(lead.status),
            borderLeftWidth: '3px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
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
    
    // If we don't recognize the type, return null
    return null;
  };

  // If we don't know how to render this type, show nothing
  if (!renderItem()) {
    return null;
  }

  // Render the custom preview
  return (
    <div 
      className="funnel-drag-preview"
      style={{
        ...getItemStyles(),
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 1000,
        transformOrigin: '0 0',
      }}
    >
      {renderItem()}
    </div>
  );
}