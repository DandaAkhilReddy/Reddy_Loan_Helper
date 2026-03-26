export type ScoreRating = 'poor' | 'fair' | 'good' | 'very_good' | 'exceptional';

export interface CreditScore {
  bureau: 'Equifax' | 'TransUnion' | 'Experian';
  score: number;
  rating: ScoreRating;
  lastUpdated: string;
}

export type FactorSeverity = 'critical' | 'warning' | 'good';

export interface ScoreFactor {
  id: string;
  name: string;
  description: string;
  severity: FactorSeverity;
  impact: 'high' | 'medium' | 'low';
  currentValue: string;
  targetValue?: string;
}

export type AccountType =
  | 'credit_card'
  | 'auto_loan'
  | 'student_loan'
  | 'mortgage'
  | 'personal_loan'
  | 'collection'
  | 'charge_off'
  | 'other';

export type AccountStatus =
  | 'current'
  | 'delinquent'
  | 'charge_off'
  | 'collection'
  | 'closed'
  | 'needs_attention';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  utilizationPct?: number;
  status: AccountStatus;
  onTimePct: number;
  openDate: string;
  lastActivity: string;
  monthlyPayment?: number;
  isDerogatory: boolean;
}

export interface PayoffPriority {
  rank: number;
  accountId: string;
  accountName: string;
  action: string;
  rationale: string;
  estimatedCost: number;
  timelineMonths: number;
  scoreImpactLow: number;
  scoreImpactHigh: number;
  isPrimary: boolean;
}

export interface PayoffPlan {
  totalCost: number;
  totalTimelineMonths: number;
  monthlyBudgetRequired: number;
  projectedScoreAtEnd: number;
  priorities: PayoffPriority[];
}

export interface ScoreProjectionPoint {
  month: number;
  label: string;
  scoreLow: number;
  scoreHigh: number;
  milestone?: string;
}

export interface ScoreProjection {
  currentScoreLow: number;
  currentScoreHigh: number;
  targetScore: number;
  dataPoints: ScoreProjectionPoint[];
}

export interface CreditSummary {
  scores: CreditScore[];
  totalDebt: number;
  totalCreditLimit: number;
  overallUtilizationPct: number;
  monthlyObligations: number;
  estimatedMonthsTo700: number;
  accounts: Account[];
  factors: ScoreFactor[];
  payoffPlan: PayoffPlan;
  projection: ScoreProjection;
}
