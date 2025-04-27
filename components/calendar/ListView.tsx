// components/calendar/ListView.tsx
import { useMemo } from "react";
import { CalendarEvent } from "@/types";
import { formatDate, formatDate } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";

interface ListViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export default function ListView({ selectedDate, events, onSelectEvent }: ListViewProps) {
  // Group events by date and sort them
  const groupedEvents = useMemo(() => {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    // Group by date
    const grouped: Record<string, CalendarEvent[]> = {};
    
    sortedEvents.forEach(event => {
      const date = new Date(event.start).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    // Create array with dates and events
    return Object.entries(grouped).map(([dateString, events]) => ({
      date: new Date(dateString),
      events,
    }));
  }, [events]);
  
  if (groupedEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Nessun appuntamento programmato
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-4">
      {groupedEvents.map(({ date, events }) => {
        const isToday = new Date().toDateString() === date.toDateString();
        const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === date.toDateString();
        const isSelected = selectedDate.toDateString() === date.toDateString();
        
        const dateLabel = isToday 
          ? "Oggi" 
          : isTomorrow 
            ? "Domani" 
            : formatDate(date.toISOString());
        
        return (
          <div key={date.toISOString()} className="mb-4">
            <h3 className={`
              text-sm font-medium mb-2 pb-1 border-b border-zinc-700
              ${isSelected ? "text-primary" : ""}
            `}>
              {dateLabel}
            </h3>
            
            <div className="space-y-2">
              {events.map(event => (
                <div 
                  key={event.id}
                  className="flex bg-zinc-900/60 rounded p-2 cursor-pointer hover:bg-zinc-900 transition-colors"
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="w-20 text-xs text-zinc-400">
                    {formatDate(new Date(event.start))}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getEventColor(event.status) }}
                      ></div>
                      <div className="font-medium truncate">{event.title}</div>
                    </div>
                    
                    {event.description && (
                      <div className="text-xs text-zinc-400 truncate mt-0.5">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}