import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, Wallet, Receipt, CalendarDays, Megaphone, 
  Settings as SettingsIcon, LogOut, Menu, X, 
  Image as ImageIcon, BarChart3, GraduationCap, 
  Bell, MessageSquare, ShieldAlert, FileCheck, ClipboardList
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext.jsx';
import styles from './DashboardLayout.module.css';

const menuItems = [
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard', exact: true },
  { path: '/dashboard/members', icon: Users, label: 'Members' },
  { path: '/dashboard/funds', icon: Wallet, label: 'Funds' },
  { path: '/dashboard/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/dashboard/events', icon: CalendarDays, label: 'Events' },
  { path: '/dashboard/requests', icon: FileCheck, label: 'Members Request' },
  { path: '/dashboard/participant-requests', icon: Users, label: 'Participant Request' },
  { path: '/dashboard/fund-requests', icon: ClipboardList, label: 'Fund Requests' },
  { path: '/dashboard/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/dashboard/gallery', icon: ImageIcon, label: 'Gallery' },
  { path: '/dashboard/participants', icon: Users, label: 'Participants' },
  { path: '/dashboard/studentmanagement', icon: Users, label: 'Student Management' },
  { path: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { path: '/dashboard/settings', icon: SettingsIcon, label: 'Settings' },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // GRAB THE DYNAMIC SETTINGS
  const { settings } = useSettings(); 

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
            <span className={styles.breadcrumb}>Admin Panel</span>
          </div>
          
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn}><Bell size={20} /></button>
            <button className={styles.iconBtn} onClick={() => navigate('/chat')}><MessageSquare size={20} /></button>
            
            <div className={styles.profile} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className={styles.profileInfo} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className={styles.profileName} style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: '1' }}>Admin User</span>
                {/* DYNAMIC EMAIL */}
                <span className={styles.profileRole} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {settings?.email || 'admin@society.edu'}
                </span>
              </div>
              <div className={styles.avatar}>AU</div>
            </div>

            <button className={styles.logoutBtn} onClick={() => navigate('/login')}>
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