import type { AccountStatus, FactorSeverity } from '../types';
import styles from './StatusBadge.module.css';

type BadgeVariant = AccountStatus | FactorSeverity | 'good' | 'warning' | 'critical';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
}

const VARIANT_CONFIG: Record<string, { label: string; className: string }> = {
  current: { label: 'Current', className: styles.good },
  good: { label: 'Good', className: styles.good },
  needs_attention: { label: 'Attention', className: styles.warning },
  warning: { label: 'Warning', className: styles.warning },
  delinquent: { label: 'Delinquent', className: styles.critical },
  charge_off: { label: 'Charge-Off', className: styles.critical },
  collection: { label: 'Collection', className: styles.critical },
  critical: { label: 'Critical', className: styles.critical },
  closed: { label: 'Closed', className: styles.neutral },
};

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  const config = VARIANT_CONFIG[variant] ?? { label: variant, className: styles.neutral };
  return (
    <span className={`${styles.badge} ${config.className}`}>
      {label ?? config.label}
    </span>
  );
}
