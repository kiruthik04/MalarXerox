import React, { useState, useEffect, useContext, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Printer, FileText, Smartphone, PenTool, Menu, X, LayoutDashboard,
  TrendingUp, PhoneCall, MessageCircle, Mail, FileSignature, Copy,
  Users, PlusCircle, Zap, Award, ShieldCheck, Receipt, Package,
  History, Cpu, LogOut, ChevronRight, Wallet, UserX, Camera,
  BookOpen, CreditCard, BookMarked, ScanLine, Bell
} from 'lucide-react';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import BillHistoryPage from './pages/BillHistoryPage';
import AddCatalogPage from './pages/AddCatalogPage';
import ExpensesPage from './pages/ExpensesPage';
import DebtsPage from './pages/DebtsPage';
import PendingOrdersPage from './pages/PendingOrdersPage';
import './index.css';

// Shop Photos
import shopFront from './assets/shop/shop-front.jpg';
import signboard from './assets/shop/signboard.jpg';
import invStaplers from './assets/shop/inventory-staplers.jpg';
import invCalculators from './assets/shop/inventory-calculators.jpg';
import invNotebooks from './assets/shop/inventory-notebooks.jpg';


const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const AuthContext = createContext();

const getIcon = (name, size = 18, color = "currentColor") => {
  const icons = {
    FileSignature: <FileSignature size={size} color={color} />,
    Printer: <Printer size={size} color={color} />,
    Copy: <Copy size={size} color={color} />,
    Smartphone: <Smartphone size={size} color={color} />,
    Users: <Users size={size} color={color} />,
    ShieldCheck: <ShieldCheck size={size} color={color} />,
    FileText: <FileText size={size} color={color} />,
  };
  return icons[name] || <FileText size={size} color={color} />;
};

/* Helper: group services array by their category field */
const groupByCategory = (services) => {
  const ORDER = ['Printouts', 'Government E-Services', 'AADHAR Update', 'Ration Card Update', 'Police Services', 'FASTag'];
  const map = {};
  services.forEach(s => {
    const cat = s.category || 'Other';
    if (!map[cat]) map[cat] = [];
    map[cat].push(s);
  });
  // Return in fixed order, then any extras
  const ordered = [];
  ORDER.forEach(c => { if (map[c]) ordered.push({ category: c, items: map[c] }); });
  Object.keys(map).filter(c => !ORDER.includes(c)).forEach(c => ordered.push({ category: c, items: map[c] }));
  return ordered;
};

const CATEGORY_META = {
  'Printouts':              { accent: '#16a34a', bg: '#f0fdf4', Icon: Printer },
  'Government E-Services':  { accent: '#1d4ed8', bg: '#eff6ff', Icon: FileSignature },
  'AADHAR Update':          { accent: '#7c3aed', bg: '#f5f3ff', Icon: CreditCard },
  'Ration Card Update':     { accent: '#b45309', bg: '#fffbeb', Icon: BookOpen },
  'Police Services':        { accent: '#dc2626', bg: '#fff1f2', Icon: ShieldCheck },
  'FASTag':                 { accent: '#0369a1', bg: '#f0f9ff', Icon: CreditCard },
};

/* ─── Public Navbar ─── */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  // Hide navbar on dashboard routes
  if (location.pathname.startsWith('/dashboard')) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Printer size={28} color="var(--primary-dark)" />
        Malar Xerox
      </Link>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setIsOpen(false)}>Storefront</Link>
        <Link to="/services" className={location.pathname === '/services' ? 'active' : ''} onClick={() => setIsOpen(false)}>Services</Link>
      </div>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  );
};

