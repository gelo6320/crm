// components/sales-funnel/CustomDragLayer.tsx
"use client";

import { useDragLayer } from 'react-dnd';
import { FunnelItem } from '@/types';
import { formatDate } from '@/lib/utils/date';
import { formatMoney } from '@/lib/utils/format';
import { useEffect, useState, useMemo } from 'react';

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
  
  // Detect touch device on mount - only runs once
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    // Add a passive listener for smoother performance
    const handleTouchStart = () => {
      setIsTouch(true);
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
  
  // Handle body class for iOS scroll issues - separate effect for performance
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('is-dragging');
      
      // For iOS specifically, we need to prevent touchmove to stop scrolling
      const preventTouchMove = (e: TouchEvent) => {
        if (e.target && 
            (e.target as HTMLElement).closest && 
            (e.target as HTMLElement).closest('.funnel-card, .funnel-drag-preview')) {
          e.preventDefault();
        }
      };
      
      // Add with passive: false to ensure preventDefault works
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        document.body.classList.remove('is-dragging');
        document.removeEventListener('touchmove', preventTouchMove);
      };
    }
    
    return () => {
      document.body.classList.remove('is-dragging');
    };
  }, [isDragging]);

  // If we're not dragging or don't have valid offsets, show nothing
  if (!isDragging || !currentOffset || !initialOffset) {
    return null;
  }

  // Function to calculate the preview style - now using useMemo for performance
  const getItemStyles = () => {
    const { x, y } = currentOffset;
    
    // Apply scale for touch devices to make preview larger & more visible
    const scale = isTouch ? 1.05 : 1; // Reduced scale for better performance
    
    // Apply constraints to keep the preview within the viewport
    const windowWidth = window.innerWidth;
    const previewWidth = 250; // Our fixed preview width
    
    // Constrain X to ensure the preview doesn't go off-screen
    const constrainedX = Math.max(0, Math.min(windowWidth - previewWidth, x));
    
    // Use translateX/Y for better performance than translate()
    const transform = `translateX(${constrainedX}px) translateY(${y}px) scale(${scale})`;
    
    return {
      transform,
      WebkitTransform: transform,
      opacity: 0.8,
      zIndex: 1000,
      position: "fixed" as const,
      pointerEvents: "none" as const,
      touchAction: "none" as const,
      willChange: "transform", // Hint for browser optimization
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

  // Render the preview based on the type of dragged element - optimize with early returns
  if (itemType !== 'LEAD' || !item.lead) {
    return null;
  }
  
  const lead = item.lead as FunnelItem;
  
  // Render the custom preview with reduced complexity
  return (
    <div 
      className="funnel-drag-preview"
      style={getItemStyles()}
    >
      <div
        className="funnel-card"
        style={{
          width: '250px', // Fixed width for good visualization
          borderLeftColor: getBorderColor(lead.status),
          borderLeftWidth: '3px',
          boxShadow: '0 8px 15px rgba(0, 0, 0, 0.3)', // Lighter shadow for performance
          background: '#18181b',
          borderRadius: '6px',
          padding: '12px',
        } as React.CSSProperties}
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
    </div>
  );
}