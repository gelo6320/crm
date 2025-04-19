// components/events/EventsTable.tsx
import { CheckCircle, XCircle, Search } from "lucide-react";
import { Event } from "@/types";
import { formatDateTime } from "@/lib/utils/date";

interface EventsTableProps {
  events: Event[];
  isLoading: boolean;
  onViewDetails: (event: Event) => void;
}

export default function EventsTable({ events, isLoading, onViewDetails }: EventsTableProps) {
  if (isLoading && events.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessun evento trovato
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
          <tr>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left hidden md:table-cell">Tipo lead</th>
            <th className="px-4 py-2 text-left">Nome evento</th>
            <th className="px-4 py-2 text-left">Stato</th>
            <th className="px-4 py-2 text-left">Dettagli</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {events.map((event) => (
            <tr 
              key={event._id} 
              className={`hover:bg-zinc-800/50 transition-colors ${
                event.success ? "bg-success/5" : "bg-danger/5"
              }`}
            >
              <td className="px-4 py-2.5 whitespace-nowrap">
                {formatDateTime(event.createdAt)}
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell">
                {event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}
              </td>
              <td className="px-4 py-2.5">
                {event.eventName}
              </td>
              <td className="px-4 py-2.5">
                {event.success ? (
                  <span className="inline-flex items-center text-success">
                    <CheckCircle size={14} className="mr-1" /> 
                    <span className="hidden sm:inline">Inviato</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center text-danger">
                    <XCircle size={14} className="mr-1" /> 
                    <span className="hidden sm:inline">Errore</span>
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <button
                  onClick={() => onViewDetails(event)}
                  className="btn btn-outline p-1.5 text-xs"
                >
                  <Search size={14} className="mr-1" /> 
                  <span className="hidden sm:inline">Dettagli</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}