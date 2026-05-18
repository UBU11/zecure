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
  const { livePower, dailyUsage, weeklyUsage, currentBill, totalConsumption, projectedBill, currency, refreshData, startRealtime, isLive, lastUpdated, setUserId } = useEnergyStore();
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
      // Only remove energy channels, not all channels
      import('../lib/supabase').then(({ supabase }) => {
        const channels = supabase.getChannels();
        for (const ch of channels) {
          if (ch.topic.includes('realtime-energy')) {
            supabase.removeChannel(ch);
          }
        }
      });
    };
  }, [user?.id, setUserId]);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-900 hover:text-purple-600 mb-4 transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3px]" /> Back to Home
          </button>
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2">Smart Energy</h1>
          <div className="flex items-center gap-3">
            <p className="text-slate-700 font-bold uppercase tracking-widest text-sm">Dashboard</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-slate-900 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
              isLive
                ? 'bg-[#4ade80] text-slate-900'
                : 'bg-slate-300 text-slate-600'
            }`}>
              <span className={`w-2 h-2 border border-slate-900 ${
                isLive ? 'bg-white animate-pulse' : 'bg-slate-500'
              }`} />
              {isLive ? 'Live' : 'Offline'}
            </span>
            {formattedTime && (
              <span className="text-xs font-bold text-slate-500">Updated {formattedTime}</span>
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
            className="neo-button"
          >
            Refresh Data
          </button>

          <div className="p-1 bg-white border-4 border-slate-900 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10 rounded-none border-2 border-slate-900",
                  userButtonPopoverCard: "bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] rounded-none",
                  userButtonPopoverActionButtonText: "text-slate-900 font-bold uppercase",
                  userButtonPopoverActionButtonIcon: "text-slate-900",
                  userButtonOuterIdentifier: "text-slate-900 font-black",
                  clerkLogoBox: "hidden",
                  developmentBadge: "hidden",
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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


      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 space-y-8"
        >
          <UsageChart
            data={livePower}
            title="Live System Draw"
            subTitle="Real-time high-frequency power readings (Watts)"
            type="splinearea"
          />

          <UsageChart
            data={dailyUsage}
            title="Daily Power Consumption"
            subTitle="Hourly usage accumulation in kWh"
            type="column2d"
          />

          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="neo-box neo-shadow p-6 min-h-[150px] flex items-center justify-center bg-[#fbbf24]">
                <p className="text-slate-900 font-black uppercase tracking-widest text-xl text-center">Energy Saving Mode Active</p>
             </div>
             <div className={`neo-box neo-shadow p-6 min-h-[150px] flex flex-col items-center justify-center ${insights.peakAlert !== 'Normal' ? 'bg-[#f472b6]' : 'bg-[#4ade80]'}`}>
                <Activity className={`w-10 h-10 mb-2 stroke-[3px] text-slate-900`} />
                <p className={`text-center font-black uppercase tracking-wider text-slate-900`}>
                  {insights.peakAlert}
                </p>
                {insights.peakAlert === 'Normal' && <p className="text-sm font-bold text-slate-900 mt-2 border-2 border-slate-900 p-1 bg-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">No unusual spikes detected</p>}
             </div>
          </div> */}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-8"
        >
          <div className="neo-box neo-shadow p-6 bg-white">
            <h3 className="text-2xl neo-title mb-4">Weekly Overview</h3>
             <UsageChart
                data={weeklyUsage}
                title=""
                subTitle=""
                type="column2d"
              />
          </div>

          <div className="neo-box neo-shadow p-6 bg-[#c084fc]">
            <div className="flex items-center justify-between mb-6 border-b-4 border-slate-900 pb-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Quick Tips</h3>
              {user?.id && (
                <button
                  onClick={() => fetchInsights(user.id!)}
                  disabled={insights.loading}
                  className="p-2 bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  <span className="font-bold uppercase text-xs">
                    {insights.loading ? 'Loading...' : 'Refresh'}
                  </span>
                </button>
              )}
            </div>
            {insights.loading ? (
              <div className="flex items-center gap-3 text-slate-900 font-bold uppercase tracking-widest py-4">
                <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                Generating...
              </div>
            ) : (
              <ul className="space-y-4 text-sm text-slate-900 font-bold">
                {insights.tips.length > 0 ? (
                  insights.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white p-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <div className={`w-3 h-3 border-2 border-slate-900 mt-1 shrink-0 ${i % 2 === 0 ? 'bg-[#4ade80]' : 'bg-[#fbbf24]'}`} />
                      {tip}
                    </li>
                  ))
                ) : (
                  <li className="font-black uppercase tracking-widest">No tips available. Click Refresh to generate.</li>
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
