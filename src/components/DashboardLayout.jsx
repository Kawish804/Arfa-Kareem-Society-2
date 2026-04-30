import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Wallet, Receipt, CalendarDays, Megaphone, 
  Settings as SettingsIcon, LogOut, Menu, X, 
  Image as ImageIcon, BarChart3, GraduationCap, 
  Bell, MessageSquare, FileCheck, ClipboardList, ScrollText,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; 
import styles from './DashboardLayout.module.css';

const menuItems = [
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard', exact: true },
  { path: '/dashboard/members', icon: Users, label: 'Members' },
  { path: '/dashboard/funds', icon: Wallet, label: 'Funds' },
  { path: '/dashboard/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/dashboard/events', icon: CalendarDays, label: 'Events' },
  { path: '/dashboard/all-requests', icon: FileCheck, label: 'All Requests' },
  { path: '/dashboard/requests', icon: FileCheck, label: 'Members Request' },
  { path: '/dashboard/participant-requests', icon: Users, label: 'Participant Request' },
  { path: '/dashboard/fund-requests', icon: ClipboardList, label: 'Fund Requests' },
  { path: '/dashboard/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/dashboard/gallery', icon: ImageIcon, label: 'Gallery' },
  { path: '/dashboard/participants', icon: Users, label: 'Participants' },
  { path: '/dashboard/studentmanagement', icon: GraduationCap, label: 'Student Management' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { path: '/dashboard/activity-log', icon: ScrollText, label: 'Activity Logs' },
  { path: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
];

const DashboardLayout = () => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings(); 
  const { user, logout } = useAuth(); 

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Determine current page title for the breadcrumb
  const currentRoute = menuItems.find(item => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  });
  const pageTitle = currentRoute ? currentRoute.label : 'President Panel';

  const getInitials = (name) => {
    if (!name) return 'PR'; 
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const userInitials = getInitials(user?.fullName);

  const handleLogout = () => {
    logout(); 
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      <div className={styles.sidebarHeader}>
        <div className={styles.logoWrap}>
          <div className={styles.brandIcon}>
            <GraduationCap size={22} />
          </div>
          {(!isDesktopCollapsed || isMobileOpen) && (
            <div className={styles.brandText}>
              <h2 className={styles.brandName}>{settings?.societyName || 'Arfa Kareem Society'}</h2>
              <p className={styles.brandSub}>Management System</p>
            </div>
          )}
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navGroupTitle}>
          {(!isDesktopCollapsed || isMobileOpen) ? 'MAIN MENU' : '•••'}
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            title={isDesktopCollapsed && !isMobileOpen ? item.label : ''}
          >
            <item.icon size={20} className={styles.navIcon} />
            {(!isDesktopCollapsed || isMobileOpen) && <span className={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </>
  );

  return (
    <div className={styles.layout}>
      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        ${styles.sidebar} 
        ${isDesktopCollapsed ? styles.collapsed : styles.expanded}
        ${isMobileOpen ? styles.mobileOpen : ''}
      `}>
        <SidebarContent />
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={`${styles.main} ${isDesktopCollapsed ? styles.mainExpanded : ''}`}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            {/* Mobile Menu Toggle */}
            <button className={styles.mobileMenuBtn} onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>

            {/* Desktop Collapse Toggle */}
            <button 
              className={styles.collapseBtn} 
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isDesktopCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Dynamic Breadcrumb */}
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbMuted}>Dashboard</span>
              <span className={styles.breadcrumbDivider}>/</span>
              <span className={styles.breadcrumbActive}>{pageTitle}</span>
            </div>
          </div>
          
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              <span className={styles.notifDot}></span>
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messenger">
              <MessageSquare size={20} />
            </button>
            
            <div className={styles.profileDivider}></div>

            <div className={styles.profile}>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{user?.fullName || 'President'}</span>
                <span className={styles.profileRole}>{user?.role || 'Admin'}</span>
              </div>
              <div className={styles.avatar}>{userInitials}</div>
            </div>

            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;