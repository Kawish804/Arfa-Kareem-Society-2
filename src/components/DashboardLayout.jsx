import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Wallet, Receipt, CalendarDays, FileCheck,
  Megaphone, Image, BarChart3, Settings, LogOut, GraduationCap, Menu, X, ChevronLeft, Shield, MessageCircle, Bell
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Members", url: "/dashboard/members", icon: Users },
  { title: "Funds", url: "/dashboard/funds", icon: Wallet },
  { title: "Expenses", url: "/dashboard/expenses", icon: Receipt },
  { title: "Events", url: "/dashboard/events", icon: CalendarDays },
  { title: "Requests", url: "/dashboard/requests", icon: FileCheck },
  { title: "Announcements", url: "/dashboard/announcements", icon: Megaphone },
  { title: "Gallery", url: "/dashboard/gallery", icon: Image },
  { title: "Visitors", url: "/dashboard/visitors", icon: Shield },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (url) => {
    if (url === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(url);
  };

  const SidebarContent = () => (
    <>
      <div className={styles.brand}>
        <div className={styles.brandIcon}><GraduationCap size={20} /></div>
        {sidebarOpen && (
          <div className={styles.brandText}>
            <span className={styles.brandName}>Arfa Kareem</span>
            <span className={styles.brandSub}>Society MS</span>
          </div>
        )}
      </div>
      <nav className={styles.nav}>
        {menuItems.map(item => (
          <Link key={item.title} to={item.url}
            className={`${styles.navItem} ${isActive(item.url) ? styles.navActive : ''}`}
            onClick={() => setMobileOpen(false)} title={item.title}>
            <item.icon size={18} />
            {sidebarOpen && <span>{item.title}</span>}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.expanded : styles.collapsed}`}>
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <aside className={styles.mobileSidebar} onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <button className={styles.collapseBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <ChevronLeft size={18} className={sidebarOpen ? '' : styles.rotated} />
            </button>
            <span className={styles.topbarTitle}>Admin Panel</span>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.chatBtn} onClick={() => navigate('/notifications')} title="Notifications"><Bell size={18} /><span className={styles.notifDot} /></button>
            <button className={styles.chatBtn} onClick={() => navigate('/chat')} title="Chat"><MessageCircle size={18} /></button>
            <div className={styles.userInfo}>
              <span className={styles.userName}>Admin User</span>
              <span className={styles.userEmail}>admin@society.edu</span>
            </div>
            <div className={styles.avatar}>AU</div>
            <button className={styles.logoutBtn} onClick={() => navigate('/login')}><LogOut size={18} /></button>
          </div>
        </header>
        <main className={styles.content}><Outlet /></main>
      </div>
    </div>
  );
};

export default DashboardLayout;