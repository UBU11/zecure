
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accentColor?: string;
  glowColor?: string;
  index?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  trendLabel,
  accentColor = '#8b5cf6',
  glowColor = 'rgba(139,92,246,0.2)',
  index = 0,
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#ef4444' : trend === 'down' ? '#22c55e' : '#64748b';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-5 flex flex-col gap-3 relative overflow-hidden cursor-default group"
      style={{ boxShadow: `0 0 40px -10px ${glowColor}` }}
    >
      {/* Background glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: accentColor }}
      />

      <div className="flex justify-between items-start relative z-10">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${trendColor}15`, color: trendColor }}
          >
            <TrendIcon className="w-3 h-3" />
            {trendLabel ?? (trend === 'up' ? '+12.5%' : trend === 'down' ? '−8.2%' : '—')}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
        <motion.h3
          className="text-2xl font-black mt-0.5 tracking-tight text-white"
          key={value}
          initial={{ opacity: 0.6, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {value}
        </motion.h3>
        {subValue && (
          <p className="text-slate-500 text-xs mt-1">{subValue}</p>
        )}
      </div>

      {/* Bottom accent stripe */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />
    </motion.div>
  );
};

export default StatCard;
