import { mockCreditSummary } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import type { Account, AccountStatus } from '../types';

const { accounts } = mockCreditSummary;

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function formatAccountType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_SEVERITY: Record<AccountStatus, number> = {
  charge_off: 0,
  collection: 1,
  delinquent: 2,
  needs_attention: 3,
  current: 4,
  closed: 5,
};

const sortedAccounts = [...accounts].sort(
  (a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status]
);

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#fc8181' : pct >= 50 ? '#f6c90e' : '#68d391';
  return (
    <div className="util-bar-wrapper" title={`${pct}%`}>
      <div className="util-bar-track">
        <div
          className="util-bar-fill"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
      <span className="util-bar-label" style={{ color }}>{pct}%</span>
    </div>
  );
}

function AccountRow({ account }: { account: Account }) {
  const isDerog = account.isDerogatory || account.status === 'charge_off' || account.status === 'collection' || account.status === 'delinquent';
  return (
    <tr className={isDerog ? 'table-row table-row--derog' : 'table-row'}>
      <td className="td">
        <div className="account-name">{account.name}</div>
        <div className="account-type">{formatAccountType(account.type)}</div>
      </td>
      <td className="td td--num">{formatCurrency(account.balance)}</td>
      <td className="td td--num">
        {account.creditLimit !== undefined ? formatCurrency(account.creditLimit) : <span className="td--muted">—</span>}
      </td>
      <td className="td">
        {account.utilizationPct !== undefined ? (
          <UtilizationBar pct={account.utilizationPct} />
        ) : (
          <span className="td--muted">N/A</span>
        )}
      </td>
      <td className="td">
        <StatusBadge variant={account.status} />
      </td>
      <td className="td td--num">
        <span
          style={{
            color: account.onTimePct >= 95 ? '#68d391' : account.onTimePct >= 75 ? '#f6c90e' : '#fc8181',
            fontWeight: 700,
          }}
        >
          {account.onTimePct}%
        </span>
      </td>
      <td className="td td--num">{formatDate(account.openDate)}</td>
      <td className="td td--num">
        {account.monthlyPayment !== undefined && account.monthlyPayment > 0
          ? formatCurrency(account.monthlyPayment)
          : <span className="td--muted">—</span>}
      </td>
    </tr>
  );
}

export default function Accounts() {
  const derogCount = accounts.filter((a) => a.isDerogatory).length;

  return (
    <div className="page">
      <h1 className="page-title">Accounts</h1>

      {derogCount > 0 && (
        <div className="alert alert--critical">
          <strong>{derogCount} derogatory account{derogCount > 1 ? 's' : ''}</strong> are actively
          damaging your score. These appear highlighted in red below.
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className="th">Account</th>
              <th className="th th--num">Balance</th>
              <th className="th th--num">Limit</th>
              <th className="th">Utilization</th>
              <th className="th">Status</th>
              <th className="th th--num">On-Time %</th>
              <th className="th th--num">Opened</th>
              <th className="th th--num">Monthly Pmt</th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((a) => (
              <AccountRow key={a.id} account={a} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-legend">
        <span className="legend-item legend-item--derog">Derogatory / Needs Urgent Action</span>
        <span className="legend-item legend-item--normal">Current / Closed</span>
      </div>
    </div>
  );
}
