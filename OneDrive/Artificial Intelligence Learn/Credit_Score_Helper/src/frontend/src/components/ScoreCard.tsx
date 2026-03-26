import type { CreditScore } from '../types';
import styles from './ScoreCard.module.css';

interface ScoreCardProps {
  score: CreditScore;
}

function getScoreColor(score: number): string {
  if (score < 580) return '#e53e3e';
  if (score < 670) return '#d69e2e';
  if (score < 740) return '#38a169';
  return '#3182ce';
}

function getScoreLabel(score: number): string {
  if (score < 580) return 'Poor';
  if (score < 670) return 'Fair';
  if (score < 740) return 'Good';
  if (score < 800) return 'Very Good';
  return 'Exceptional';
}


export default function ScoreCard({ score }: ScoreCardProps) {
  const color = getScoreColor(score.score);
  const label = getScoreLabel(score.score);
  const pct = ((score.score - 300) / 550) * 100;

  return (
    <div className={styles.card}>
      <div className={styles.bureau}>{score.bureau}</div>
      <div className={styles.scoreWrapper}>
        <svg viewBox="0 0 180 100" className={styles.arc}>
          {/* Background arc */}
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke="#2d3748"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d={`M 10 90 A 80 80 0 0 1 ${
              10 + 160 * (pct / 100)
            } ${
              90 - Math.sin(Math.PI * (pct / 100)) * 80
            }`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
          />
        </svg>
        <div className={styles.scoreNumber} style={{ color }}>
          {score.score}
        </div>
      </div>
      <div className={styles.label} style={{ color }}>
        {label}
      </div>
      <div className={styles.range}>Range: 300–850</div>
      <div className={styles.updated}>Updated {score.lastUpdated}</div>
    </div>
  );
}
