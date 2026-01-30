import React from 'react';
import { ShieldAlert, Trash2, User, Clock, Activity, AlertTriangle } from 'lucide-react';
import { BlockchainBlock } from '../types';

interface AdminDashboardProps {
  commitments: BlockchainBlock[];
  onBurn: (hash: string) => void;
  isLoading: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ commitments, onBurn, isLoading }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-red-900/30 overflow-hidden shadow-2xl shadow-red-900/10">
        <div className="p-6 border-b border-red-900/30 flex items-center justify-between bg-red-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Admin Command Center</h2>
              <p className="text-sm text-red-400">Restricted Access: Contract Owner Only</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
            <Activity className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">Live Monitoring</span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6 text-sm text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            You have override authority to burn ANY active commitment on the network.
          </div>

          <div className="space-y-4">
            {commitments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No active commitments found on network.
              </div>
            ) : (
              commitments.map((block) => (
                <div key={block.commitmentHash} className="group flex items-center justify-between p-4 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-red-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 font-mono text-xs">
                      {block.index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-cyan-400">{block.commitmentHash.substring(0, 12)}...</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ACTIVE
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {block.metadata.sessionId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(block.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onBurn(block.commitmentHash)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Force Burn</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
