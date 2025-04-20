// components/calendar/DayView.tsx
import { useRef, useEffect, useState } from "react";
import { useDrag } from "react-dnd";
import { CalendarEvent } from "@/types";
import { getEventColor } from "@/lib/utils/calendar";
import { formatTime } from "@/lib/utils/date";
import { ChevronDown } from "lucide-react";

interface DayViewProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onChangeDate?: (date: Date) => void;
  onCreateEvent?: (start: Date, end: Date) => void;
}

interface EventItemProps {
  event: CalendarEvent;
  onSelect: (event: CalendarEvent) => void;
  onResize?: (event: CalendarEvent, newHeight: number) => void;
}

// Componente per l'evento con funzionalità di drag e resize
function EventItem({ event, onSelect, onResize }: EventItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [height, setHeight] = useState(0);
  
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
  
  useEffect(() => {
    setHeight(durationMinutes);
  }, [durationMinutes]);
  
  // Gestione resize tramite touch
  useEffect(() => {
    const resizeHandle = resizeHandleRef.current;
    if (!resizeHandle) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      setStartY(e.touches[0].clientY);
      setHeight(durationMinutes);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isResizing) return;
      e.stopPropagation();
      
      setIsResizing(false);
      
      if (onResize && Math.abs(height - durationMinutes) > 5) {
        // Solo se la modifica è significativa (più di 5 minuti)
        const updatedEvent = { ...event };
        const newEnd = new Date(start.getTime() + height * 60000);
        updatedEvent.end = newEnd;
        onResize(updatedEvent, height);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      e.stopPropagation();
      
      const deltaY = e.touches[0].clientY - startY;
      const newHeight = Math.max(30, durationMinutes + deltaY); // Minimo 30 minuti
      setHeight(newHeight);
    };
    
    resizeHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      resizeHandle.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing, startY, durationMinutes, event, onResize, height, start]);
  
  // Prevenire il default touch per evitare lo scroll durante il drag
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const preventDefaultTouch = (e: TouchEvent) => {
      if (isDragging || isResizing) {
        e.preventDefault();
      }
    };
    
    element.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    
    return () => {
      element.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, [isDragging, isResizing]);
  
  return (
    <div
      ref={ref}
      className={`
        absolute left-0 right-0 rounded px-2 py-1 cursor-pointer
        text-white shadow-md border-l-4 z-10 overflow-hidden
        ${isDragging ? 'opacity-50' : ''}
        ${isResizing ? 'resize-active' : ''}
        animate-fade-in
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: getEventColor(event.status),
        borderLeftColor: getEventColor(event.status, true),
      }}
      onClick={() => !isResizing && onSelect(event)}
    >
      <div className="text-xs font-medium mb-0.5">
        {formatTime(start)} - {formatTime(end)}
      </div>
      <div className="font-medium truncate">{event.title}</div>
      {height > 60 && (
        <div className="text-xs truncate opacity-80">{event.description}</div>
      )}
      
      {/* Maniglia per resize */}
      <div 
        ref={resizeHandleRef}
        className="absolute bottom-0 left-0 right-0 h-6 cursor-ns-resize flex justify-center items-end opacity-60 hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <ChevronDown size={14} />
      </div>
    </div>
  );
}

function DayHeader({ date, onChangeDate }: { date: Date, onChangeDate: (date: Date) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);
  const touchMoveRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const today = new Date();
  
  // Mostra 6 settimane (42 giorni)
  const daysToShow = 42;
  
  // Crea una data di partenza 21 giorni prima della data selezionata
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 21);
  
  // Creazione array di giorni
  const weekDates = Array.from({ length: daysToShow }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });
  
  // Aggiungi uno stato e logica per caricare più giorni durante lo scorrimento
  const [isScrollingRight, setIsScrollingRight] = useState(false);
  const [isScrollingLeft, setIsScrollingLeft] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  
  // Gestione dello scrolling per caricare più giorni
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const maxScroll = e.currentTarget.scrollWidth - e.currentTarget.clientWidth;
    
    // Determina la direzione dello scorrimento
    if (scrollLeft > lastScrollPosition) {
      // Scorrendo verso destra
      if (scrollLeft > maxScroll - 100 && !isScrollingRight) {
        setIsScrollingRight(true);
        // Qui puoi aggiungere logica per caricare più giorni a destra
      }
    } else {
      // Scorrendo verso sinistra
      if (scrollLeft < 100 && !isScrollingLeft) {
        setIsScrollingLeft(true);
        // Qui puoi aggiungere logica per caricare più giorni a sinistra
      }
    }
    
    setLastScrollPosition(scrollLeft);
  };
  
  // Reset degli stati di scrolling
  useEffect(() => {
    if (isScrollingRight || isScrollingLeft) {
      setTimeout(() => {
        setIsScrollingRight(false);
        setIsScrollingLeft(false);
      }, 500);
    }
  }, [isScrollingRight, isScrollingLeft]);
  
  // Scorri all'inizio per mostrare più giorni futuri
  useEffect(() => {
    if (scrollRef.current) {
      // Scorri a circa 1/3 della larghezza totale per mostrare più giorni futuri
      const scrollPosition = scrollRef.current.scrollWidth / 3;
      scrollRef.current.scrollLeft = scrollPosition;
    }
  }, []);
  
  // Gestione touch per scorrimento più fluido
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchMoveRef.current = 0;
    setIsDragging(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchMoveRef.current = e.touches[0].clientX - touchStartRef.current;
    
    // Se lo spostamento è significativo, considera un trascinamento
    if (Math.abs(touchMoveRef.current) > 10) {
      setIsDragging(true);
    }
  };

  const handleTouchEnd = (d: Date, e: React.TouchEvent) => {
    // Se non è un trascinamento, considera un tap
    if (!isDragging) {
      onChangeDate(d);
    }
    setIsDragging(false);
  };  
  
  return (
    <div className="md:hidden bg-black sticky top-0 z-20 w-full border-b border-zinc-800">
      {/* Days of week scroller */}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-none touch-pan-x"
        onScroll={handleScroll}
      >
        {weekDates.map((d, i) => {
          const isSelected = d.toDateString() === date.toDateString();
          const isToday = d.toDateString() === today.toDateString();
          
          return (
            <div 
              key={i} 
              className={`
                flex-shrink-0 min-w-[3rem] flex flex-col items-center py-2
                ${isSelected ? 'bg-primary/20' : ''}
                ${isToday ? 'text-primary' : ''}
                transition-all duration-300 ease-in-out
              `}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={(e) => handleTouchEnd(d, e)}
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

export default function DayView({ 
  selectedDate, 
  events, 
  onSelectEvent, 
  onChangeDate,
  onCreateEvent
}: DayViewProps) {
  const [scrollPos, setScrollPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const [longPressStartTime, setLongPressStartTime] = useState<Date | null>(null);
  const [longPressHour, setLongPressHour] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const [isDraggingTimeslot, setIsDraggingTimeslot] = useState(false);
  
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
    if (scrollPos > 0 && containerRef.current) {
      containerRef.current.scrollTop = scrollPos;
    }
  }, [scrollPos]);
  
  // Gestione degli eventi di resize
  const handleResizeEvent = (event: CalendarEvent, newHeight: number) => {
    const updatedEvent = { ...event };
    const start = new Date(event.start);
    const newEnd = new Date(start.getTime() + newHeight * 60000);
    updatedEvent.end = newEnd;
    
    // Invia l'evento aggiornato al componente parent
    onSelectEvent(updatedEvent);
  };
  
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
  
  // Modifica handleTouchStart
  const handleTouchStart = (hour: number, e: React.TouchEvent) => {
    e.preventDefault(); // Aggiungi per prevenire comportamenti predefiniti
    
    // Memorizza l'ora e la posizione iniziale
    setLongPressHour(hour);
    setTouchStartPos({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    
    // Avvia il timer per il long press
    const longPressTimer = setTimeout(() => {
      // Se il touch è ancora attivo dopo 500ms, considera un long press
      setLongPressActive(true);
      
      // Calcola l'orario preciso in base alla posizione Y all'interno della cella
      if (containerRef.current) {
        const hourCell = containerRef.current.querySelector(`[data-hour="${hour}"]`);
        if (hourCell) {
          const rect = hourCell.getBoundingClientRect();
          const relativeY = e.touches[0].clientY - rect.top;
          const percentInHour = relativeY / rect.height;
          const minutes = Math.floor(percentInHour * 60);
          
          // Crea una data per l'orario di inizio
          const startTime = new Date(selectedDate);
          startTime.setHours(hour, minutes, 0, 0);
          setLongPressStartTime(startTime);
        }
      }
    }, 500);
    
    // Salva il riferimento al timer
    longPressTimerRef.current = longPressTimer;
    
    return () => {
      // Pulisci il timer se il componente viene smontato
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  };
  
  // Aggiungi il riferimento per salvare il timer
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Cancella sempre il timer quando il touch finisce
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Se era attivo un long press, crea un nuovo evento
    if (longPressActive && longPressStartTime && onCreateEvent) {
      // Calcola l'orario di fine (default: 1 ora dopo)
      const endTime = new Date(longPressStartTime.getTime() + 60 * 60000);
      onCreateEvent(longPressStartTime, endTime);
    }
    
    // Reset dello stato
    setLongPressActive(false);
    setLongPressStartTime(null);
    setLongPressHour(null);
    setTouchStartPos(null);
    setIsDraggingTimeslot(false);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    // Se non c'è una posizione iniziale, non fare nulla
    if (!touchStartPos) return;
    
    // Calcola lo spostamento
    const deltaX = e.touches[0].clientX - touchStartPos.x;
    const deltaY = e.touches[0].clientY - touchStartPos.y;
    
    // Se lo spostamento è significativo, marca come trascinamento
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      setIsDraggingTimeslot(true);
    }
    
    // Se è attivo un long press, aggiorna la durata dell'evento
    if (longPressActive && longPressStartTime) {
      // Implementare la logica per ridimensionare l'evento in base al movimento del dito
    }
  };
  
  return (
    <div className="h-full bg-black flex flex-col">
      {/* Mobile Day Header con scroll orizzontale */}
      {onChangeDate && (
        <DayHeader date={selectedDate} onChangeDate={onChangeDate} />
      )}
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full"
      >
        {workingHours.map(hour => {
          const hourEvents = eventsByHour[hour] || [];
          const isCurrentHour = isToday && currentHour === hour;
          
          return (
            <div 
              key={hour} 
              data-hour={hour}
              className="flex border-b border-zinc-700 last:border-b-0 group bg-black hover:bg-zinc-900/40 transition-colors w-full"
              onTouchStart={(e) => handleTouchStart(hour, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {/* Time label */}
              <div className="w-12 py-1 pr-1 text-right text-xs font-medium text-zinc-400 sticky left-0 z-10 bg-inherit">
                {hour}:00
              </div>
              
              {/* Event container */}
              <div className="flex-1 h-[60px] relative">
                {hourEvents.map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onSelect={onSelectEvent}
                    onResize={handleResizeEvent}
                  />
                ))}
                
                {/* Current time indicator */}
                {isCurrentHour && (
                  <div 
                    className="absolute left-0 right-0 border-t border-red-500 z-20 pointer-events-none"
                    style={{ top: `${timePosition}px` }}
                  >
                    <div className="absolute -left-1 -top-2 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
                
                {/* Preview di creazione evento se long press è attivo */}
                {longPressActive && longPressStartTime && longPressHour === hour && (
                  <div 
                    className="absolute left-0 right-0 bg-primary/30 border border-primary z-5 rounded"
                    style={{
                      top: `${(longPressStartTime.getMinutes() / 60) * 60}px`,
                      height: '60px'
                    }}
                  ></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}