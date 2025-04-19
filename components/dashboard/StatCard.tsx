// components/dashboard/StatCard.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  rate: string;
  href: string;
  color: "primary" | "success" | "info" | "warning" | "danger";
}

export default function StatCard({ title, icon, value, rate, href, color }: StatCardProps) {
  const colorVariants = {
    primary: "border-l-primary",
    success: "border-l-success",
    info: "border-l-info",
    warning: "border-l-warning",
    danger: "border-l-danger",
  };
  
  const progressVariants = {
    primary: "bg-primary",
    success: "bg-success",
    info: "bg-info",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className={`card card-hover border-l-4 ${colorVariants[color]}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center">
            <span className="mr-2">{icon}</span>
            {title}
          </h3>
        </div>
        
        <div className="mt-2">
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        
        <div className="mt-3">
          <div className="relative h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full ${progressVariants[color]}`}
              style={{ width: rate }}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-zinc-400">{rate} conversione</span>
            <Link href={href} className="text-xs font-medium flex items-center text-primary hover:text-primary-hover">
              Visualizza <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}