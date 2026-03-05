import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnergyStore } from '../lib/energyStore';
import UsageChart from '../components/UsageChart';
import BillCard from '../components/BillCard';
import { Zap, DollarSign, Activity, FileText, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { UserButton, useUser } from "@clerk/clerk-react";
import Chat from '../components/Chat';

const Dashboard: React.FC = () => {
  const { user } = useUser();
  const { dailyUsage, weeklyUsage, currentBill, totalConsumption, projectedBill, currency, refreshData, startRealtime, isLive, lastUpdated, setUserId } = useEnergyStore();
  const navigate = useNavigate();
  //refreshes every second
  const [, setTick] = useState(0);
  const [insights, setInsights] = useState<{ tips: string[], peakAlert: string, loading: boolean }>({
    tips: [],
    peakAlert: 'Normal',
    loading: true,
  });

  const fetchInsights = async (uid: string) => {
    setInsights(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('http://localhost:3005/agents/energy-agent/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.tips && data.peakAlert) {
        setInsights({ tips: data.tips, peakAlert: data.peakAlert, loading: false });
      } else {
        throw new Error('Invalid response shape');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setInsights({
        tips: ['Check that high-draw appliances are off when not in use.', 'Consider shifting laundry to off-peak hours.'],
        peakAlert: 'Agent Offline — showing default tips',
        loading: false,
      });
    }
  };

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (user?.id) fetchInsights(user.id);
  }, [user?.id]);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      refreshData().then(() => {
        startRealtime();
      });
    }
    
    return () => {
      import('../lib/supabase').then(({ supabase }) => supabase.removeAllChannels());
    };
  }, [user?.id, setUserId]);

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
            onClick={() => { refreshData(); if (user?.id) fetchInsights(user.id); }}
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
             <div className={`glass-card p-6 min-h-[150px] flex flex-col items-center justify-center border ${insights.peakAlert !== 'Normal' ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/10'}`}>
                <Activity className={`w-8 h-8 mb-2 ${insights.peakAlert !== 'Normal' ? 'text-amber-400' : 'text-slate-500'}`} />
                <p className={`text-center font-medium ${insights.peakAlert !== 'Normal' ? 'text-amber-200' : 'text-slate-400'}`}>
                  {insights.peakAlert}
                </p>
                {insights.peakAlert === 'Normal' && <p className="text-xs text-slate-500 mt-1">No unusual spikes detected</p>}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Quick Tips</h3>
              {user?.id && (
                <button
                  onClick={() => fetchInsights(user.id!)}
                  disabled={insights.loading}
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  {insights.loading ? '⟳ Loading…' : '↺ Refresh'}
                </button>
              )}
            </div>
            {insights.loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                Generating AI insights…
              </div>
            ) : (
              <ul className="space-y-4 text-sm text-slate-400">
                {insights.tips.length > 0 ? (
                  insights.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${i % 2 === 0 ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                      {tip}
                    </li>
                  ))
                ) : (
                  <li className="italic text-slate-500">No tips available. Click Refresh to generate.</li>
                )}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      <Chat userId={user?.id || 'anonymous'} />
    </div>
  );
};

export default Dashboard;
