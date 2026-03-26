import { mockCreditSummary } from '../data/mockData';
import type { PayoffPriority } from '../types';

const { payoffPlan } = mockCreditSummary;

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function ScoreImpactBar({ low, high }: { low: number; high: number }) {
  const maxImpact = 100;
  const lowPct = (low / maxImpact) * 100;
  const highPct = (high / maxImpact) * 100;
  return (
    <div className="impact-bar-wrapper">
      <div className="impact-bar-track">
        <div
          className="impact-bar-fill"
          style={{ marginLeft: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
      </div>
      <span className="impact-bar-label">
        +{low}–{high} pts
      </span>
    </div>
  );
}

function PriorityCard({ priority }: { priority: PayoffPriority }) {
  const isPrimary = priority.isPrimary;

  return (
    <div className={`priority-card ${isPrimary ? 'priority-card--primary' : ''}`}>
      {isPrimary && (
        <div className="pay-first-banner">
          PAY THIS FIRST
        </div>
      )}

      <div className="priority-card-inner">
        <div className="priority-rank">
          <span className={`rank-number ${isPrimary ? 'rank-number--primary' : ''}`}>
            {priority.rank}
          </span>
        </div>

        <div className="priority-content">
          <div className="priority-account-name">{priority.accountName}</div>

          <div className="priority-action">
            <span className="priority-action-label">Action</span>
            <p className="priority-action-text">{priority.action}</p>
          </div>

          <div className="priority-rationale">
            <span className="priority-rationale-label">Why</span>
            <p className="priority-rationale-text">{priority.rationale}</p>
          </div>

          <div className="priority-meta">
            <div className="priority-meta-item">
              <span className="meta-label">Cost</span>
              <span className="meta-value meta-value--cost">{formatCurrency(priority.estimatedCost)}</span>
            </div>
            <div className="priority-meta-item">
              <span className="meta-label">Timeline</span>
              <span className="meta-value">
                {priority.timelineMonths} month{priority.timelineMonths !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="priority-meta-item priority-meta-item--impact">
              <span className="meta-label">Score Impact</span>
              <ScoreImpactBar low={priority.scoreImpactLow} high={priority.scoreImpactHigh} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayoffPlan() {
  const { priorities, totalCost, totalTimelineMonths, monthlyBudgetRequired, projectedScoreAtEnd } = payoffPlan;

  return (
    <div className="page">
      <h1 className="page-title">Payoff Plan</h1>
      <p className="page-subtitle">
        Follow these steps in order. Each action is chosen to maximize score improvement per dollar spent.
      </p>

      <div className="priority-list">
        {priorities.map((p) => (
          <PriorityCard key={p.accountId} priority={p} />
        ))}
      </div>

      {/* Summary */}
      <section className="section payoff-summary">
        <h2 className="section-title">Plan Summary</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Investment</div>
            <div className="summary-value summary-value--red">{formatCurrency(totalCost)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Timeline</div>
            <div className="summary-value summary-value--blue">{totalTimelineMonths} months</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Monthly Budget Needed</div>
            <div className="summary-value summary-value--yellow">{formatCurrency(monthlyBudgetRequired)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Projected Score at End</div>
            <div className="summary-value summary-value--green">{projectedScoreAtEnd}</div>
          </div>
        </div>

        {/* Monthly Budget Breakdown */}
        <div className="budget-breakdown">
          <h3 className="budget-breakdown-title">Monthly Budget Breakdown</h3>
          <div className="budget-table">
            <div className="budget-row budget-row--header">
              <span>Category</span>
              <span>Amount</span>
              <span>Notes</span>
            </div>
            <div className="budget-row">
              <span>Debt Payoff / Settlement</span>
              <span className="budget-amount">{formatCurrency(Math.round(totalCost / totalTimelineMonths))}</span>
              <span className="budget-note">Averaged over {totalTimelineMonths} months</span>
            </div>
            <div className="budget-row">
              <span>Existing Monthly Payments</span>
              <span className="budget-amount">{formatCurrency(mockCreditSummary.monthlyObligations)}</span>
              <span className="budget-note">Student loan + minimum card payments</span>
            </div>
            <div className="budget-row budget-row--total">
              <span>Total Monthly Required</span>
              <span className="budget-amount">{formatCurrency(monthlyBudgetRequired)}</span>
              <span className="budget-note">First 6 months (highest pressure period)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
