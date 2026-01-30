
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Shield, Brain, MousePointer2, Cpu, CheckCircle2, XCircle, RefreshCw, ChevronRight, Lock, Key, Clock, Trash2, Send, Ban, Wallet, ExternalLink, Activity, Grid, Calculator, Sliders, LogOut } from 'lucide-react';
import { AppState, MovementPoint, BlockchainBlock, VerificationResult, AppStats, WalletState, CaptchaMode, CaptchaDifficulty } from './types';
import { verifyHumanity } from './services/geminiService';
import { generateCommitment, sha256 } from './services/cryptoService';
import { blockchain } from './services/contractService';
import CaptchaCanvas from './components/CaptchaCanvas';
import BlockchainLedger from './components/BlockchainLedger';
import MonitoringDashboard from './components/MonitoringDashboard';
import AdminDashboard from './components/AdminDashboard';

const DEFAULT_PROOF_EXPIRATION_MS = 300000; // 5 minutes
const SESSION_ID = `sess_${Math.random().toString(36).substring(7)}`;

const App: React.FC = () => {
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([]);
  const [analysisResult, setAnalysisResult] = useState<VerificationResult | null>(null);
  const [currentBlock, setCurrentBlock] = useState<BlockchainBlock | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [wallet, setWallet] = useState<WalletState>({ address: null, chainId: null, isConnected: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCommitments, setAdminCommitments] = useState<BlockchainBlock[]>([]);
  const [stats, setStats] = useState<AppStats>({
    totalVerifications: 0,
    totalRejections: 0,
    activeProofs: 0,
    rateLimitStatus: 12
  });

  // Adaptive Logic
  const [captchaMode, setCaptchaMode] = useState<CaptchaMode>('trace');
  const [difficulty, setDifficulty] = useState<CaptchaDifficulty>('easy');
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [proofExpirationMs, setProofExpirationMs] = useState(DEFAULT_PROOF_EXPIRATION_MS);

  const timerRef = useRef<number | null>(null);

  const pickNextMode = () => {
    const modes: CaptchaMode[] = ['trace', 'sequence', 'math', 'slider'];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    setCaptchaMode(randomMode);
  };

  // Connection Handler
  const connectWallet = async () => {
    try {
      const result = await blockchain.connectWallet();
      setWallet({ address: result.address, chainId: result.chainId, isConnected: true });
      checkAdminStatus(result.address);
    } catch (e: any) {
      alert(e.message || "Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    setWallet({ address: null, chainId: null, isConnected: false });
    setIsAdmin(false);
    setBlocks([]);
    setAdminCommitments([]);
  };

  const checkAdminStatus = async (address: string | null) => {
    if (!address) return;
    const adminAddr = await blockchain.getAdmin();
    if (adminAddr && address.toLowerCase() === adminAddr.toLowerCase()) {
      setIsAdmin(true);
    }
  };

  // Restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await blockchain.checkConnection();
        if (result) {
          setWallet({ address: result.address, chainId: result.chainId, isConnected: true });
          checkAdminStatus(result.address);
        }
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    };
    restoreSession();
  }, []);

  // Fetch Real Stats & User Commitments
  useEffect(() => {
    if (!wallet.isConnected) return;

    const fetchStatsAndCommitments = async () => {
      try {
        // Global stats
        const realStats = await blockchain.getContractStats();
        if (realStats) {
          setStats(prev => ({
            ...prev,
            totalVerifications: realStats.totalVerifications,
            activeProofs: realStats.activeProofs,
            blockNumber: realStats.blockNumber,
            gasPrice: realStats.gasPrice,
          }));
        }

        // Admin Fetch
        if (isAdmin) {
            const allActive = await blockchain.getAllActiveCommitments();
            const mappedAdminBlocks: BlockchainBlock[] = allActive.map((c: any, index: number) => ({
                index: index + 1,
                timestamp: new Date(Number(c.timestamp) * 1000).toISOString(),
                commitmentHash: c.hash,
                prevHash: '...root...',
                status: 'COMMITTED',
                txHash: c.txHash,
                metadata: {
                    action: "USER_ACTION",
                    sessionId: c.owner.substring(0,6) + "...",
                    expiresAt: 0
                }
            }));
            setAdminCommitments(mappedAdminBlocks.reverse());
        }

        // User commitments (Normal View)
        if (wallet.address) {
            const userCommitments = await blockchain.getUserCommitments(wallet.address);
            
            // Transform to local blocks structure
            const restoredBlocks: BlockchainBlock[] = userCommitments.map((c: any, index: number) => ({
                index: index + 1, // simplified index
                timestamp: new Date(Number(c.timestamp) * 1000).toISOString(),
                commitmentHash: c.hash,
                prevHash: 'restored',
                status: 'COMMITTED',
                txHash: c.txHash,
                metadata: {
                    action: "RESTORED",
                    sessionId: "previous_session",
                    expiresAt: Date.now() + 3600000 // Just give them 1 hour visibility if restored
                }
            }));
            
            setBlocks(restoredBlocks.reverse());
        }

      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    };

    fetchStatsAndCommitments();
    const interval = setInterval(fetchStatsAndCommitments, 15000); // Update every 15s
    return () => clearInterval(interval);
  }, [wallet.isConnected, wallet.address, isAdmin]);

  // Simulation: Proof Expiration Logic
  useEffect(() => {
    if (status === AppState.VERIFIED && currentBlock) {
      const interval = window.setInterval(() => {
        const remaining = Math.max(0, currentBlock.metadata.expiresAt - Date.now());
        setTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          setStatus(AppState.IDLE);
          setBlocks(prev => prev.map(b => b.commitmentHash === currentBlock.commitmentHash ? { ...b, status: 'EXPIRED' } : b));
          setCurrentBlock(null);
          setStats(s => ({ ...s, activeProofs: Math.max(0, s.activeProofs - 1) }));
          clearInterval(interval);
        }
      }, 1000);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [status, currentBlock]);

  // Handle human verification
  const handleCaptchaComplete = useCallback(async (movements: MovementPoint[]) => {
    if (!wallet.isConnected) {
      alert("Please connect your wallet first to commit proofs to Sepolia.");
      return;
    }

    if (stats.rateLimitStatus > 90) {
      setStatus(AppState.COOLDOWN);
      setTimeout(() => setStatus(AppState.IDLE), 3000);
      return;
    }

    setStatus(AppState.ANALYZING);
    setStats(s => ({ ...s, rateLimitStatus: Math.min(100, s.rateLimitStatus + 15) }));
    
    const result = await verifyHumanity(movements, captchaMode, difficulty);
    setAnalysisResult(result);

    if (result.isHuman) {
      // Success Logic
      setStatus(AppState.COMMITTING);
      
      // Reset difficulty on success? Or keep it?
      // "make them progresively difficult if user fails certain times" -> implies success stops the punishment.
      setConsecutiveFailures(0);
      setDifficulty('easy'); 
      setProofExpirationMs(DEFAULT_PROOF_EXPIRATION_MS);

      const commitment = await generateCommitment(JSON.stringify(movements));

      try {
        // Sign real transaction on Sepolia
        const txHash = await blockchain.submitCommitment(commitment);
        
        const prevHash = blocks.length > 0 ? blocks[0].commitmentHash : await sha256('genesis');
        
        const newBlock: BlockchainBlock = {
          index: blocks.length + 1,
          timestamp: new Date().toISOString(),
          commitmentHash: commitment,
          prevHash: prevHash,
          status: 'COMMITTED',
          txHash: txHash,
          metadata: {
            action: "SECURE_ACTION_01",
            sessionId: SESSION_ID,
            expiresAt: Date.now() + proofExpirationMs
          }
        };

        setBlocks(prev => [newBlock, ...prev]);
        setCurrentBlock(newBlock);
        setStatus(AppState.VERIFIED);
        setStats(s => ({ 
          ...s, 
          totalVerifications: s.totalVerifications + 1,
          activeProofs: s.activeProofs + 1
        }));
        
        // Pick new mode for next time
        pickNextMode();

      } catch (err) {
        console.error(err);
        setStatus(AppState.FAILED);
        setAnalysisResult({ isHuman: true, confidence: 1, reasoning: "Blockchain transaction failed. Please ensure you are on Sepolia ETH network." });
      }
    } else {
      // Failure Logic
      setStatus(AppState.FAILED);
      setStats(s => ({ ...s, totalRejections: s.totalRejections + 1 }));
      
      const newFailures = consecutiveFailures + 1;
      setConsecutiveFailures(newFailures);

      // Progressive Difficulty
      if (newFailures >= 2) {
          if (difficulty === 'easy') setDifficulty('medium');
          else if (difficulty === 'medium') setDifficulty('hard');
          
          // Decrease TTL
          setProofExpirationMs(prev => Math.max(60000, prev - 60000)); // Reduce by 1 min, min 1 min
      }
      
      // Pick new mode to prevent bot learning
      pickNextMode();
    }
  }, [blocks, stats.rateLimitStatus, wallet.isConnected, captchaMode, difficulty, consecutiveFailures, proofExpirationMs]);

  // Burn logic - consuming the proof
  const handleBurnProof = async () => {
    if (!currentBlock) return;
    
    setStatus(AppState.COMMITTING);
    
    try {
      await blockchain.burnCommitment(currentBlock.commitmentHash);
      setBlocks(prev => prev.map(b => b.commitmentHash === currentBlock.commitmentHash ? { ...b, status: 'BURNED' } : b));
      setCurrentBlock(null);
      setStatus(AppState.IDLE);
      setStats(s => ({ ...s, activeProofs: Math.max(0, s.activeProofs - 1) }));
      alert("Operation Successful! Commitment burned on-chain.");
    } catch (e) {
      alert("Failed to burn commitment on-chain.");
      setStatus(AppState.VERIFIED);
    }
  };

  const handleAdminBurn = async (hash: string) => {
    if (!isAdmin) return;
    try {
      setStatus(AppState.COMMITTING);
      await blockchain.burnCommitment(hash);
      setAdminCommitments(prev => prev.filter(b => b.commitmentHash !== hash));
      // Also update local blocks if it matches
      setBlocks(prev => prev.map(b => b.commitmentHash === hash ? { ...b, status: 'BURNED' } : b));
      setStats(s => ({ ...s, activeProofs: Math.max(0, s.activeProofs - 1) }));
      setStatus(AppState.IDLE);
      alert("Admin Action: Commitment Burned Successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to burn commitment. Ensure you are the contract owner.");
      setStatus(AppState.IDLE);
    }
  };

  const reset = () => {
    setStatus(AppState.IDLE);
    setAnalysisResult(null);
    setCurrentBlock(null);
    pickNextMode();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(s => ({ ...s, rateLimitStatus: Math.max(0, s.rateLimitStatus - 2) }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 p-6 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Captcha3</h1>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Sepolia Testnet Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {wallet.isConnected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl group transition-all hover:border-emerald-500/50">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase font-bold">Connected Wallet</span>
                  <span className="text-xs text-emerald-400 font-mono">{wallet.address?.slice(0,6)}...{wallet.address?.slice(-4)}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              
              <button 
                onClick={disconnectWallet}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                title="Disconnect Wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-grow">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 p-8 space-y-8 order-2 lg:order-1">
          <section>
            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-4">Sepolia Environment</h4>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center gap-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Network Speed</span>
                  <span className="text-xs font-mono">~12.5s Block Time</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center gap-3">
                <Lock className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Action Binding</span>
                  <span className="text-xs font-mono">ECDSA Sig + Nonce</span>
                </div>
              </div>
            </div>
          </section>

          <BlockchainLedger blocks={blocks} />
        </aside>

        {/* Main Interface */}
        <main className="flex-grow p-6 lg:p-12 space-y-8 order-1 lg:order-2 max-w-7xl mx-auto w-full">
          
          <MonitoringDashboard stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Verification Widget */}
            <div className={`bg-slate-900/50 border rounded-3xl p-8 relative overflow-hidden transition-all duration-500 ${!wallet.isConnected ? 'border-slate-800 opacity-60' : 'border-slate-700/50'}`}>
              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <Key className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold">Proof Engine</h3>
                </div>

                {!wallet.isConnected ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <Wallet className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-400">Connect your Sepolia wallet to start generating human proofs.</p>
                  </div>
                ) : (
                  <div className="min-h-[300px] flex flex-col justify-center">
                    {status === AppState.IDLE && (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center px-2">
                           <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                             Mode: <span className="text-cyan-400">{captchaMode}</span>
                           </span>
                           <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                             Difficulty: <span className={`${difficulty === 'easy' ? 'text-emerald-400' : difficulty === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>{difficulty}</span>
                           </span>
                        </div>

                        {/* Manual Mode Selection (Dev Tools) */}
                        <div className="flex flex-col gap-2 pb-2">
                            <div className="flex gap-2 justify-center">
                                {(['trace', 'sequence', 'math', 'slider'] as CaptchaMode[]).map(m => (
                                    <button 
                                        key={m}
                                        onClick={() => setCaptchaMode(m)}
                                        className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${captchaMode === m ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-center">
                                {(['easy', 'medium', 'hard'] as CaptchaDifficulty[]).map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`px-2 py-1 text-[10px] uppercase font-bold rounded border ${difficulty === d ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'}`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <CaptchaCanvas 
                            onComplete={handleCaptchaComplete} 
                            disabled={false} 
                            mode={captchaMode}
                            difficulty={difficulty}
                        />
                        
                        <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                          {captchaMode === 'trace' && <Brain className="w-5 h-5 text-cyan-400 animate-pulse-subtle" />}
                          {captchaMode === 'sequence' && <Grid className="w-5 h-5 text-emerald-400 animate-pulse-subtle" />}
                          {captchaMode === 'math' && <Calculator className="w-5 h-5 text-amber-400 animate-pulse-subtle" />}
                          {captchaMode === 'slider' && <Sliders className="w-5 h-5 text-indigo-400 animate-pulse-subtle" />}
                          
                          <p className="text-xs text-slate-400 leading-tight">
                            {captchaMode === 'trace' && "Trace the line. Kinetics will be analyzed."}
                            {captchaMode === 'sequence' && "Click the numbers in ascending order."}
                            {captchaMode === 'math' && "Solve the math problem by clicking the correct answer."}
                            {captchaMode === 'slider' && "Drag the slider to the green target zone."}
                          </p>
                        </div>
                      </div>
                    )}

                    {(status === AppState.ANALYZING || status === AppState.COMMITTING) && (
                      <div className="text-center space-y-6 py-12">
                        <div className="relative">
                          <div className="w-16 h-16 border-2 border-slate-800 border-t-emerald-400 rounded-full animate-spin mx-auto" />
                          <Cpu className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto" />
                        </div>
                        <h4 className="font-bold text-slate-300 uppercase tracking-widest text-xs">
                          {status === AppState.ANALYZING ? 'Oracle Processing...' : 'Broadcasting Transaction...'}
                        </h4>
                        <p className="text-[10px] text-slate-500 italic">Please approve the transaction if prompted by MetaMask.</p>
                      </div>
                    )}

                    {status === AppState.VERIFIED && currentBlock && (
                      <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-emerald-400">Minted Proof</h4>
                              <p className="text-[10px] text-slate-500 uppercase tracking-tighter">One-Time Use Enabled</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono text-amber-400 font-bold">{Math.floor(timeLeft/60)}m {timeLeft%60}s</div>
                            <div className="text-[9px] text-slate-500 uppercase font-bold">TTL</div>
                          </div>
                        </div>

                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 font-mono text-[11px] space-y-3">
                          <div className="flex justify-between border-b border-slate-800/50 pb-2">
                            <span className="text-slate-500">TX_HASH</span>
                            <a 
                              href={`https://sepolia.etherscan.io/tx/${currentBlock.txHash}`} 
                              target="_blank" 
                              className="text-cyan-400 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                            >
                              {currentBlock.txHash?.slice(0,10)}... <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="space-y-1">
                            <span className="text-slate-500 block">COMMITMENT_HASH</span>
                            <span className="text-emerald-500 break-all leading-none">{currentBlock.commitmentHash}</span>
                          </div>
                        </div>

                        <button 
                          onClick={reset}
                          className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          New Challenge
                        </button>
                      </div>
                    )}

                    {status === AppState.FAILED && (
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
                          <XCircle className="w-8 h-8 text-rose-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-rose-500">Access Denied</h4>
                          <p className="text-xs text-slate-400 leading-relaxed px-8">{analysisResult?.reasoning}</p>
                        </div>
                        <button onClick={reset} className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Consumer Logic */}
            <div className={`bg-slate-900/50 border rounded-3xl p-8 flex flex-col justify-between transition-all duration-500 ${status === AppState.VERIFIED ? 'border-emerald-500/30 shadow-2xl shadow-emerald-500/5' : 'border-slate-800 opacity-50 grayscale'}`}>
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className={`p-2 rounded-lg border transition-colors ${status === AppState.VERIFIED ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
                    <Send className={`w-5 h-5 ${status === AppState.VERIFIED ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <h3 className="text-xl font-bold">Secure Gate</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    This module is the "Consumer". It checks if you have a valid commitment in your wallet session before letting you trigger the sensitive action.
                  </p>

                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      <span>Gate Status</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Commitment Found</span>
                      {status === AppState.VERIFIED ? (
                        <span className="text-emerald-400 font-bold">YES</span>
                      ) : (
                        <span className="text-rose-500 font-bold">NO</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Network Binding</span>
                      <span className="text-slate-200">Sepolia (11155111)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                disabled={status !== AppState.VERIFIED}
                onClick={handleBurnProof}
                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${status === AppState.VERIFIED ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
              >
                Execute Transaction & Burn Proof
              </button>
            </div>

          </div>

          {/* Admin Dashboard */}
          {isAdmin && (
            <AdminDashboard 
              commitments={adminCommitments}
              onBurn={handleAdminBurn}
              isLoading={status === AppState.COMMITTING}
            />
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
