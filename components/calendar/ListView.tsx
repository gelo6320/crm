// components/calendar/ListView.tsx
import { useMemo } from "react";
import { CalendarEvent } from "@/types";
import { formatDate, formatTime } from "@/lib/utils/date";
import { getEventColor } from "@/lib/utils/calendar";
import { Clock, MapPin, User, Calendar, AlarmClock, Bookmark } from "lucide-react";

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
  
  // Ottiene l'icona in base al tipo di evento
  const getEventIcon = (event: CalendarEvent) => {
    if (event.eventType === 'reminder') {
      return <AlarmClock size={isMobile ? 14 : 16} className="text-purple-400" />;
    } else {
      return <Bookmark size={isMobile ? 14 : 16} className="text-primary" />;
    }
  };
  
  // Ottiene una breve descrizione dell'evento
  const getEventDescription = (event: CalendarEvent) => {
    if (event.description) {
      return event.description;
    } else if (event.location) {
      const locations: Record<string, string> = {
        'office': 'Ufficio',
        'client': 'Presso cliente',
        'remote': 'Remoto',
        'site': 'Cantiere'
      };
      return locations[event.location] || event.location;
    }
    return event.eventType === 'reminder' ? 'Promemoria' : 'Appuntamento';
  };
  
  if (groupedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-4">
        <Calendar size={isMobile ? 32 : 40} className="mb-2 text-zinc-600" />
        <div className="text-center">
          <p className="text-sm sm:text-base mb-1">Nessun elemento programmato</p>
          <p className="text-xs text-zinc-600">Clicca su + per aggiungere un appuntamento o promemoria</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-y-auto p-2 sm:p-4">
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
          <div key={date.toISOString()} className="mb-3 sm:mb-4 animate-slide-up">
            <h3 className={`
              text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 pb-1 border-b border-zinc-700
              ${isSelected ? "text-primary" : ""}
              ${isInPast ? "text-zinc-500" : ""}
            `}>
              {dateLabel}
            </h3>
            
            <div className="space-y-1.5 sm:space-y-2">
              {events.map(event => {
                const isCompleted = event.status === 'completed';
                const isCancelled = event.status === 'cancelled';
                
                return (
                  <div 
                    key={event.id}
                    className={`
                      flex items-start bg-zinc-900/60 rounded p-2 cursor-pointer 
                      hover:bg-zinc-900 transition-colors
                      ${isCompleted ? 'opacity-70' : ''}
                      ${isCancelled ? 'opacity-50' : ''}
                    `}
                    onClick={() => onSelectEvent(event)}
                  >
                    <div className="flex-shrink-0 w-14 sm:w-16 text-xs text-zinc-400 pt-0.5">
                      {formatTime(new Date(event.start))}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"
                          style={{ backgroundColor: getEventColor(event.status, event.eventType) }}
                        ></div>
                        <div className="font-medium text-xs sm:text-sm truncate pr-1">
                          {event.title}
                          {isCancelled && <span className="text-danger ml-1">(Cancellato)</span>}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center mt-1 text-[10px] sm:text-xs text-zinc-400">
                        <div className="flex items-center mr-2 sm:mr-3">
                          <Clock size={isMobile ? 10 : 12} className="mr-0.5 sm:mr-1 flex-shrink-0" />
                          {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center mr-2 sm:mr-3">
                            <MapPin size={isMobile ? 10 : 12} className="mr-0.5 sm:mr-1 flex-shrink-0" />
                            {event.location === 'office' ? 'Ufficio' : 
                             event.location === 'client' ? 'Cliente' :
                             event.location === 'remote' ? 'Remoto' : 
                             event.location === 'site' ? 'Cantiere' : event.location}
                          </div>
                        )}
                        
                        {/* Icona tipo evento */}
                        <div className="flex items-center">
                          {getEventIcon(event)}
                          <span className="ml-0.5 sm:ml-1">
                            {event.eventType === 'reminder' ? 'Promemoria' : 'Appuntamento'}
                          </span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="text-[10px] sm:text-xs text-zinc-500 truncate mt-1">
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