
import { motion } from 'motion/react';

interface IntensityMeterProps {
  powerW: number;
  maxCapacityW?: number;
  voltageV?: number;
  frequencyHz?: number;
  powerFactor?: number;
}

const IntensityMeter: React.FC<IntensityMeterProps> = ({
  powerW,
  maxCapacityW = 5000,
  voltageV = 220,
  frequencyHz = 50,
  powerFactor = 0.95,
}) => {
  const pct = Math.min((powerW / maxCapacityW) * 100, 100);
  const color = pct < 40 ? '#22d3ee' : pct < 70 ? '#f59e0b' : '#ef4444';
  const label = pct < 40 ? 'Low Load' : pct < 70 ? 'Moderate' : 'High Load';
  const ampsA = voltageV > 0 ? (powerW / voltageV).toFixed(1) : '0.0';

  return (
    <div className="flex flex-col gap-4">
     
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Current Intensity
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, background: `${color}20` }}>
            {label}
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
       
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`,
            }}
            animate={{ x: ['−100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-500">0 W</span>
          <span className="text-xs font-bold" style={{ color }}>
            {powerW >= 1000 ? `${(powerW / 1000).toFixed(2)} kW` : `${powerW.toFixed(0)} W`}
          </span>
          <span className="text-xs text-slate-500">{(maxCapacityW / 1000).toFixed(0)} kW max</span>
        </div>
      </div>

      {/* Power quality mini-grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Voltage', value: `${voltageV.toFixed(1)}V`, accent: '#22d3ee' },
          { label: 'Frequency', value: `${frequencyHz.toFixed(2)}Hz`, accent: '#a78bfa' },
          { label: 'Power Factor', value: powerFactor.toFixed(3), accent: '#34d399' },
          { label: 'Amperage', value: `${ampsA}A`, accent: '#f59e0b' },
          { label: 'Load %', value: `${pct.toFixed(1)}%`, accent: color },
          { label: 'Apparent', value: `${(powerW / powerFactor).toFixed(0)}VA`, accent: '#64748b' },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-0.5 border border-white/5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</span>
            <span className="text-sm font-bold" style={{ color: item.accent }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntensityMeter;
