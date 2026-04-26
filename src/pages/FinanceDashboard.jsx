import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Wallet, Receipt, CalendarDays, BarChart3, Award, MessageSquare, LogOut, Plus, Upload, Users, Star, DollarSign, Bell, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import StatCard from '../components/StatCard.jsx';
import { eventFeedbacks } from '../data/mockData.js'; // Keep feedback mock if no backend route exists yet
import { useToast } from '../components/Toast/ToastProvider.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './FinanceDashboard.module.css';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); // 🔴 LIVE USER
  const [activeTab, setActiveTab] = useState('overview');

  // 🔴 LIVE DATABASE STATES
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [events, setEvents] = useState([]);
  const [dbParticipations, setDbParticipations] = useState([]);
  const [notifs, setNotifs] = useState([]);

  // Modals
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [participateOpen, setParticipateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Forms
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });
  const [expenseForm, setExpenseForm] = useState({ title: '', category: '', amount: '', date: '' });
  const [participateRole, setParticipateRole] = useState('Volunteer');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [feedbacks, setFeedbacks] = useState(eventFeedbacks);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  // --- FETCH LIVE DATA ---
  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [fundRes, expRes, evRes, partRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/fund-collections/records', { headers }),
          fetch('http://localhost:5000/api/expenses/records', { headers }),
          fetch('http://localhost:5000/api/events', { headers }),
          fetch('http://localhost:5000/api/participants/all', { headers }),
          fetch('http://localhost:5000/api/notifications', { headers })
        ]);

        if (fundRes.ok) setFundList(await fundRes.json());
        if (expRes.ok) setExpenseList(await expRes.json());
        if (evRes.ok) setEvents(await evRes.json());
        if (partRes.ok) setDbParticipations(await partRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        console.error("Data fetch error", error);
      }
    };
    fetchData();
  }, [currentUser]);

  // --- LIVE MATH & CHARTS ---
  const totalFunds = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalFunds - totalExpenses;
  const unreadNotifs = notifs.filter(n => !n.read).length;

  const upcomingEvents = events.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');
  const completedEvents = events.filter(e => e.status === 'Completed');

  // Chart Aggregation Logic
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let fundChart = monthNames.map(month => ({ month, amount: 0 }));
  let expChart = monthNames.map(month => ({ month, amount: 0 }));

  fundList.forEach(f => {
    if (f.status === 'Paid' && f.date) {
      const m = new Date(f.date).getMonth();
      fundChart[m].amount += Number(f.amount) || 0;
    }
  });

  expenseList.forEach(e => {
    if (e.date || e.createdAt) {
      const m = new Date(e.date || e.createdAt).getMonth();
      expChart[m].amount += Number(e.amount) || 0;
    }
  });

  const currentMonthIndex = new Date().getMonth();
  fundChart = fundChart.slice(0, currentMonthIndex + 1);
  expChart = expChart.slice(0, currentMonthIndex + 1);

  // My Performance Data (Only Approved Participations)
  const myPerformance = dbParticipations.filter(p => p.studentName === currentUser?.fullName && p.status === 'Approved');

  // --- ACTIONS ---
  const handleAddFund = async () => {
    if (!fundForm.memberName || !fundForm.amount) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }

    const payload = {
      studentName: fundForm.memberName, department: fundForm.class.split('-')[0] || 'Unknown',
      semester: fundForm.class.split('-')[1] || 'Unknown', amount: Number(fundForm.amount),
      status: fundForm.status, date: new Date().toISOString().split('T')[0], uploadedBy: currentUser.fullName
    };

    try {
      const res = await fetch('http://localhost:5000/api/fund-collections/record', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFundList([await res.json(), ...fundList]);
        toast({ title: 'Fund record added' });
        setFundDialogOpen(false);
        setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
      }
    } catch (e) { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleUpdateStatus = async (fund, newStatus) => {
    // Basic optimistic update for UI
    setFundList(prev => prev.map(f => f._id === fund._id ? { ...f, status: newStatus } : f));
    toast({ title: `Status updated to ${newStatus}` });
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    if (Number(expenseForm.amount) > balance) { toast({ title: 'Insufficient Funds!', variant: 'destructive' }); return; }

    const payload = { ...expenseForm, amount: Number(expenseForm.amount), date: expenseForm.date || new Date().toISOString().split('T')[0] };

    try {
      const res = await fetch('http://localhost:5000/api/expenses/record', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setExpenseList([await res.json(), ...expenseList]);
        toast({ title: 'Expense added successfully' });
        setExpenseDialogOpen(false);
        setExpenseForm({ title: '', category: '', amount: '', date: '' });
      }
    } catch (e) { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const confirmParticipate = async () => {
    try {
      const payload = {
        studentName: currentUser.fullName, email: currentUser.email,
        department: currentUser.department || 'N/A', rollNo: currentUser.rollNo || 'N/A',
        eventId: selectedEvent._id, eventTitle: selectedEvent.title, role: participateRole
      };
      const res = await fetch('http://localhost:5000/api/participants/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // 🔴 FIX: Await the data FIRST, then update the state!
        const newParticipation = await res.json();
        setDbParticipations(prev => [...prev, newParticipation]);

        toast({ title: `Requested to join "${selectedEvent.title}"` });
        setParticipateOpen(false);
      }
    } catch (e) { toast({ title: 'Failed to join', variant: 'destructive' }); }
  };

  const submitFeedback = () => {
    if (!feedbackForm.comment) { toast({ title: 'Please write feedback', variant: 'destructive' }); return; }
    setFeedbacks(prev => [...prev, { id: String(Date.now()), eventId: selectedEvent._id, memberName: currentUser.fullName, rating: feedbackForm.rating, comment: feedbackForm.comment, date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Feedback submitted' });
    setFeedbackOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Wallet },
    { id: 'funds', label: 'Fund Records', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Finance Dashboard</h1>
              <p className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Finance Head'}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">{currentUser?.role[0] || 'Finance Head'}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={14} />
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{unreadNotifs}</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut size={14} /> Logout</Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div>
              <h2 className={styles.sectionTitle}>Financial Overview</h2>
              <div className={styles.statsGrid}>
                <StatCard title="Total Funds Collected" value={`Rs ${totalFunds.toLocaleString()}`} icon={Wallet} />
                <StatCard title="Total Expenses" value={`Rs ${totalExpenses.toLocaleString()}`} icon={Receipt} />
                <StatCard title="Available Balance" value={`Rs ${balance.toLocaleString()}`} icon={DollarSign} />
              </div>
              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Fund Collection Trend (Live)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={fundChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="amount" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Expense Trend (Live)</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={expChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Fund Records</h2>
                <Button size="sm" onClick={() => setFundDialogOpen(true)}><Plus size={14} /> Add Fund Record</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member</th><th>Department/Sem</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {fundList.map(f => (
                      <tr key={f._id || f.id}>
                        <td className={styles.bold}>{f.studentName || f.memberName}</td>
                        <td className={styles.muted}>{f.department} {f.semester}</td>
                        <td className={styles.bold} style={{ color: 'var(--success)' }}>Rs {f.amount?.toLocaleString()}</td>
                        <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'default' : 'destructive'}>{f.status}</Badge></td>
                        <td>
                          {f.status === 'Unpaid' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(f, 'Paid')}>Mark Paid</Button>}
                          {f.status === 'Paid' && <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(f, 'Unpaid')}>Mark Unpaid</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Live Expenses</h2>
                <Button size="sm" onClick={() => setExpenseDialogOpen(true)}><Plus size={14} /> Add Expense</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {expenseList.map(e => (
                      <tr key={e._id || e.id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="secondary">{e.category}</Badge></td>
                        <td style={{ color: 'var(--destructive)', fontWeight: 'bold' }}>- Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.muted}>{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div className={styles.eventGrid}>
                {upcomingEvents.map(e => {
                  const userPart = dbParticipations.find(p => p.eventId === e._id && p.studentName === currentUser?.fullName);
                  const isRejected = userPart?.status === 'Rejected';
                  const hasActiveReq = userPart && !isRejected;

                  return (
                    <div key={e._id} className={styles.eventCard}>
                      <div className={styles.eventTop}>
                        <Badge variant="default">{e.status}</Badge>
                        <span className={styles.eventDate}><CalendarDays size={12} /> {e.date}</span>
                      </div>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <p className={styles.eventBudget}>Budget: Rs {e.budget?.toLocaleString()}</p>
                      <Button
                        size="sm"
                        disabled={hasActiveReq}
                        variant={hasActiveReq ? 'outline' : 'primary'}
                        onClick={() => { setSelectedEvent(e); setParticipateOpen(true); }}
                      >
                        {hasActiveReq ? <><CheckCircle size={14} style={{ marginRight: '6px' }} /> {userPart.status === 'Approved' ? 'Joined' : 'Request Pending'}</> : <><Users size={14} /> Participate</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className={styles.sectionTitle}>Financial Reports</h2>
              <div className={styles.statsGrid}>
                <StatCard title="Total Collected" value={`Rs ${totalFunds.toLocaleString()}`} icon={Wallet} />
                <StatCard title="Total Spent" value={`Rs ${totalExpenses.toLocaleString()}`} icon={Receipt} />
                <StatCard title="Remaining Balance" value={`Rs ${balance.toLocaleString()}`} icon={DollarSign} />
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h2 className={styles.sectionTitle}>My Performance Record</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Event</th><th>Role</th><th>Teamwork</th><th>Communication</th><th>Responsibility</th><th>Total</th></tr></thead>
                  <tbody>
                    {myPerformance.map(p => (
                      <tr key={p._id}>
                        <td className={styles.bold}>{p.eventTitle}</td>
                        <td><Badge variant="secondary">{p.role}</Badge></td>
                        <td>{p.teamwork}/5</td><td>{p.communication}/5</td><td>{p.responsibility}/5</td>
                        <td className={styles.bold}>{p.totalScore}/15</td>
                      </tr>
                    ))}
                    {myPerformance.length === 0 && <tr><td colSpan={6} className={styles.empty}>No approved performance records yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Feedback</h2>
              <div className={styles.eventGrid}>
                {completedEvents.map(e => {
                  const myFb = feedbacks.find(f => f.eventId === e._id && f.memberName === currentUser?.fullName);
                  return (
                    <div key={e._id} className={styles.eventCard}>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDate}>{e.date}</p>
                      {myFb ? (
                        <div>
                          <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= myFb.rating ? 'var(--warning)' : 'none'} color={s <= myFb.rating ? 'var(--warning)' : 'var(--text-light)'} />)}</div>
                          <p className={styles.muted}>{myFb.comment}</p>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedEvent(e); setFeedbackOpen(true); }}><MessageSquare size={14} /> Give Feedback</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={fundDialogOpen} onClose={() => setFundDialogOpen(false)} title="Add Fund Record" footer={<><Button variant="outline" onClick={() => setFundDialogOpen(false)}>Cancel</Button><Button onClick={handleAddFund}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} /></div>
          <div className={styles.field}><label>Department-Sem</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BSCS-6A" /></div>
          <div className={styles.field}><label>Amount *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></Select>
          </div>
        </div>
      </Modal>

      <Modal open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} title="Add Expense" footer={<><Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button><Button onClick={handleAddExpense}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div className={styles.field}><label>Category</label>
            <Select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Select category</option><option value="Event">Event</option><option value="Supplies">Supplies</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Amount *</label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title={`Join: ${selectedEvent?.title || ''}`} footer={<><Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button><Button onClick={confirmParticipate}>Confirm</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Select Role</label>
            <Select value={participateRole} onChange={e => setParticipateRole(e.target.value)}>
              <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Coordinator">Coordinator</option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Event Feedback" footer={<><Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button><Button onClick={submitFeedback}>Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Rating</label>
            <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setFeedbackForm(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <Star size={28} fill={s <= feedbackForm.rating ? 'var(--warning)' : 'none'} color={s <= feedbackForm.rating ? 'var(--warning)' : 'var(--text-light)'} />
              </button>
            ))}</div>
          </div>
          <div className={styles.field}><label>Your Feedback *</label><Textarea rows={4} value={feedbackForm.comment} onChange={e => setFeedbackForm(p => ({ ...p, comment: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;