/* ─── Admin Sidebar Layout ─── */
const AdminLayout = ({ children, pageTitle }) => {
  const { auth, setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (auth.token) {
      fetch(`${API_BASE}/api/dashboard/data`, { headers: { Authorization: `Bearer ${auth.token}` } })
        .then(r => r.json())
        .then(d => setStats(d.stats || {}))
        .catch(() => {});
    }
  }, [auth.token, location.pathname]);

  const logout = () => { setAuth({ token: null, username: null }); navigate('/'); };

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={18} />, exact: true },
    { to: '/dashboard/billing', label: 'New Bill', icon: <Receipt size={18} /> },
    { to: '/dashboard/inventory', label: 'Inventory', icon: <Package size={18} /> },
    { to: '/dashboard/history', label: 'Bill History', icon: <History size={18} /> },
    { to: '/dashboard/catalog', label: 'Add Services & Products', icon: <Cpu size={18} /> },
    { to: '/dashboard/expenses', label: 'Expenses', icon: <Wallet size={18} /> },
    { to: '/dashboard/debts', label: 'Customer Debts', icon: <UserX size={18} /> },
    { to: '/dashboard/reminders', label: 'Reminders', icon: <Bell size={18} /> },
  ];

  const isActive = (to, exact) => exact ? location.pathname === to : location.pathname === to;

  return (
    <div className="admin-layout">
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="sidebar-brand">
          <Printer size={22} /> Malar Xerox
        </Link>
        <div className="sidebar-section-label">Main Menu</div>
        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li key={item.to}>
              <Link 
                to={item.to} 
                className={isActive(item.to, item.exact) ? 'active' : ''}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Logged in as <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{auth.username}</strong>
          </div>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="sidebar-toggle-btn" 
              style={{ display: 'none' }} 
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2>{pageTitle}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <div 
                style={{ cursor: 'pointer', color: showNotifications ? 'var(--primary-dark)' : 'var(--text-muted)', transition: 'color 0.2s' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {( (stats.yesterdayDebt && stats.yesterdayDebt !== '₹0.00') || (stats.pendingOrders > 0) ) && (
                  <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></div>
                )}
              </div>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowNotifications(false)}></div>
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.75rem', width: '320px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e7f9ee', zIndex: 999, overflow: 'hidden', animation: 'slideUpFade 0.3s ease-out' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Notifications</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                        { ( (stats.yesterdayDebt && stats.yesterdayDebt !== '₹0.00' ? 1 : 0) + (stats.pendingOrders > 0 ? 1 : 0) ) } New
                      </span>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {stats.yesterdayDebt && stats.yesterdayDebt !== '₹0.00' && (
                        <div 
                          style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: '#fff5f5', borderBottom: '1px solid #fee2e2', cursor: 'pointer' }}
                          onClick={() => { navigate('/dashboard/debts'); setShowNotifications(false); }}
                        >
                          <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}>
                            <UserX size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.2rem' }}>Yesterday's Debt Reminder</div>
                            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Total pending: {stats.yesterdayDebt}</div>
                            <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '0.4rem', textDecoration: 'underline' }}>View customers →</div>
                          </div>
                        </div>
                      )}

                      {stats.pendingOrders > 0 && (
                        <div 
                          style={{ padding: '1rem', display: 'flex', gap: '0.75rem', background: '#fffbeb', borderBottom: '1px solid #fef3c7', cursor: 'pointer' }}
                          onClick={() => { navigate('/dashboard/reminders'); setShowNotifications(false); }}
                        >
                          <div style={{ background: '#fef3c7', color: '#d97706', padding: '0.5rem', borderRadius: '8px', height: 'fit-content' }}>
                            <Clock size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', marginBottom: '0.2rem' }}>Pending Orders</div>
                            <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>{stats.pendingOrders} tasks to complete</div>
                            <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '0.4rem', textDecoration: 'underline' }}>View reminders →</div>
                          </div>
                        </div>
                      )}

                      {(!stats.yesterdayDebt || stats.yesterdayDebt === '₹0.00') && stats.pendingOrders === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                          <Bell size={24} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.85rem', margin: 0 }}>All caught up!</p>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '0.75rem', textAlign: 'center', background: '#f9fffe', borderTop: '1px solid #f0fdf4' }}>
                      <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>Close Menu</button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Printer size={16} color="var(--primary-dark)" />
                Malar Xerox & Studio
            </div>
          </div>
        </div>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
};

