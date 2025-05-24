// components/calendar/ExternalEventsPanel.tsx
import { useEffect, useRef } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { 
  Clock, MapPin, Bookmark, Bell, Coffee, 
  Phone, Users, FileText, Package, Car
} from "lucide-react";

interface ExternalEventsPanelProps {
  onEventDrop?: (eventData: any) => void;
}

const eventTemplates = [
  {
    id: 'meeting',
    title: 'Riunione',
    duration: '01:00',
    eventType: 'appointment',
    icon: Users,
    color: '#3b82f6',
    location: 'office'
  },
  {
    id: 'call',
    title: 'Chiamata',
    duration: '00:30',
    eventType: 'appointment',
    icon: Phone,
    color: '#10b981',
    location: 'remote'
  },
  {
    id: 'reminder',
    title: 'Promemoria',
    duration: '00:15',
    eventType: 'reminder',
    icon: Bell,
    color: '#8b5cf6',
    location: ''
  },
  {
    id: 'break',
    title: 'Pausa',
    duration: '00:15',
    eventType: 'reminder',
    icon: Coffee,
    color: '#f59e0b',
    location: ''
  },
  {
    id: 'client',
    title: 'Appuntamento cliente',
    duration: '01:30',
    eventType: 'appointment',
    icon: Users,
    color: '#06b6d4',
    location: 'client'
  },
  {
    id: 'document',
    title: 'Revisione documenti',
    duration: '00:45',
    eventType: 'appointment',
    icon: FileText,
    color: '#ec4899',
    location: 'office'
  },
  {
    id: 'delivery',
    title: 'Consegna',
    duration: '00:30',
    eventType: 'appointment',
    icon: Package,
    color: '#84cc16',
    location: 'site'
  },
  {
    id: 'travel',
    title: 'Viaggio',
    duration: '02:00',
    eventType: 'appointment',
    icon: Car,
    color: '#64748b',
    location: 'remote'
  }
];

export default function ExternalEventsPanel({ onEventDrop }: ExternalEventsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  
  useEffect(() => {
    if (containerRef.current && !draggableRef.current) {
      // Initialize draggable for all event items
      draggableRef.current = new Draggable(containerRef.current, {
        itemSelector: '.fc-event-external',
        eventData: function(eventEl) {
          const eventData = JSON.parse(eventEl.getAttribute('data-event') || '{}');
          return {
            title: eventData.title,
            duration: eventData.duration,
            extendedProps: {
              eventType: eventData.eventType,
              location: eventData.location,
              status: 'pending',
              description: ''
            },
            backgroundColor: eventData.color,
            borderColor: eventData.color,
            classNames: [
              `fc-event-${eventData.eventType}`,
              'fc-event-pending'
            ]
          };
        }
      });
    }
    
    return () => {
      if (draggableRef.current) {
        draggableRef.current.destroy();
        draggableRef.current = null;
      }
    };
  }, []);
  
  return (
    <div className="bg-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 text-zinc-300">
        Eventi Rapidi
      </h3>
      <p className="text-xs text-zinc-500 mb-4">
        Trascina questi template nel calendario per creare eventi rapidamente
      </p>
      
      <div ref={containerRef} className="space-y-2">
        {eventTemplates.map((template) => {
          const Icon = template.icon;
          
          return (
            <div
              key={template.id}
              className="fc-event-external p-3 rounded-lg cursor-move transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: template.color + '20', borderLeft: `4px solid ${template.color}` }}
              data-event={JSON.stringify(template)}
            >
              <div className="flex items-start gap-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: template.color + '30' }}
                >
                  <Icon size={16} style={{ color: template.color }} />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-sm text-white mb-1">
                    {template.title}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {template.duration.replace(':', 'h ')}min
                    </span>
                    
                    {template.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {template.location === 'office' ? 'Ufficio' : 
                         template.location === 'client' ? 'Cliente' :
                         template.location === 'remote' ? 'Remoto' : 
                         template.location === 'site' ? 'Cantiere' : template.location}
                      </span>
                    )}
                    
                    <span className="flex items-center gap-1">
                      {template.eventType === 'reminder' ? (
                        <>
                          <Bell size={10} />
                          Promemoria
                        </>
                      ) : (
                        <>
                          <Bookmark size={10} />
                          Appuntamento
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg">
        <h4 className="text-xs font-medium text-zinc-400 mb-2">Come usare:</h4>
        <ul className="text-xs text-zinc-500 space-y-1">
          <li>• Trascina un template nel calendario</li>
          <li>• L'evento verrà creato nella data/ora selezionata</li>
          <li>• Modifica i dettagli dopo la creazione</li>
          <li>• Usa per creare eventi ricorrenti velocemente</li>
        </ul>
      </div>
    </div>
  );
}