import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, CalendarDays, Users, BarChart3,
  ClipboardList, CheckCircle, Eye, FileText, Wallet, Receipt, TrendingUp
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import StatCard from '@/components/StatCard.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { events, eventParticipants, members, funds, expenses, requests, notifications } from '@/data/mockData.js';
import styles from './JointGSDashboard.module.css';

// 🔴 1. IMPORT THE WIDGET HERE
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';

const JointGSDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [notifs] = useState(notifications);
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadNotifs = notifs.filter(n => !n.read).length;
  const totalFunds = funds.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

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
              <div className={styles.headerSub}>Assist GS — Verify participation & maintain reports</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">JGS</Badge>
            
            {/* 🔴 2. PLACE THE WIDGET IN THE HEADER HERE */}
            <TransferRoleWidget />

            <Button size="sm" variant="outline" onClick={() => navigate('/notifications')}>
              <Bell size={16} /> {unreadNotifs > 0 && <span className={styles.badge}>{unreadNotifs}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}><LogOut size={16} /></Button>
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
          {activeTab === 'events' && (
            <>
              <h2 className={styles.sectionTitle}>All Society Events</h2>
              <p className={styles.roleDesc}>View and monitor all events. Coordinate with Event Manager for logistics.</p>
              <div className={styles.cardGrid}>
                {events.map(e => (
                  <div key={e.id} className={styles.eventCard}>
                    <div className={styles.complaintTop}>
                      <span className={styles.bold}>{e.title}</span>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                    </div>
                    <div className={styles.annDesc}>{e.description}</div>
                    <div className={styles.annMeta}>{e.date} · Budget: Rs. {e.budget?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'participation' && (
            <>
              <h2 className={styles.sectionTitle}>Manage & Verify Participation</h2>
              <p className={styles.roleDesc}>Review event participants and verify their attendance records.</p>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Event</th><th>Participant</th><th>Role</th><th>Teamwork</th><th>Communication</th><th>Total Score</th></tr></thead>
                  <tbody>
                    {eventParticipants.map(p => {
                      const event = events.find(e => e.id === p.eventId);
                      return (
                        <tr key={p.id}>
                          <td className={styles.bold}>{event?.title || 'Unknown'}</td>
                          <td>{p.memberName}</td>
                          <td><Badge variant="secondary">{p.role}</Badge></td>
                          <td>{p.teamwork}/5</td>
                          <td>{p.communication}/5</td>
                          <td className={styles.bold}>{p.totalScore}/15</td>
                        </tr>
                      );
                    })}
                    {eventParticipants.length === 0 && <tr><td colSpan={6} className={styles.muted}>No participation records</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'overview' && (
            <>
              <h2 className={styles.sectionTitle}>Assist General Secretary</h2>
              <p className={styles.roleDesc}>Overview of pending items to help the GS manage the society.</p>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <Users size={20} className={styles.statIconBlue} />
                  <div className={styles.statVal}>{members.filter(m => m.status === 'Active').length}</div>
                  <div className={styles.statLabel}>Active Members</div>
                </div>
                <div className={styles.statCard}>
                  <FileText size={20} className={styles.statIconYellow} />
                  <div className={styles.statVal}>{requests.filter(r => r.status === 'Pending').length}</div>
                  <div className={styles.statLabel}>Pending Requests</div>
                </div>
                <div className={styles.statCard}>
                  <CalendarDays size={20} className={styles.statIconGreen} />
                  <div className={styles.statVal}>{events.filter(e => e.status === 'Upcoming').length}</div>
                  <div className={styles.statLabel}>Upcoming Events</div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Pending Requests (for GS review)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>By</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {requests.filter(r => r.status === 'Pending').map(r => (
                      <tr key={r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td>{r.submittedBy}</td>
                        <td><Badge variant="outline">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.date}</td>
                        <td><Badge variant="secondary">{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'reports' && (
            <>
              <h2 className={styles.sectionTitle}>Society Reports</h2>
              <p className={styles.roleDesc}>View financial and activity reports to maintain records.</p>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <Wallet size={20} className={styles.statIconBlue} />
                  <div className={styles.statVal}>Rs. {totalFunds.toLocaleString()}</div>
                  <div className={styles.statLabel}>Total Funds</div>
                </div>
                <div className={styles.statCard}>
                  <Receipt size={20} className={styles.statIconRed} />
                  <div className={styles.statVal}>Rs. {totalExpenses.toLocaleString()}</div>
                  <div className={styles.statLabel}>Total Expenses</div>
                </div>
                <div className={styles.statCard}>
                  <TrendingUp size={20} className={styles.statIconGreen} />
                  <div className={styles.statVal}>Rs. {(totalFunds - totalExpenses).toLocaleString()}</div>
                  <div className={styles.statLabel}>Balance</div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Member Summary</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Events</th></tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td className={styles.bold}>{m.name}</td>
                        <td><Badge variant="secondary">{m.role}</Badge></td>
                        <td><Badge variant={m.status === 'Active' ? 'default' : 'secondary'}>{m.status}</Badge></td>
                        <td>{m.eventsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JointGSDashboard;