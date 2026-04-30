import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, CalendarDays, Users, BarChart3,
  ClipboardList, FileText, Wallet, Receipt, TrendingUp, MessageSquare, Loader2
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './JointGSDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const JointGSDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  // 🔴 LIVE DATABASE STATES
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [funds, setFunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifs, setNotifs] = useState([]);

  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [
          eventsRes, participantsRes, usersRes, fundsRes,
          expRes, reqRes, notifRes, chatRes
        ] = await Promise.all([
          fetch(`${API_URL}/events`, { headers }).catch(() => null),
          fetch(`${API_URL}/participants/all`, { headers }).catch(() => fetch(`${API_URL}/participants`, { headers }).catch(() => null)),
          fetch(`${API_URL}/admin/users`, { headers }).catch(() => null),
          fetch(`${API_URL}/fund-collections/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/expenses/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/requests`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => null)
        ]);

        if (eventsRes?.ok) setEvents(await eventsRes.json());
        if (participantsRes?.ok) setParticipants(await participantsRes.json());
        if (usersRes?.ok) setMembers(await usersRes.json());
        if (fundsRes?.ok) setFunds(await fundsRes.json());
        if (expRes?.ok) setExpenses(await expRes.json());
        if (reqRes?.ok) setRequests(await reqRes.json());

        if (notifRes?.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }

        if (chatRes?.ok) {
          const msgs = await chatRes.json();
          const myId = currentUser?._id || currentUser?.id;
          setUnreadChatCount(msgs.filter(m => !m.read && m.receiver === myId).length);
        }
      } catch (error) {
        toast({ title: 'Sync Error', description: 'Failed to load society data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [currentUser, toast]);

  // 🔴 DYNAMIC CALCULATIONS
  const unreadNotifs = notifs.filter(n => !n.read).length;
  const totalFunds = funds.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const activeMembersCount = members.filter(m => m.isActive || m.status === 'Active').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'Pending').length;
  const upcomingEventsCount = events.filter(e => e.status === 'Upcoming').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { key: 'events', label: 'View Events', icon: CalendarDays },
    { key: 'participation', label: 'Manage Participation', icon: Users },
    { key: 'overview', label: 'Assist GS', icon: ClipboardList },
    { key: 'reports', label: 'View Reports', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Workspace...</h2>
        <p>Gathering society data for Joint General Secretary.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>Joint General Secretary</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>JGS Access</Badge>
            <TransferRoleWidget />

            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
              {unreadChatCount > 0 && <span className={styles.badgeAlert}>{unreadChatCount}</span>}
            </button>

            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {unreadNotifs > 0 && <span className={styles.badgeAlert}>{unreadNotifs}</span>}
            </button>

            <Button variant="outline" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.hideMobile} style={{ marginLeft: '6px' }}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} style={{ marginRight: '6px' }} /> <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'events' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>All Society Events</h2>
              <p className={styles.sectionDesc}>Monitor events and coordinate with the Event Manager.</p>
              <div className={styles.gridContainer}>
                {events.length > 0 ? events.map(e => (
                  <div key={e._id || e.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{e.title}</h3>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : e.status === 'Completed' ? 'success' : 'secondary'}>{e.status || 'Upcoming'}</Badge>
                    </div>
                    <div className={styles.cardDesc}>{e.description}</div>
                    <div className={styles.cardMeta}>
                      {e.date ? new Date(e.date).toLocaleDateString() : 'TBD'} • {e.venue || 'Venue TBD'}
                    </div>
                  </div>
                )) : <p className={styles.emptyTable}>No events created yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'participation' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Manage Participation</h2>
              <p className={styles.sectionDesc}>Review event participants and verify their attendance.</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Participant</th><th>Event</th><th>Role/Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {participants.length > 0 ? participants.map(p => {
                      const event = events.find(e => e._id === p.eventId);
                      return (
                        <tr key={p._id || p.id}>
                          <td className={styles.bold}>{p.studentName || p.memberName}</td>
                          <td className={styles.mutedInfo}>{event?.title || p.eventTitle || 'Unknown Event'}</td>
                          <td><Badge variant={p.status === 'Approved' ? 'success' : p.status === 'Pending' ? 'warning' : 'secondary'}>{p.status || p.role || 'Participant'}</Badge></td>
                          <td className={styles.mutedInfo}>{p.date ? new Date(p.date).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    }) : <tr><td colSpan={4} className={styles.emptyTable}>No participation records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Assist General Secretary</h2>
              <p className={styles.sectionDesc}>Overview of pending items and society status.</p>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><Users size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Active Members</span>
                    <span className={styles.statValue}>{activeMembersCount}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}><FileText size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Pending Requests</span>
                    <span className={styles.statValue}>{pendingRequestsCount}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><CalendarDays size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Upcoming Events</span>
                    <span className={styles.statValue}>{upcomingEventsCount}</span>
                  </div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Pending Requests (Review)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Submitted By</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {requests.filter(r => r.status === 'Pending').length > 0 ?
                      requests.filter(r => r.status === 'Pending').map(r => (
                        <tr key={r._id || r.id}>
                          <td className={styles.bold}>{r.title}</td>
                          <td className={styles.mutedInfo}>{r.submittedBy || r.studentName}</td>
                          <td><Badge variant="outline">{r.type}</Badge></td>
                          <td className={styles.mutedInfo}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</td>
                          <td><Badge variant="warning">{r.status}</Badge></td>
                        </tr>
                      )) : <tr><td colSpan={5} className={styles.emptyTable}>No pending requests. Everything is clear!</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Society Reports</h2>
              <p className={styles.sectionDesc}>View financial and registry reports.</p>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><Wallet size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Collected</span>
                    <span className={styles.statValue}>Rs. {totalFunds.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                  <div className={styles.statIcon}><Receipt size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Expenses</span>
                    <span className={styles.statValue}>Rs. {totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><TrendingUp size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Available Balance</span>
                    <span className={styles.statValue}>Rs. {(totalFunds - totalExpenses).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Member Summary</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Status</th></tr></thead>
                  <tbody>
                    {members.length > 0 ? members.map(m => (
                      <tr key={m._id || m.id}>
                        <td className={styles.bold}>{m.fullName || m.name}</td>
                        <td><Badge variant="outline">{m.role}</Badge></td>
                        <td className={styles.mutedInfo}>{m.department || m.class || 'N/A'}</td>
                        <td><Badge variant={m.isActive ? 'success' : 'secondary'}>{m.isActive ? 'Active' : 'Pending'}</Badge></td>
                      </tr>
                    )) : <tr><td colSpan={4} className={styles.emptyTable}>No members found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JointGSDashboard;