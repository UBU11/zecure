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
    <div className="neo-box neo-shadow-hover p-6 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-[#f472b6] border-4 border-slate-900 rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
          <Icon className="w-6 h-6 text-slate-900 stroke-[3px]" />
        </div>
        {trend && (
          <div className={`px-2 py-1 border-2 border-slate-900 font-bold uppercase tracking-wider text-[10px] ${
            trend === 'up' ? 'bg-[#fbbf24] text-slate-900' : 'bg-[#4ade80] text-slate-900'
          } shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`}>
            {trend === 'up' ? '+12.5%' : '-8.2%'}
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <p className="text-slate-900 text-sm font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-4xl font-black mt-1 tracking-tighter text-slate-900">{value}</h3>
        {subValue && (
          <p className="text-slate-700 text-xs mt-2 font-bold bg-slate-100 p-2 border-2 border-slate-900 inline-block shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default BillCard;
