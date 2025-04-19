// components/calendar/DayView.tsx
import { useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import { CalendarEvent } from "@/types";
import { getEventColor } from "@/lib/utils/calendar";
import { formatTime } from "@/lib/utils/date";

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
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

export default function DayView({ selectedDate, events, onSelectEvent }: DayViewProps) {
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
  
  return (
    <div className="h-full overflow-y-auto p-2">
      {workingHours.map(hour => {
        const hourEvents = eventsByHour[hour] || [];
        
        return (
          <div key={hour} className="flex border-b border-zinc-700 last:border-b-0">
            {/* Time label */}
            <div className="w-16 py-1 pr-4 text-right text-xs font-medium text-zinc-400 sticky left-0">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}