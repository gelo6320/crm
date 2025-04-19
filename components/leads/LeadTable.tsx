// components/leads/LeadTable.tsx
import { Pencil, Share2 } from "lucide-react";
import { Lead } from "@/types";
import { formatDate } from "@/lib/utils/date";
import StatusBadge from "@/components/ui/StatusBadge";

interface LeadTableProps {
  leads: Lead[];
  type: "form" | "booking" | "facebook";
  isLoading: boolean;
  onEditLead: (lead: Lead) => void;
  onViewEvents: (lead: Lead) => void;
}

export default function LeadTable({ leads, type, isLoading, onEditLead, onViewEvents }: LeadTableProps) {
  if (isLoading && leads.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary mx-auto mb-4"></div>
        <p>Caricamento in corso...</p>
      </div>
    );
  }
  
  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Nessun dato trovato
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
            <th className="px-4 py-2 text-left">Stato</th>
            <th className="px-4 py-2 text-left hidden md:table-cell">Fonte</th>
            <th className="px-4 py-2 text-left">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {leads.map((lead) => (
            <tr key={lead._id} className="hover:bg-zinc-800/50 transition-colors">
              <td className="px-4 py-2.5 whitespace-nowrap">
                {formatDate(lead.createdAt)}
              </td>
              <td className="px-4 py-2.5 font-medium">
                {lead.name}
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell">
                {lead.email}
              </td>
              <td className="px-4 py-2.5 hidden sm:table-cell">
                {lead.phone}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={lead.status} />
              </td>
              <td className="px-4 py-2.5 hidden md:table-cell">
                {lead.source || "-"}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditLead(lead)}
                    className="p-1 rounded hover:bg-zinc-700 transition-colors"
                    title="Modifica stato"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onViewEvents(lead)}
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