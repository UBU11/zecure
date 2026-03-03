import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface BillCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const BillCard: React.FC<BillCardProps> = ({ title, value, subValue, icon: Icon, trend }) => {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 premium-shadow hover:translate-y-[-4px] transition-transform duration-300">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <Icon className="w-6 h-6 text-purple-400" />
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {trend === 'up' ? '+12.5%' : '-8.2%'}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1 tracking-tight text-white">{value}</h3>
        {subValue && (
          <p className="text-slate-500 text-xs mt-1">{subValue}</p>
        )}
      </div>
    </div>
  );
};

export default BillCard;
