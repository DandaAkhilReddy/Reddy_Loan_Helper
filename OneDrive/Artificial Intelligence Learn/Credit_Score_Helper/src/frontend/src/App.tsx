import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import PayoffPlan from './pages/PayoffPlan';
import Projection from './pages/Projection';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '◎' },
  { to: '/accounts', label: 'Accounts', icon: '≡' },
  { to: '/payoff', label: 'Payoff Plan', icon: '↑' },
  { to: '/projection', label: 'Projection', icon: '⟋' },
] as const;

function Sidebar() {
  const location = useLocation();
  return (
    <nav className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">◈</span>
        <span className="sidebar-logo-text">Credit Helper</span>
      </div>
      <ul className="nav-list" role="list">
        {NAV_ITEMS.map(({ to, label, icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={`nav-link ${isActive ? 'nav-link--active' : ''}`}
              >
                <span className="nav-icon" aria-hidden="true">{icon}</span>
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
      <div className="sidebar-footer">
        <div className="sidebar-footer-label">Mock Data Mode</div>
        <div className="sidebar-footer-sub">Connect API for live scores</div>
      </div>
    </nav>
  );
}

function Header() {
  const location = useLocation();
  const current = NAV_ITEMS.find(({ to }) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
  );
  return (
    <header className="topbar">
      <h1 className="topbar-title">Credit Score Helper</h1>
      {current && <span className="topbar-breadcrumb">{current.label}</span>}
    </header>
  );
}

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/payoff" element={<PayoffPlan />} />
            <Route path="/projection" element={<Projection />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
