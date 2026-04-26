import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, CalendarDays, Users, BarChart3,
  ClipboardList, CheckCircle, Eye, FileText, Wallet, Receipt, TrendingUp
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // 🔴 Real User
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './JointGSDashboard.module.css';

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

  // 🔴 FETCH EVERYTHING ON LOAD
  useEffect(() => {
    const fetchAllData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        // We fetch all society data concurrently for the ultimate overview
        const [
          eventsRes, participantsRes, usersRes, fundsRes, 
          expRes, reqRes, notifRes
        ] = await Promise.all([
          fetch('http://localhost:5000/api/events', { headers }),
          fetch('http://localhost:5000/api/participants', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/admin/users', { headers }), // Or wherever you list all users
          fetch('http://localhost:5000/api/fund-collections/records', { headers }),
          fetch('http://localhost:5000/api/expenses/records', { headers }),
          fetch('http://localhost:5000/api/requests', { headers }), 
          fetch('http://localhost:5000/api/notifications/all', { headers })
        ]);

        if (eventsRes.ok) setEvents(await eventsRes.json());
        if (participantsRes.ok) setParticipants(await participantsRes.json());
        if (usersRes.ok) setMembers(await usersRes.json());
        if (fundsRes.ok) setFunds(await fundsRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
        if (reqRes.ok) setRequests(await reqRes.json());
        
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
        toast({ title: 'Failed to load society data', variant: 'destructive' });
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { key: 'events', label: 'View Events', icon: CalendarDays },
    { key: 'participation', label: 'Manage Participation', icon: Users },
    { key: 'overview', label: 'Assist GS', icon: ClipboardList },
    { key: 'reports', label: 'View Reports', icon: BarChart3 },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <div className={styles.headerTitle}>Joint General Secretary</div>
              <div className={styles.headerSub}>Welcome, {currentUser?.fullName || 'JGS'} — Verify participation & maintain reports</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">JGS</Badge>
            
            {/* 🔴 TRANSFER ROLE WIDGET */}
            <TransferRoleWidget />

            <Button size="sm" variant="outline" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={16} /> 
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{unreadNotifs}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}><LogOut size={16} /></Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Syncing Society Database...</p>
          ) : (
            <>
              {/* --- EVENTS TAB --- */}
              {activeTab === 'events' && (
                <>
                  <h2 className={styles.sectionTitle}>All Society Events</h2>
                  <p className={styles.roleDesc}>View and monitor all events. Coordinate with the Event Manager for logistics.</p>
                  <div className={styles.cardGrid}>
                    {events.length > 0 ? events.map(e => (
                      <div key={e._id || e.id} className={styles.eventCard}>
                        <div className={styles.complaintTop}>
                          <span className={styles.bold}>{e.title}</span>
                          <Badge variant={e.status === 'Upcoming' ? 'default' : e.status === 'Completed' ? 'success' : 'secondary'}>{e.status || 'Upcoming'}</Badge>
                        </div>
                        <div className={styles.annDesc}>{e.description}</div>
                        <div className={styles.annMeta}>
                          {e.date ? new Date(e.date).toLocaleDateString() : 'TBD'} · {e.venue || 'Venue TBD'}
                        </div>
                      </div>
                    )) : <p className={styles.muted}>No events created yet.</p>}
                  </div>
                </>
              )}

              {/* --- PARTICIPATION TAB --- */}
              {activeTab === 'participation' && (
                <>
                  <h2 className={styles.sectionTitle}>Manage & Verify Participation</h2>
                  <p className={styles.roleDesc}>Review event participants and verify their attendance records.</p>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Event</th><th>Participant</th><th>Role/Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {participants.length > 0 ? participants.map(p => {
                          // Find the matching event to display its title
                          const event = events.find(e => e._id === p.eventId);
                          return (
                            <tr key={p._id || p.id}>
                              <td className={styles.bold}>{event?.title || p.eventTitle || 'Unknown Event'}</td>
                              <td>{p.studentName || p.memberName}</td>
                              <td><Badge variant={p.status === 'Approved' ? 'success' : p.status === 'Pending' ? 'warning' : 'secondary'}>{p.status || p.role || 'Participant'}</Badge></td>
                              <td className={styles.muted}>{p.date ? new Date(p.date).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        }) : <tr><td colSpan={4} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No participation records found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* --- ASSIST GS (OVERVIEW) TAB --- */}
              {activeTab === 'overview' && (
                <>
                  <h2 className={styles.sectionTitle}>Assist General Secretary</h2>
                  <p className={styles.roleDesc}>Overview of pending items to help the GS manage the society.</p>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <Users size={20} className={styles.statIconBlue} />
                      <div className={styles.statVal}>{activeMembersCount}</div>
                      <div className={styles.statLabel}>Active Members</div>
                    </div>
                    <div className={styles.statCard}>
                      <FileText size={20} className={styles.statIconYellow} />
                      <div className={styles.statVal}>{pendingRequestsCount}</div>
                      <div className={styles.statLabel}>Pending Requests</div>
                    </div>
                    <div className={styles.statCard}>
                      <CalendarDays size={20} className={styles.statIconGreen} />
                      <div className={styles.statVal}>{upcomingEventsCount}</div>
                      <div className={styles.statLabel}>Upcoming Events</div>
                    </div>
                  </div>

                  <h3 className={styles.subTitle} style={{ marginTop: '30px', marginBottom: '15px' }}>Pending Requests (for GS review)</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Title</th><th>By</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {requests.filter(r => r.status === 'Pending').length > 0 ? 
                          requests.filter(r => r.status === 'Pending').map(r => (
                            <tr key={r._id || r.id}>
                              <td className={styles.bold}>{r.title}</td>
                              <td>{r.submittedBy || r.studentName}</td>
                              <td><Badge variant="outline">{r.type}</Badge></td>
                              <td className={styles.muted}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</td>
                              <td><Badge variant="warning">{r.status}</Badge></td>
                            </tr>
                          )) : <tr><td colSpan={5} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No pending requests. Everything is clear!</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* --- REPORTS TAB --- */}
              {activeTab === 'reports' && (
                <>
                  <h2 className={styles.sectionTitle}>Society Reports</h2>
                  <p className={styles.roleDesc}>View financial and activity reports to maintain records.</p>
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <Wallet size={20} className={styles.statIconBlue} />
                      <div className={styles.statVal}>Rs. {totalFunds.toLocaleString()}</div>
                      <div className={styles.statLabel}>Total Collected Funds</div>
                    </div>
                    <div className={styles.statCard}>
                      <Receipt size={20} className={styles.statIconRed} />
                      <div className={styles.statVal}>Rs. {totalExpenses.toLocaleString()}</div>
                      <div className={styles.statLabel}>Total Expenses</div>
                    </div>
                    <div className={styles.statCard}>
                      <TrendingUp size={20} className={styles.statIconGreen} />
                      <div className={styles.statVal}>Rs. {(totalFunds - totalExpenses).toLocaleString()}</div>
                      <div className={styles.statLabel}>Available Balance</div>
                    </div>
                  </div>

                  <h3 className={styles.subTitle} style={{ marginTop: '30px', marginBottom: '15px' }}>Member Summary</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Name</th><th>Role</th><th>Dept</th><th>Status</th></tr></thead>
                      <tbody>
                        {members.length > 0 ? members.map(m => (
                          <tr key={m._id || m.id}>
                            <td className={styles.bold}>{m.fullName || m.name}</td>
                            <td><Badge variant="secondary">{m.role}</Badge></td>
                            <td>{m.department || 'N/A'}</td>
                            <td><Badge variant={m.isActive ? 'default' : 'secondary'}>{m.isActive ? 'Active' : 'Pending'}</Badge></td>
                          </tr>
                        )) : <tr><td colSpan={4} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No members found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JointGSDashboard;