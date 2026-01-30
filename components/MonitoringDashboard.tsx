
import React from 'react';
import { AppStats } from '../types';
import { Activity, Ban, CheckCircle, Zap, ShieldAlert } from 'lucide-react';

interface MonitoringDashboardProps {
  stats: AppStats;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ stats }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Network Monitoring
        </h3>
        {stats.rateLimitStatus > 70 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-amber-500 font-bold">HIGH LOAD</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckCircle className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold">Verifications</span>
          </div>
          <div className="text-xl font-mono text-emerald-400">{stats.totalVerifications}</div>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold">Block Height</span>
          </div>
          <div className="text-xl font-mono text-cyan-400">
             {stats.blockNumber ? `#${stats.blockNumber}` : '-'}
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Zap className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold">Gas Price</span>
          </div>
          <div className="text-xl font-mono text-amber-400">
            {stats.gasPrice ? `${parseFloat(stats.gasPrice).toFixed(2)} Gwei` : '-'}
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] uppercase font-bold">Active Proofs</span>
            <span className="text-[10px] font-mono text-emerald-400">{stats.activeProofs}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
             {/* Use rateLimitStatus for visual load indication */}
            <div 
              className={`h-full transition-all duration-500 ${stats.rateLimitStatus > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${stats.rateLimitStatus}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
