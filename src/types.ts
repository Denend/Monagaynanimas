// Game States
export type GameState = 'menu' | 'playing' | 'gameover' | "countdown";

// Component Props
export interface GameUIProps {
  killCount: number;
  buffTimerValue: number;
  soundBtnLabelOn: boolean;
  onSoundToggle: () => void;
  onStopGame: () => void;
}

export interface TransactionsTableProps {
  transactions: Transaction[];
}

export interface LeaderboardPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ProvidersProps {
  children: React.ReactNode;
}

// Game Objects
export interface Transaction {
  id: number;
  type: string;
  link: string;
  date: number;
}

export interface LeaderboardRecord {
  id: string;
  score: number;
  tx: string;
}

export interface ImageCache {
  enemies: {
    [key: string]: HTMLImageElement;
  };
  fire: {
    [key: string]: HTMLImageElement;
  };
  player: {
    [key: string]: HTMLImageElement;
  };
}

// Game Stats
export interface GameStats {
  totalScore: number;
  killCount: number;
  fireMondalakKillKount: number;
  damageTaken: number;
  damageGiven: number;
  healsUsed: number;
  buffsTaken: number;
}

// Game Controls
export interface GameKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export interface GameMouse {
  x: number;
  y: number;
  shooting: boolean;
}

// Game Objects
export interface Explosion {
  x: number;
  y: number;
  frame: number;
  width: number;
  height: number;
}

// Hook Return Types
export interface UseTransactionsReturn {
  transactions: Transaction[];
  handleMint: (killCount: number) => void;
  handleTotalScore: (score: number, isDead: boolean) => void;
}

// Utils Types
export interface LeaderboardResponse {
  url?: string;
  detail?: string;
}

export interface UpdateTransactionCallback {
  (): Promise<LeaderboardResponse>;
}

// Error Types
export interface ApiError {
  detail: string;
} 