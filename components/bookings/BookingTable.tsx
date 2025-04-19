// components/bookings/BookingTable.tsx
import { Pencil, Share2 } from "lucide-react";
import { Booking } from "@/types";
import { formatDate } from "@/lib/utils/date";
import StatusBadge from "@/components/ui/StatusBadge";

interface BookingTableProps {
  bookings: Booking[];
  isLoading: boolean;
  onEditBooking: (booking: Booking) => void;
  onViewEvents: (booking: Booking) => void;
}

export default function BookingTable({ 
  bookings, 
  isLoading, 
  onEditBooking, 
  onViewEvents 
}: BookingTableProps) {
  if (isLoading && bookings.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessuna prenotazione trovata
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs uppercase text-zinc-500 bg-zinc-900/50">
          <tr>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left">Nome</th>
            <th className="px-4 py-2 text-left hidden md:table-cell">Email</th>
            <th className="px-4 py-2 text-left hidden sm:table-cell">Telefono</th>
            <th className="px-4 py-2 text-left">Ora</th>
            <th className="px-4 py-2 text-left">Stato</th>
            <th className="px-4 py-2 text-left">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {bookings.map((booking) => (
            <tr key={booking._id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-2.5 whitespace-nowrap">
                {formatDate(booking.bookingTimestamp)}
              </td>
              <td className="px-4 py-2.5 font-medium">
                {booking.name}
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell">
                {booking.email}
              </td>
              <td className="px-4 py-2.5 hidden sm:table-cell">
                {booking.phone}
              </td>
              <td className="px-4 py-2.5">
                {booking.bookingTime}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={booking.status} />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditBooking(booking)}
                    className="p-1 rounded hover:bg-zinc-700 transition-colors"
                    title="Modifica stato"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onViewEvents(booking)}
                    className="p-1 rounded hover:bg-zinc-700 transition-colors"
                    title="Visualizza eventi"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}