import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipContentProps } from 'recharts/types/component/Tooltip';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import { mockCreditSummary } from '../data/mockData';
import type { ScoreProjectionPoint } from '../types';

const { projection } = mockCreditSummary;

interface ChartPoint extends ScoreProjectionPoint {
  range: [number, number];
}

const chartData: ChartPoint[] = projection.dataPoints.map((d) => ({
  ...d,
  range: [d.scoreLow, d.scoreHigh],
}));

// Build a lookup so the tooltip can find milestones by label
const milestoneByLabel = new Map<string, string>(
  projection.dataPoints
    .filter((d) => d.milestone !== undefined)
    .map((d) => [d.label, d.milestone as string])
);

function CustomTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const labelStr = label !== undefined ? String(label) : '';
  // payload[0] = scoreHigh, payload[1] = scoreLow (order of Area declarations)
  const rawHigh = payload[0]?.value;
  const rawLow = payload[1]?.value;
  const high = typeof rawHigh === 'number' ? rawHigh : undefined;
  const low = typeof rawLow === 'number' ? rawLow : undefined;
  const milestone = milestoneByLabel.get(labelStr);

  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{labelStr}</div>
      {low !== undefined && high !== undefined && (
        <div className="tooltip-score">
          {low}–{high} pts
        </div>
      )}
      {milestone !== undefined && (
        <div className="tooltip-milestone">{milestone}</div>
      )}
    </div>
  );
}

export default function Projection() {
  const { targetScore, currentScoreLow, currentScoreHigh } = projection;

  const finalPoint = projection.dataPoints[projection.dataPoints.length - 1];
  const finalLow = finalPoint?.scoreLow ?? currentScoreLow;
  const finalHigh = finalPoint?.scoreHigh ?? currentScoreHigh;

  return (
    <div className="page">
      <h1 className="page-title">Score Projection</h1>
      <p className="page-subtitle">
        Projected score range over 18 months if you follow the payoff plan. The shaded band shows
        best-case to worst-case estimates.
      </p>

      {/* KPI strip */}
      <div className="projection-kpi">
        <div className="proj-kpi-card">
          <div className="proj-kpi-label">Starting Score</div>
          <div className="proj-kpi-value proj-kpi-value--red">
            {currentScoreLow}–{currentScoreHigh}
          </div>
        </div>
        <div className="proj-kpi-card">
          <div className="proj-kpi-label">Target</div>
          <div className="proj-kpi-value proj-kpi-value--blue">{targetScore}</div>
        </div>
        <div className="proj-kpi-card">
          <div className="proj-kpi-label">Month 18 Estimate</div>
          <div className="proj-kpi-value proj-kpi-value--green">
            {finalLow}–{finalHigh}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#63b3ed" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#63b3ed" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4299e1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4299e1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#718096', fontSize: 12 }}
              axisLine={{ stroke: '#2d3748' }}
              tickLine={false}
            />
            <YAxis
              domain={[450, 750]}
              tick={{ fill: '#718096', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={CustomTooltip} />
            <ReferenceLine
              y={targetScore}
              stroke="#68d391"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Target: ${targetScore}`,
                fill: '#68d391',
                fontSize: 12,
                position: 'insideTopRight',
              }}
            />
            {/* High estimate area */}
            <Area
              type="monotone"
              dataKey="scoreHigh"
              stroke="#63b3ed"
              strokeWidth={2}
              fill="url(#highGrad)"
              dot={{ r: 4, fill: '#63b3ed', stroke: '#1a1a2e', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#63b3ed', stroke: '#1a1a2e', strokeWidth: 2 }}
              name="High"
            />
            {/* Low estimate area — sits below, giving a band effect */}
            <Area
              type="monotone"
              dataKey="scoreLow"
              stroke="#4299e1"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              fill="url(#lowGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#4299e1' }}
              name="Low"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone list */}
      <section className="section">
        <h2 className="section-title">Milestones</h2>
        <div className="milestone-list">
          {projection.dataPoints
            .filter((d) => d.milestone !== undefined)
            .map((d) => (
              <div key={d.month} className="milestone-row">
                <div className="milestone-month">{d.label}</div>
                <div className="milestone-desc">{d.milestone}</div>
                <div className="milestone-range">
                  {d.scoreLow}–{d.scoreHigh} pts
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
