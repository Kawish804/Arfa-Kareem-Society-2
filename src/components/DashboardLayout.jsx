import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, Wallet, Receipt, CalendarDays, Megaphone, 
  Settings as SettingsIcon, LogOut, Menu, X, 
  Image as ImageIcon, BarChart3, GraduationCap, 
  Bell, MessageSquare, ShieldAlert, FileCheck, ClipboardList, ScrollText
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // 🔴 1. Imported Auth Context
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // GRAB THE DYNAMIC SETTINGS & REAL USER
  const { settings } = useSettings(); 
  const { user, logout } = useAuth(); // 🔴 2. Grab the logged-in user and logout function

  // 🔴 3. Helper function to get initials from the user's name
  const getInitials = (name) => {
    if (!name) return 'PR'; // Default 'PR' for President
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const userInitials = getInitials(user?.fullName);

  const handleLogout = () => {
    logout(); // Actually clear the session
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <GraduationCap size={24} />
          </div>
          {sidebarOpen && (
            <div className={styles.brand}>
              {/* DYNAMIC SOCIETY NAME */}
              <h2 style={{ margin: 0, fontSize: '1.25rem', lineHeight: '1.2' }}>
                {settings?.societyName || 'Society'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}></p>
            </div>
          )}
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
              title={!sidebarOpen ? item.label : ''}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className={styles.breadcrumb}>President Panel</span>
          </div>
          
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} onClick={() => navigate('/notifications')}><Bell size={20} /></button>
            <button className={styles.iconBtn} onClick={() => navigate('/chat')}><MessageSquare size={20} /></button>
            
            <div className={styles.profile} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={styles.profileInfo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {/* 🔴 4. Dynamically insert Name and Email */}
                <span className={styles.profileName} style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: '1' }}>
                  {user?.fullName || 'President User'}
                </span>
                <span className={styles.profileRole} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {user?.email || 'president@society.edu'}
                </span>
              </div>
              {/* 🔴 5. Insert Initials */}
              <div className={styles.avatar}>{userInitials}</div>
            </div>

            {/* 🔴 6. Updated Logout to clear session */}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;