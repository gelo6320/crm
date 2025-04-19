// components/ui/StatusBadge.tsx
interface StatusBadgeProps {
    status: string;
  }
  
  export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusLabel = (status: string) => {
      switch (status) {
        case "new": return "Nuovo";
        case "contacted": return "Contattato";
        case "qualified": return "Qualificato";
        case "opportunity": return "Opportunità";
        case "customer": return "Cliente";
        case "lost": return "Perso";
        case "pending": return "In attesa";
        case "confirmed": return "Confermato";
        case "completed": return "Completato";
        case "cancelled": return "Cancellato";
        default: return status;
      }
    };
    
    return (
      <span className={`badge badge-${status}`}>
        {getStatusLabel(status)}
      </span>
    );
  }