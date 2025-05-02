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
  
  // Determine if we're on mobile by checking if onClose is provided
  const isMobile = !!onClose;
  
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 bg-zinc-900 flex justify-between items-center">
        <h3 className="text-sm font-medium capitalize">
          {formatSelectedDate(selectedDate)}
        </h3>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sortedEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Nessun appuntamento in questa data
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedEvents.map(event => (
              <div 
                key={event.id}
                className={`
                  p-3 rounded-lg border-l-4 bg-zinc-800
                  hover:bg-zinc-700 active:bg-zinc-700 transition-colors relative
                  group animate-fade-in
                `}
                style={{ borderLeftColor: getEventColor(event.status, event.eventType) }}
              >
                <div className="text-xs text-zinc-400 mb-1.5">
                  {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                </div>
                
                <div className="font-medium mb-1 pr-16">{event.title}</div>
                
                {event.description && (
                  <div className="text-xs text-zinc-400 line-clamp-2">
                    {event.description}
                  </div>
                )}
                
                <div className={`
                  ${isMobile ? 'flex mt-3 pt-2 border-t border-zinc-700' : 'absolute top-3 right-3 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity'}
                `}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                    className={`
                      p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white 
                      ${isMobile ? 'flex-1 flex items-center justify-center' : ''}
                    `}
                  >
                    <Edit2 size={isMobile ? 16 : 14} className={isMobile ? 'mr-1.5' : ''} />
                    {isMobile && <span className="text-xs">Modifica</span>}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEvent(event);
                    }}
                    className={`
                      p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-danger
                      ${isMobile ? 'flex-1 flex items-center justify-center' : ''}
                      ${isMobile ? 'ml-2' : ''}
                    `}
                  >
                    <Trash2 size={isMobile ? 16 : 14} className={isMobile ? 'mr-1.5' : ''} />
                    {isMobile && <span className="text-xs">Elimina</span>}
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