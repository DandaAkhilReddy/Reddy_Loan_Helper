import { mockCreditSummary } from '../data/mockData';
import ScoreCard from '../components/ScoreCard';
import StatusBadge from '../components/StatusBadge';
import type { FactorSeverity } from '../types';

const { scores, totalDebt, monthlyObligations, estimatedMonthsTo700, factors } = mockCreditSummary;

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const SEVERITY_ORDER: Record<FactorSeverity, number> = { critical: 0, warning: 1, good: 2 };

const IMPACT_COLORS: Record<string, string> = {
  high: '#fc8181',
  medium: '#f6c90e',
  low: '#68d391',
};

const sortedFactors = [...factors].sort(
  (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
);

export default function Dashboard() {
  return (
    <div className="page">
      <h1 className="page-title">Credit Overview</h1>

      {/* Score Cards */}
      <div className="score-cards-row">
        {scores.map((s) => (
          <ScoreCard key={s.bureau} score={s} />
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Debt</div>
          <div className="stat-value stat-value--red">{formatCurrency(totalDebt)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Monthly Obligations</div>
          <div className="stat-value stat-value--yellow">{formatCurrency(monthlyObligations)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Est. Time to 700</div>
          <div className="stat-value stat-value--blue">{estimatedMonthsTo700} months</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overall Utilization</div>
          <div className="stat-value stat-value--red">{mockCreditSummary.overallUtilizationPct}%</div>
          <div className="stat-sublabel">Target: &lt;30%</div>
        </div>
      </div>

      {/* Score Factors */}
      <section className="section">
        <h2 className="section-title">Score Factors</h2>
        <div className="factors-list">
          {sortedFactors.map((f) => (
            <div
              key={f.id}
              className={`factor-row factor-row--${f.severity}`}
            >
              <div className="factor-left">
                <div className="factor-header">
                  <StatusBadge variant={f.severity} />
                  <span className="factor-name">{f.name}</span>
                  <span
                    className="factor-impact-dot"
                    style={{ color: IMPACT_COLORS[f.impact] }}
                    title={`${f.impact} impact`}
                  >
                    &#9679; {f.impact} impact
                  </span>
                </div>
                <p className="factor-desc">{f.description}</p>
              </div>
              <div className="factor-right">
                <div className="factor-value-row">
                  <span className="factor-value-label">Now</span>
                  <span className="factor-value factor-value--current">{f.currentValue}</span>
                </div>
                {f.targetValue !== undefined && (
                  <div className="factor-value-row">
                    <span className="factor-value-label">Target</span>
                    <span className="factor-value factor-value--target">{f.targetValue}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
