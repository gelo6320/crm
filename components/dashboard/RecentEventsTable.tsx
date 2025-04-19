// components/dashboard/RecentEventsTable.tsx
import { CheckCircle, XCircle } from "lucide-react";
import { Event } from "@/types";
import { formatDate } from "@/lib/utils/date";

interface RecentEventsTableProps {
  events: Event[];
}

export default function RecentEventsTable({ events }: RecentEventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-500 text-sm">
        Nessun evento recente
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
          <tr>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left">Tipo lead</th>
            <th className="px-4 py-2 text-left">Evento</th>
            <th className="px-4 py-2 text-left">Stato</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {events.map((event) => (
            <tr key={event._id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-2.5 whitespace-nowrap">
                {formatDate(event.createdAt)}
              </td>
              <td className="px-4 py-2.5">
                {event.leadType === 'form' ? 'Form contatto' : 'Prenotazione'}
              </td>
              <td className="px-4 py-2.5">
                {event.eventName}
              </td>
              <td className="px-4 py-2.5">
                {event.success ? (
                  <span className="inline-flex items-center text-success">
                    <CheckCircle size={14} className="mr-1" /> Inviato
                  </span>
                ) : (
                  <span className="inline-flex items-center text-danger">
                    <XCircle size={14} className="mr-1" /> Errore
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}