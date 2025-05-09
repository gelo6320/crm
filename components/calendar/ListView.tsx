// components/calendar/ListView.tsx
import { useMemo } from "react";
import { CalendarEvent } from "@/types";
import { formatDate, formatTime } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";
import { Clock, MapPin, Calendar, AlarmClock, Bookmark } from "lucide-react";

interface ListViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  isMobile?: boolean;
}

export default function ListView({ 
  selectedDate, 
  events, 
  onSelectEvent,
  isMobile = false
}: ListViewProps) {
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
  
  // Get icon based on event type
  const getEventIcon = (event: CalendarEvent) => {
    if (event.eventType === 'reminder') {
      return <AlarmClock size={isMobile ? 14 : 16} className="text-purple-400" />;
    } else {
      return <Bookmark size={isMobile ? 14 : 16} className="text-blue-400" />;
    }
  };
  
  if (groupedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6">
        <Calendar size={isMobile ? 38 : 42} className="mb-4 text-zinc-600" />
        <div className="text-center">
          <p className="text-sm sm:text-base mb-2 font-medium">Nessun evento programmato</p>
          <p className="text-xs text-zinc-600">Clicca su + per aggiungere un evento o promemoria</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto py-3 px-4">
      {groupedEvents.map(({ date, events }) => {
        const isToday = new Date().toDateString() === date.toDateString();
        const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === date.toDateString();
        const isSelected = selectedDate.toDateString() === date.toDateString();
        const isInPast = date < new Date(new Date().setHours(0, 0, 0, 0));
        
        const dateLabel = isToday 
          ? "Oggi" 
          : isTomorrow 
            ? "Domani" 
            : formatDate(date.toISOString());
        
        return (
          <div key={date.toISOString()} className="mb-4 animate-fade-in">
            <h3 className={`
              text-sm font-medium mb-3 pb-1 border-b border-zinc-700
              ${isSelected ? "text-blue-500" : ""}
              ${isInPast ? "text-zinc-500" : ""}
            `}>
              {dateLabel}
            </h3>
            
            <div className="space-y-2.5">
              {events.map(event => {
                const isCompleted = event.status === 'completed';
                const isCancelled = event.status === 'cancelled';
                
                return (
                  <div 
                    key={event.id}
                    className={`
                      flex items-start bg-zinc-800/80 rounded-lg p-3 cursor-pointer
                      hover:bg-zinc-700/90 active:bg-zinc-700/90 transition-colors
                      ${isCompleted ? 'opacity-70' : ''}
                      ${isCancelled ? 'opacity-50' : ''}
                    `}
                    onClick={() => onSelectEvent(event)}
                  >
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full mr-3" 
                      style={{ backgroundColor: `${getEventColor(event.status, event.eventType)}30` }}
                    >
                      {getEventIcon(event)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div 
                          className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: getEventColor(event.status, event.eventType) }}
                        ></div>
                        <div className="font-medium text-sm truncate pr-1">
                          {event.title}
                          {isCancelled && <span className="text-red-500 ml-1">(Cancellato)</span>}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center mt-1.5 text-xs text-zinc-400">
                        <div className="flex items-center mr-3">
                          <Clock size={12} className="mr-1 flex-shrink-0" />
                          {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center mr-3">
                            <MapPin size={12} className="mr-1 flex-shrink-0" />
                            {event.location === 'office' ? 'Ufficio' : 
                             event.location === 'client' ? 'Cliente' :
                             event.location === 'remote' ? 'Remoto' : 
                             event.location === 'site' ? 'Cantiere' : event.location}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <span className="ml-1">
                            {event.eventType === 'reminder' ? 'Promemoria' : 'Appuntamento'}
                          </span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}