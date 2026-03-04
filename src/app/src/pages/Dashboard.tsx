import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnergyStore } from '../lib/energyStore';
import UsageChart from '../components/UsageChart';
import BillCard from '../components/BillCard';
import { Zap, DollarSign, Activity, FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { UserButton } from "@clerk/clerk-react";

const Dashboard: React.FC = () => {
  const { dailyUsage, weeklyUsage, currentBill, totalConsumption, projectedBill, currency, refreshData, startRealtime, isLive, lastUpdated } = useEnergyStore();
  const navigate = useNavigate();
  //refreshes every second
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  useEffect(() => {
    refreshData().then(() => {
   
      startRealtime();
    });

    return () => {
      import('../lib/supabase').then(({ supabase }) => supabase.removeAllChannels());
    };

  }, []);

  return (
    <div className="min-h-screen bg-[#030014] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
          <h1 className="text-4xl font-bold gradient-text">Smart Energy Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400">Real-time monitoring and analytics</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${
              isLive
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : 'bg-slate-700/40 text-slate-500 border border-slate-600/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
              }`} />
              {isLive ? 'Live' : 'Offline'}
            </span>
            {formattedTime && (
              <span className="text-xs text-slate-500">Updated {formattedTime}</span>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
        >
          <button 
            onClick={refreshData}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-medium transition-all shadow-lg hover:shadow-purple-500/20"
          >
            Refresh Data
          </button>
          
          <div className="p-1 glass-card rounded-full premium-shadow flex items-center justify-center border border-white/10">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9",
                  userButtonPopoverCard: "bg-[#030014] border border-white/10 shadow-2xl rounded-2xl",
                  userButtonPopoverActionButtonText: "text-white font-medium",
                  userButtonPopoverActionButtonIcon: "text-purple-400",
                  userButtonOuterIdentifier: "text-white font-bold",
                  clerkLogoBox: "hidden",
                  developmentBadge: "hidden",
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <BillCard 
            title="Current Bill" 
            value={`${currency}${currentBill.toFixed(2)}`} 
            subValue="For the current period"
            icon={DollarSign}
            trend="up"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <BillCard 
            title="Total Usage" 
            value={`${totalConsumption.toFixed(1)} kWh`} 
            subValue="32% higher than last month"
            icon={Zap}
            trend="up"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <BillCard 
            title="Projected Bill" 
            value={`${currency}${projectedBill.toFixed(2)}`} 
            subValue="Based on current patterns"
            icon={FileText}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <BillCard 
            title="System Status" 
            value="Optimal" 
            subValue="All sensors active"
            icon={Activity}
            trend="down"
          />
        </motion.div>
      </div>

      
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-8"
        >
          <UsageChart 
            data={dailyUsage} 
            title="Daily Power Consumption" 
            subTitle="Hourly usage in kWh"
            type="splinearea"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass-card p-6 min-h-[150px] flex items-center justify-center">
                <p className="text-slate-500 italic">Advanced Analytics Panel Coming Soon</p>
             </div>
             <div className="glass-card p-6 min-h-[150px] flex items-center justify-center">
                <p className="text-slate-500 italic">Peak Usage Alerts</p>
             </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Weekly Overview</h3>
             <UsageChart 
                data={weeklyUsage} 
                title="" 
                subTitle=""
                type="column2d"
              />
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Quick Tips</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                Setting your AC to 24°C can save up to 15% on daily usage.
              </li>
              <li className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                Scheduled laundry during off-peak hours (10 PM - 6 AM) reduces tariff costs.
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
