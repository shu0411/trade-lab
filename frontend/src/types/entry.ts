export type EntryType = 'entry' | 'pass';
export type Pattern = '押し目' | 'ブレイクアウト' | 'その他';
export type Status = 'open' | 'closed';
export type Result = 'success' | 'failure' | 'breakeven';

export const PATTERNS: Pattern[] = ['押し目', 'ブレイクアウト', 'その他'];

export const REASONS = [
  '25日線反発',
  '75日線反発',
  '高値更新',
  '出来高増加',
  'ゴールデンクロス',
  '安値切り上げ',
  '移動平均線上向き',
] as const;

export interface Entry {
  id: string;
  type: EntryType;
  date: string;
  ticker: string;
  tickerName: string;
  pattern: Pattern;
  entryPrice: number | null;
  targetPct: number | null;
  stopPct: number | null;
  targetPrice: number | null;
  stopPrice: number | null;
  holdDays: number | null;
  reasons: string[];
  reasonNote: string;
  chartImageKey: string | null;
  status: Status;
  exitPrice: number | null;
  maxGainPct: number | null;
  maxLossPct: number | null;
  result: Result | null;
  resultNote: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface EntryCreateForm {
  type: EntryType;
  date: string;
  ticker: string;
  tickerName: string;
  pattern: Pattern;
  entryPrice: string;
  targetPct: string;
  stopPct: string;
  holdDays: string;
  reasons: string[];
  reasonNote: string;
}

export interface ResultUpdateForm {
  exitPrice: string;
  maxGainPct: string;
  maxLossPct: string;
  result: Result;
  resultNote: string;
}

export interface PatternStat {
  pattern: string;
  total: number;
  closed: number;
  success: number;
  successRate: number | null;
}

export interface ReasonStat {
  reason: string;
  total: number;
  closed: number;
  success: number;
  successRate: number | null;
}

export interface Summary {
  total: number;
  open: number;
  closed: number;
  successRate: number | null;
  passCount: number;
}