/* ─── Overview Page ─── */
const OverviewPage = () => {
  const { auth } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [serviceSales, setServiceSales] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.token) { navigate('/login'); return; }
    fetch(`${API_BASE}/api/dashboard/data`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { 
        setStats(d.stats || {}); 
        setServiceSales(d.serviceSales || []); 
        setRecentBills(d.recentBills || []);
      })
      .catch(() => {});
  }, [auth.token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AdminLayout pageTitle="Operations Overview">
      <div className="page-header">
        <div>
          <h2>{getGreeting()}, {auth.username || 'Admin'} 👋</h2>
          <p>Here's what's happening at Malar Xerox today.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {stats.yesterdayDebt && stats.yesterdayDebt !== '₹0.00' && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', animation: 'pulse 2s infinite' }}>
                    <div style={{ color: '#ef4444' }}><Bell size={18} /></div>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b' }}>DEBT REMINDER</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>{stats.yesterdayDebt} from yesterday</div>
                    </div>
                    <Link to="/dashboard/debts" style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, textDecoration: 'underline' }}>View</Link>
                </div>
            )}
            <Link to="/dashboard/billing" className="btn-success" style={{ textDecoration: 'none' }}>
                <PlusCircle size={16} /> New Bill
            </Link>
        </div>
      </div>

      <div className="overview-stats">
        {[
          { label: 'Daily Income', value: stats.dailyIncome || '₹0.00', color: 'var(--primary-dark)' },
          { label: 'Daily Expenses', value: stats.dailyExpenses || '₹0.00', color: '#ef4444' },
          { label: 'Net Profit', value: stats.netProfit || '₹0.00', color: '#16a34a' },
          { label: 'Pending Orders', value: stats.pendingOrders || 0, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-title">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="responsive-grid" style={{ marginTop: '1rem' }}>
        <div>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Today's Service Performance</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Service</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                {serviceSales.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No sales recorded</td></tr>
                ) : serviceSales.map(s => (
                  <tr key={s.serviceName}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ background: '#f0fdf4', padding: '0.3rem', borderRadius: '6px', color: 'var(--primary-dark)' }}>{getIcon(s.iconName, 16)}</div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.serviceName}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-green" style={{ fontSize: '0.75rem' }}>{s.salesToday}</span></td>
                    <td style={{ fontSize: '0.9rem' }}>₹{s.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Recent Bills</h3>
            <Link to="/dashboard/history" style={{ fontSize: '0.8rem', color: 'var(--primary-dark)', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Customer</th><th>Total</th><th>Date</th></tr></thead>
              <tbody>
                {recentBills.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No recent bills</td></tr>
                ) : recentBills.map(b => (
                  <tr key={b.id || `bill-${Math.random()}`}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.customerName || 'Walk-in'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.phone || 'No phone'}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.9rem' }}>₹{b.grandTotal}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

/* ─── Login Page ─── */
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) { setAuth({ token: data.token, username: data.username }); navigate('/dashboard'); }
      else setError(data.error || 'Invalid credentials');
    } catch { setError('Cannot connect to server. Ensure backend is running.'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '1rem' }}>
        <div className="admin-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Printer size={40} color="var(--primary-dark)" />
            <h2 style={{ marginTop: '0.75rem', fontSize: '1.8rem' }}>Admin Login</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Malar Xerox & Studio</p>
          </div>
          {error && <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Username</label>
              <input className="form-input" type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Password</label>
              <input className="form-input" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-success" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── Storefront ─── */
const Storefront = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);

  // Static marquee — only the category headings
  const MARQUEE_LABELS = [
    'PRINTOUTS', 'GOVERNMENT E-SERVICES', 'AADHAR UPDATE', 'RATION CARD UPDATE', 'POLICE SERVICES', 'FASTAG',
  ];
  // Repeat 4× so the scroll never looks empty
  const marquee = [...MARQUEE_LABELS, ...MARQUEE_LABELS, ...MARQUEE_LABELS, ...MARQUEE_LABELS];

  useEffect(() => {
    fetch(`${API_BASE}/api/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <section className="hero" id="home">
        <div className="mesh-gradient"></div>
        <div className="hero-bg-overlay" style={{ position: 'absolute', inset: 0, backgroundImage: `url(${shopFront})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.04, filter: 'grayscale(100%) blur(2px)', zIndex: 0 }}></div>
        
        {/* Floating background elements */}
        <div className="floating-icon" style={{ top: '15%', left: '10%', animationDelay: '0s' }}><Printer size={120} /></div>
        <div className="floating-icon" style={{ top: '60%', left: '5%', animationDelay: '2s' }}><Camera size={100} /></div>
        <div className="floating-icon" style={{ top: '20%', right: '10%', animationDelay: '1s' }}><FileText size={110} /></div>
        <div className="floating-icon" style={{ bottom: '15%', right: '15%', animationDelay: '3s' }}><Smartphone size={90} /></div>

        <div className="hero-content" style={{ maxWidth: '900px' }}>
          <div className="badge" style={{ display: 'inline-block', marginBottom: '1.5rem', background: 'var(--primary-dark)', color: 'white' }}>TRUSTED SINCE 1997</div>
          <h1 className="title">
            Malar <br />
            <span className="gradient-text">Xerox & Studio</span>
          </h1>
          <p className="subtitle" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 2.5rem', color: '#4b5563' }}>
            Premium Photocopying, Studio Photography, and comprehensive Government E-Services. 
            Experience the Malar standard of excellence.
          </p>
          <div className="responsive-grid-2" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <button className="btn-primary" onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>View Our Services</button>
            <button className="btn-outline" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>Contact Us</button>
          </div>
        </div>
      </section>

      <div className="marquee-container">
        <div className="marquee-content">
          {marquee.map((t, i) => i % 2 === 0
            ? <span key={i}>{t}</span>
            : <span key={i} className="star">★</span>
          )}
        </div>
      </div>

      <section className="features-section" style={{ padding: '4rem 2rem', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Why Choose Malar Xerox?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            {[{ Icon: Zap, title: 'Lightning Fast', desc: 'We value your time with rapid turnaround on all prints and services.' },
              { Icon: Award, title: 'Premium Quality', desc: 'Top-tier paper and high-fidelity inks for flawless professional output.' },
              { Icon: ShieldCheck, title: 'Trusted Assistance', desc: 'Expert help with all Govt E-Services to ensure guaranteed success.' }]
              .map(({ Icon, title, desc }) => (
                <div key={title}>
                  <Icon size={48} color="var(--primary-dark)" style={{ marginBottom: '1rem' }} />
                  <h3>{title}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="shop-gallery" style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Visit Our Store</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Experience our premium services and explore our extensive collection of stationery and professional equipment at Sathyamangalam.
            </p>
          </div>
          
          <div className="gallery-grid">
            <div className="gallery-item featured">
              <img src={shopFront} alt="Malar Xerox Front View" />
              <div className="gallery-overlay">
                <h4>Main Entrance</h4>
                <p>Malar Xerox & Studio - Your trusted partner since 1997.</p>
              </div>
            </div>
            <div className="gallery-item">
              <img src={invNotebooks} alt="Notebooks and Stationery" />
              <div className="gallery-overlay">
                <h4>Stationery Collection</h4>
                <p>Wide variety of notebooks, pens, and school essentials.</p>
              </div>
            </div>
            <div className="gallery-item">
              <img src={signboard} alt="Malar Xerox Signboard" />
              <div className="gallery-overlay">
                <h4>Our Services</h4>
                <p>Color Xerox, Printouts, Lamination & more.</p>
              </div>
            </div>
            <div className="gallery-item">
              <img src={invStaplers} alt="Stationery Inventory" />
              <div className="gallery-overlay">
                <h4>Office Essentials</h4>
                <p>High-quality office supplies for your business needs.</p>
              </div>
            </div>
            <div className="gallery-item">
              <img src={invCalculators} alt="Calculators and Electronics" />
              <div className="gallery-overlay">
                <h4>Professional Tools</h4>
                <p>Quality calculators and professional studio equipment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="services-grid-section" id="services" style={{ padding: '5rem 2rem', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Our Professional Services</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>We offer a wide range of digital, printing and government solutions tailored to your needs.</p>
          </div>

          {groupByCategory(services).map(({ category, items }) => {
            const meta = CATEGORY_META[category] || { accent: 'var(--primary-dark)', bg: '#f0fdf4', Icon: FileText };
            const { accent, bg, Icon: CatIcon } = meta;
            return (
              <div key={category} style={{ marginBottom: '3.5rem' }}>
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${accent}22` }}>
                  <div style={{ background: bg, border: `1.5px solid ${accent}33`, padding: '0.5rem', borderRadius: '10px', color: accent, display: 'flex' }}>
                    <CatIcon size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: accent, margin: 0 }}>{category}</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{items.length} service{items.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Services under this category */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {items.map((s, idx) => (
                    <div key={s.id || `sf-${category}-${idx}`}
                      className="glass-card service-item"
                      style={{ textAlign: 'center', padding: '1.25rem 1rem', cursor: 'pointer', borderTop: `3px solid ${accent}` }}
                      onClick={() => setSelectedService(s)}
                    >
                      <div style={{ background: bg, padding: '0.75rem', borderRadius: '12px', display: 'inline-flex', color: accent, marginBottom: '0.75rem' }}>
                        {getIcon(s.iconName, 22, accent)}
                      </div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', margin: 0, lineHeight: 1.4 }}>{s.serviceName}</p>
                      {s.requirements && (
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem', lineHeight: 1.3 }}>Docs required</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="footer" id="contact">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Contact Us</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Sathy Rd, North Rangasamuthram, Sathyamangalam, Tamil Nadu 638402</p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ href: 'tel:9865325212', Icon: PhoneCall, color: 'var(--primary-dark)', label: 'Call Us', value: '9865325212' },
            { href: 'https://wa.me/919443933539', Icon: MessageCircle, color: '#25D366', label: 'WhatsApp', value: '94439 33539' },
            { href: 'mailto:malarsathy@gmail.com', Icon: Mail, color: '#EA4335', label: 'Email', value: 'malarsathy@gmail.com' }]
            .map(({ href, Icon, color, label, value }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="glass-card contact-link" style={{ textAlign: 'center', padding: '1.5rem', minWidth: '250px', textDecoration: 'none', color: 'inherit' }}>
                <Icon size={32} color={color} style={{ marginBottom: '1rem' }} />
                <h3>{label}</h3>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{value}</p>
              </a>
            ))}
        </div>
      </section>

      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedService.serviceName}</h3>
              <button className="close-btn" onClick={() => setSelectedService(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedService.category && (
                <div style={{ marginBottom: '1rem' }}>
                  <span className="badge" style={{ background: 'var(--primary-dark)', color: 'white', fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>{selectedService.category}</span>
                </div>
              )}
              {selectedService.requirements && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-dark)', fontSize: '0.9rem', color: '#334155' }}>
                  <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#0f172a' }}>Requirements:</strong>
                  {selectedService.requirements}
                </div>
              )}
              <p>For more info about {selectedService.serviceName}, please contact us via WhatsApp.</p>
              <a href={`https://wa.me/919443933539?text=Hi, I want to inquire about ${selectedService.serviceName}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Services Page ─── */
const ServicesPage = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error(err));
  }, []);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', background: '#fff' }}>
      <div className="mesh-gradient"></div>
      
      <div className="services-container" style={{ position: 'relative', zIndex: 1, paddingTop: '8rem', paddingBottom: '6rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Our Premium Services</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Top-tier solutions for all your printing and digital needs</p>
        </div>
        
        <div>
          {groupByCategory(services).map(({ category, items }) => {
            const meta = CATEGORY_META[category] || { accent: 'var(--primary-dark)', bg: '#f0fdf4', Icon: FileText };
            const { accent, bg, Icon: CatIcon } = meta;
            return (
              <div key={category} style={{ marginBottom: '4rem' }}>
                {/* Category Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `2px solid ${accent}33` }}>
                  <div style={{ background: bg, border: `2px solid ${accent}44`, padding: '0.75rem', borderRadius: '14px', color: accent, display: 'flex' }}>
                    <CatIcon size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: accent, margin: 0 }}>{category}</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{items.length} service{items.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>

                {/* Services under this category */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  {items.map((s, idx) => (
                    <div key={s.id || `sp-${category}-${idx}`}
                      className="glass-card service-item"
                      onClick={() => setSelectedService(s)}
                      style={{ textAlign: 'center', padding: '1.5rem 1.25rem', cursor: 'pointer', borderTop: `4px solid ${accent}`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                    >
                      <div style={{ background: bg, padding: '1rem', borderRadius: '16px', display: 'inline-flex', color: accent, marginBottom: '1rem' }}>
                        {getIcon(s.iconName, 28, accent)}
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.4 }}>{s.serviceName}</h3>
                      {s.requirements
                        ? <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4, marginBottom: '1rem' }}>Docs required — click to view</p>
                        : <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem' }}>Click to enquire</p>
                      }
                      <div style={{ fontSize: '0.82rem', color: accent, fontWeight: 600 }}>Learn More →</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedService.serviceName}</h3>
              <button className="close-btn" onClick={() => setSelectedService(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {selectedService.category && (
                <div style={{ marginBottom: '1rem' }}>
                  <span className="badge" style={{ background: 'var(--primary-dark)', color: 'white', fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>{selectedService.category}</span>
                </div>
              )}
              {selectedService.requirements && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-dark)', fontSize: '0.9rem', color: '#334155' }}>
                  <strong style={{ display: 'block', marginBottom: '0.4rem', color: '#0f172a' }}>Requirements:</strong>
                  {selectedService.requirements}
                </div>
              )}
              <p>For more info about {selectedService.serviceName}, please contact us via WhatsApp.</p>
              <a href={`https://wa.me/919443933539?text=Hi, I want to inquire about ${selectedService.serviceName}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}>
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Protected Dashboard Wrapper ─── */
const DashboardBilling = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="New Bill"><BillingPage token={auth.token} /></AdminLayout>; };
const DashboardInventory = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Inventory"><InventoryPage token={auth.token} /></AdminLayout>; };
const DashboardHistory = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Bill History"><BillHistoryPage token={auth.token} /></AdminLayout>; };
const DashboardCatalog = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Add Services & Products"><AddCatalogPage token={auth.token} /></AdminLayout>; };
const DashboardExpenses = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Expense Management"><ExpensesPage token={auth.token} /></AdminLayout>; };
const DashboardDebts = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Debt Management"><DebtsPage token={auth.token} /></AdminLayout>; };
const DashboardReminders = () => { const { auth } = useContext(AuthContext); return <AdminLayout pageTitle="Pending Orders & Reminders"><PendingOrdersPage token={auth.token} /></AdminLayout>; };

/* ─── App Root ─── */
function App() {
  // Read saved session from localStorage on startup
  const [auth, setAuthState] = useState(() => {
    try {
      const saved = localStorage.getItem('malar_auth');
      return saved ? JSON.parse(saved) : { token: null, username: null };
    } catch {
      return { token: null, username: null };
    }
  });

  // Wrap setAuth so every update is also saved to localStorage
  const setAuth = (value) => {
    if (value.token) {
      localStorage.setItem('malar_auth', JSON.stringify(value));
    } else {
      localStorage.removeItem('malar_auth');
    }
    setAuthState(value);
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/dashboard/billing" element={<DashboardBilling />} />
          <Route path="/dashboard/inventory" element={<DashboardInventory />} />
          <Route path="/dashboard/history" element={<DashboardHistory />} />
          <Route path="/dashboard/catalog" element={<DashboardCatalog />} />
          <Route path="/dashboard/expenses" element={<DashboardExpenses />} />
          <Route path="/dashboard/debts" element={<DashboardDebts />} />
          <Route path="/dashboard/reminders" element={<DashboardReminders />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
