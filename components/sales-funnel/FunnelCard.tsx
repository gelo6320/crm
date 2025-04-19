// components/sales-funnel/FunnelCard.tsx
"use client";

import { Pencil } from "lucide-react";
import { useDrag } from "react-dnd";
import { FunnelItem } from "@/types";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/format";

interface FunnelCardProps {
  lead: FunnelItem;
  onEdit: (lead: FunnelItem) => void;
}

export default function FunnelCard({ lead, onEdit }: FunnelCardProps) {
  // Set up drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'LEAD',
    item: { lead },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`funnel-card ${isDragging ? "dragging" : ""}`}
      style={{ borderLeftColor: getBorderColor(lead.status) }}
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