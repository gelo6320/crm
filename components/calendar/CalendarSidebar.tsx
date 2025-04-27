// components/calendar/CalendarSidebar.tsx
import { useState } from "react";
import { Trash2, Edit2, X } from "lucide-react";
import { CalendarEvent } from "@/types";
import { formatTime } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";

interface CalendarSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onClose?: () => void;  // Optional close handler for mobile
}

export default function CalendarSidebar({
  selectedDate,
  events,
  onEditEvent,
  onDeleteEvent,
  onClose,
}: CalendarSidebarProps) {
  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-zinc-900 flex justify-between items-center">
        <h3 className="text-sm font-medium capitalize">
          {formatSelectedDate(selectedDate)}
        </h3>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {sortedEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Nessun appuntamento in questa data
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <div 
              key={event.id}
              className={`
                p-3 rounded border-l-4 bg-zinc-900/60
                hover:bg-zinc-900 transition-colors relative
                group animate-fade-in
              `}
              style={{ borderLeftColor: getEventColor(event.status) }}
            >
              <div className="text-xs text-zinc-400 mb-1">
                {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
              </div>
              
              <div className="font-medium mb-0.5 pr-16">{event.title}</div>
              
              {event.description && (
                <div className="text-xs text-zinc-400 truncate">
                  {event.description}
                </div>
              )}
              
              <div className="absolute top-3 right-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditEvent(event)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <Edit2 size={14} />
                </button>
                
                <button
                  onClick={() => onDeleteEvent(event)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    
    <div className="p-3 border-t border-zinc-700 text-xs text-zinc-400">
      <h4 className="font-medium mb-2">Legenda</h4>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1.5"
            style={{ backgroundColor: getEventColor("confirmed") }}
          ></div>
          <span>Confermato</span>
        </div>
        
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1.5"
            style={{ backgroundColor: getEventColor("pending") }}
          ></div>
          <span>In attesa</span>
        </div>
        
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1.5"
            style={{ backgroundColor: getEventColor("completed") }}
          ></div>
          <span>Completato</span>
        </div>
        
        <div className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-1.5"
            style={{ backgroundColor: getEventColor("cancelled") }}
          ></div>
          <span>Cancellato</span>
        </div>
      </div>
    </div>
  </div>
);
}