// components/sales-funnel/ModernFunnelStats.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Award } from "lucide-react";
import { FunnelStats as FunnelStatsType } from "@/types";

interface ModernFunnelStatsProps {
  stats: FunnelStatsType;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  delay: number;
}

// Enhanced StatCard component with animations
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, delay }) => (
  <motion.div 
    className="stat-card-modern"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 30,
      delay: delay
    }}
    whileHover={{ 
      y: -5, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)" 
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <motion.p 
          className="text-xs font-medium text-zinc-500 mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2 }}
        >
          {title}
        </motion.p>
        <motion.p 
          className="text-xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3, type: "spring", stiffness: 300 }}
        >
          {value}
        </motion.p>
        {trend !== undefined && (
          <motion.div 
            className="flex items-center mt-1 text-xs"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.4 }}
          >
            <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </motion.div>
        )}
      </div>
      <motion.div 
        className="icon-wrapper"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 15,
          delay: delay + 0.1
        }}
        whileHover={{ 
          rotate: [0, -10, 10, -10, 0],
          transition: { duration: 0.5 }
        }}
      >
        {icon}
      </motion.div>
    </div>
  </motion.div>
);

export default function ModernFunnelStats({ stats }: ModernFunnelStatsProps) {
  // Format currency
  const formatMoney = (value: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <motion.div 
      className="stats-container-modern"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tasso Conversione" 
          value={`${stats.conversionRate}%`}
          icon={<TrendingUp size={24} className="text-orange-500" />}
          trend={2.5}
          delay={0}
        />
        
        <StatCard 
          title="Lead Totali" 
          value={stats.totalLeads}
          icon={<Users size={24} className="text-blue-400" />}
          delay={0.1}
        />
        
        <StatCard 
          title="Valore Potenziale" 
          value={formatMoney(stats.potentialValue)}
          icon={<DollarSign size={24} className="text-yellow-400" />}
          delay={0.2}
        />
        
        <StatCard 
          title="Valore Realizzato" 
          value={formatMoney(stats.realizedValue)}
          icon={<Award size={24} className="text-green-500" />}
          trend={5.8}
          delay={0.3}
        />
      </div>
    </motion.div>
  );
}