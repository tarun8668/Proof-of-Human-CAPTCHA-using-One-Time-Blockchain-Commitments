
export interface MovementPoint {
  x: number;
  y: number;
  t: number;
  type?: 'move' | 'click' | 'drag';
}

export type CaptchaMode = 'trace' | 'sequence' | 'math' | 'slider';
export type CaptchaDifficulty = 'easy' | 'medium' | 'hard';

export interface VerificationResult {
  isHuman: boolean;
  confidence: number;
  reasoning: string;
  signature?: string;
}

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  commitmentHash: string;
  prevHash: string;
  status: 'PENDING' | 'COMMITTED' | 'EXPIRED' | 'BURNED';
  txHash?: string;
  metadata: {
    action: string;
    sessionId: string;
    expiresAt: number;
  };
}

export interface AppStats {
  totalVerifications: number;
  totalRejections: number;
  activeProofs: number;
  rateLimitStatus: number; // 0 to 100
  blockNumber?: number;
  gasPrice?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  COMMITTING = 'COMMITTING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  COOLDOWN = 'COOLDOWN',
  CONNECTING_WALLET = 'CONNECTING_WALLET'
}

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
}
