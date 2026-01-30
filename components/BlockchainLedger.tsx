
import React from 'react';
import { BlockchainBlock } from '../types';
import { Shield, Clock, Hash, Link as LinkIcon, Trash2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface BlockchainLedgerProps {
  blocks: BlockchainBlock[];
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({ blocks }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" />
          On-Chain Commitments
        </h3>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 max-h-[400px] lg:max-h-none flex-grow custom-scrollbar">
        {blocks.length === 0 ? (
          <div className="text-center py-12 opacity-30 flex flex-col items-center gap-3">
            <LinkIcon className="w-10 h-10 text-slate-700" />
            <p className="text-[10px] font-mono uppercase tracking-widest">Waiting for Tx...</p>
          </div>
        ) : (
          blocks.map((block) => {
            const isBurned = block.status === 'BURNED';
            const isExpired = block.status === 'EXPIRED';
            const isActive = block.status === 'COMMITTED';

            return (
              <div 
                key={block.commitmentHash}
                className={`p-4 rounded-xl border transition-all duration-500 relative overflow-hidden ${
                  isActive ? 'bg-emerald-500/5 border-emerald-500/20' : 
                  isBurned ? 'bg-slate-900/40 border-slate-800 opacity-60' : 
                  'bg-rose-500/5 border-rose-500/20 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    #{block.index.toString().padStart(4, '0')}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {isActive && <span className="flex items-center gap-1 text-[9px] text-emerald-500 uppercase font-bold"><CheckCircle className="w-2.5 h-2.5"/> Active</span>}
                    {isBurned && <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-bold"><Trash2 className="w-2.5 h-2.5"/> Burned</span>}
                    {isExpired && <span className="flex items-center gap-1 text-[9px] text-rose-500 uppercase font-bold"><AlertTriangle className="w-2.5 h-2.5"/> Expired</span>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-slate-600 shrink-0" />
                    <code className="text-[10px] font-mono text-slate-400 truncate tracking-tighter">
                      {block.commitmentHash}
                    </code>
                  </div>
                  
                  {block.txHash && (
                    <div className="mt-2 pt-2 border-t border-slate-800/50 flex justify-between items-center">
                      <span className="text-[8px] text-slate-600 uppercase font-bold">Sepolia Tx</span>
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${block.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[8px] text-cyan-400 font-mono flex items-center gap-1 hover:underline"
                      >
                        {block.txHash.slice(0,12)}... <ExternalLink className="w-2 h-2" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BlockchainLedger;
