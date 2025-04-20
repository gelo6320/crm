// components/sales-funnel/CustomDragLayer.tsx
import { useDragLayer } from 'react-dnd';
import { FunnelItem } from '@/types';

interface CustomDragLayerProps {
  // Nessuna proprietà richiesta
}

export default function CustomDragLayer(props: CustomDragLayerProps) {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset || !item || !item.lead) {
    return null;
  }

  const lead = item.lead as FunnelItem;
  
  return (
    <div
      className="fixed pointer-events-none z-50 drag-preview-enhanced"
      style={{
        left: currentOffset.x,
        top: currentOffset.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="bg-zinc-900 p-3 rounded border-l-4 border-primary shadow-lg">
        <div className="font-medium text-sm truncate mb-1">
          {lead.name}
        </div>
        <div className="text-xs text-zinc-400">
          {lead.email}
        </div>
        {lead.value && (
          <div className="text-primary font-medium mt-1">
            €{lead.value.toLocaleString('it-IT')}
          </div>
        )}
      </div>
    </div>
  );
}