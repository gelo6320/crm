// components/calendar/DayView.tsx
import { useRef, useEffect, useState } from "react";
import { useDrag } from "react-dnd";
import { CalendarEvent } from "@/types";
import { getEventColor } from "@/lib/utils/calendar";
import { formatTime } from "@/lib/utils/date";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onChangeDate?: (date: Date) => void;
}

interface EventItemProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
}

// Event item component with drag functionality
function EventItem({ event, onSelect }: EventItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, dragRef, dragPreview] = useDrag({
    type: 'EVENT',
    item: { event },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Usa dragPreview per collegare il componente all'elemento trascinabile
  useEffect(() => {
    dragPreview(ref.current);
  }, [dragPreview]);
  
  const start = new Date(event.start);
  const end = new Date(event.end);
  
  // Calcola il posizionamento
  const minutes = start.getMinutes();
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  
  // Ogni ora è alta 60px, quindi 1 minuto = 1px
  const top = (minutes / 60) * 60; // Posizione relativa all'interno della cella dell'ora
  const height = durationMinutes;
  
  return (
    <div
      ref={ref}
      className={`
        absolute left-0 right-0 rounded px-2 py-1 cursor-pointer
        text-white shadow-md border-l-4 z-10 overflow-hidden
        ${isDragging ? 'opacity-50' : ''}
        animate-fade-in
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: getEventColor(event.status),
        borderLeftColor: getEventColor(event.status, true),
      }}
      onClick={() => onSelect(event)}
    >
      <div className="text-xs font-medium mb-0.5">
        {formatTime(start)} - {formatTime(end)}
      </div>
      <div className="font-medium truncate">{event.title}</div>
      {height > 60 && (
        <div className="text-xs truncate opacity-80">{event.description}</div>
      )}
    </div>
  );
}

function DayHeader({ date, onChangeDate }: { date: Date, onChangeDate: (date: Date) => void }) {
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const today = new Date();
  
  // Creazione array di giorni per la settimana corrente
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    const diff = d.getDay() - i;
    d.setDate(d.getDate() - diff);
    return d;
  });
  
  // Navigazione del giorno
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onChangeDate(newDate);
  };

  return (
    <div className="md:hidden bg-black sticky top-0 z-20 w-full border-b border-zinc-800">
      {/* Day Navigation Control */}
      <div className="flex items-center justify-between px-2 py-2 bg-zinc-900">
        <button
          onClick={() => navigateDay('prev')}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="font-medium">
          {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
        </div>
        
        <button
          onClick={() => navigateDay('next')}
          className="p-1 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {/* Days of week scroller */}
      <div className="flex overflow-x-auto scrollbar-none">
        {weekDates.map((d, i) => {
          const isSelected = d.toDateString() === date.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          
          return (
            <div 
              key={i} 
              className={`
                flex-1 min-w-[3rem] flex flex-col items-center py-2
                ${isSelected ? 'bg-primary/20' : ''}
                ${isToday ? 'text-primary' : ''}
                transition-all duration-300 ease-in-out
              `}
              onClick={() => onChangeDate(d)}
            >
              <div className="text-xs text-zinc-400">{weekDays[d.getDay()]}</div>
              <div className={`
                mt-1 w-8 h-8 rounded-full flex items-center justify-center
                ${isSelected ? 'bg-primary text-white' : ''}
                ${isToday && !isSelected ? 'border border-primary' : ''}
              `}>
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DayView({ selectedDate, events, onSelectEvent, onChangeDate }: DayViewProps) {
  const [scrollPos, setScrollPos] = useState(0);
  
  // Auto-scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only auto-scroll if it's the current day and within working hours
    if (
      selectedDate.toDateString() === now.toDateString() &&
      currentHour >= 7 && currentHour <= 22
    ) {
      const scrollPosition = (currentHour - 7) * 60 + now.getMinutes();
      setScrollPos(scrollPosition - 100); // Scroll a bit above current time
    } else {
      setScrollPos(0);
    }
  }, [selectedDate]);
  
  // Auto-scroll to the calculated position
  useEffect(() => {
    if (scrollPos > 0) {
      window.scrollTo({
        top: scrollPos,
        behavior: 'smooth'
      });
    }
  }, [scrollPos]);
  
  // Filter events for the selected date
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getDate() === selectedDate.getDate()
    );
  });
  
  // Group events by hour
  const eventsByHour: Record<number, CalendarEvent[]> = {};
  
  filteredEvents.forEach(event => {
    const hour = new Date(event.start).getHours();
    if (!eventsByHour[hour]) {
      eventsByHour[hour] = [];
    }
    eventsByHour[hour].push(event);
  });
  
  // Create time slots for the day (24 hours)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Filter to working hours (7-22)
  const workingHours = hours.filter(hour => hour >= 7 && hour <= 22);
  
  // Add current time indicator
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const timePosition = (currentMinute / 60) * 60;
  
  return (
    <div className="h-full bg-black flex flex-col">
      {/* Mobile Day Header with horizontal scroll */}
      {onChangeDate && (
        <DayHeader date={selectedDate} onChangeDate={onChangeDate} />
      )}
      
      <div className="flex-1 overflow-y-auto">
        {workingHours.map(hour => {
          const hourEvents = eventsByHour[hour] || [];
          const isCurrentHour = isToday && currentHour === hour;
          
          return (
            <div key={hour} className="flex border-b border-zinc-700 last:border-b-0 group bg-black hover:bg-zinc-900/40 transition-colors">
              {/* Time label */}
              <div className="w-16 py-1 pr-4 text-right text-xs font-medium text-zinc-400 sticky left-0 z-10 bg-inherit">
                {hour}:00
              </div>
              
              {/* Event container */}
              <div className="flex-1 h-[60px] relative">
                {hourEvents.map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onSelect={onSelectEvent}
                  />
                ))}
                
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div 
                    className="absolute left-0 right-0 border-t border-red-500 z-20 pointer-events-none"
                    style={{ top: `${timePosition}px` }}
                  >
                    <div className="absolute -left-1 -top-2 w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}