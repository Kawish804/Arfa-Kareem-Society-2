import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Wallet, Receipt, CalendarDays, BarChart3, Award, MessageSquare, 
  LogOut, Plus, Send, DollarSign, Bell, CheckCircle, Loader2, Database, Clock 
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import StatCard from '../components/StatCard.jsx';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './FinanceDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); 
  const [activeTab, setActiveTab] = useState('overview');

  // 🔴 LIVE DATABASE STATES
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [events, setEvents] = useState([]);
  const [dbParticipations, setDbParticipations] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [societyStudents, setSocietyStudents] = useState([]);
  const [monthlyFee, setMonthlyFee] = useState(500);
  
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [feedbacks, setFeedbacks] = useState([]); // If no DB route, defaulting to local array
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });

  // --- FETCH LIVE DATA ---
  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [fundRes, expRes, evRes, partRes, notifRes, chatRes, stuRes, feeRes] = await Promise.all([
          fetch(`${API_URL}/fund-collections/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/expenses/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/events`, { headers }).catch(() => null),
          fetch(`${API_URL}/participants/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => null),
          fetch(`${API_URL}/students/all`, { headers }).catch(() => fetch(`${API_URL}/students`, { headers }).catch(() => null)),
          fetch(`${API_URL}/settings/fee`, { headers }).catch(() => null)
        ]);

        if (fundRes?.ok) setFundList(await fundRes.json());
        if (expRes?.ok) setExpenseList(await expRes.json());
        if (evRes?.ok) setEvents(await evRes.json());
        if (partRes?.ok) setDbParticipations(await partRes.json());
        if (stuRes?.ok) setSocietyStudents(await stuRes.json());
        if (feeRes?.ok) setMonthlyFee((await feeRes.json()).fee);
        
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
        toast({ title: 'Sync Error', description: 'Failed to synchronize live financial data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, toast]);

  // --- MASTER LEDGER MATH ---
  const paidTransactions = fundList.filter(f => f.status === 'Paid');
  const manualUnpaid = fundList.filter(f => f.status !== 'Paid');
  
  const activeStudentDebts = societyStudents
    .filter(s => s.fundStatus === 'Unpaid' || s.fundStatus === 'Pending')
    .map(s => ({
      _id: `debt_${s._id}`, studentName: s.fullName, department: s.department, semester: s.semester,
      amount: monthlyFee + (s.arrears || 0), status: s.fundStatus, uploadedBy: 'CR Sync', isDebt: true
    }));

  const allPendingRecords = [...manualUnpaid, ...activeStudentDebts];
  
  const totalFunds = paidTransactions.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalFunds - totalExpenses;
  const unreadNotifs = notifs.filter(n => !n.read).length;

  const upcomingEvents = events.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');
  const completedEvents = events.filter(e => e.status === 'Completed');

  // Chart Aggregation Logic
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let fundChart = monthNames.map(month => ({ month, amount: 0 }));
  let expChart = monthNames.map(month => ({ month, amount: 0 }));

  paidTransactions.forEach(f => {
    if (f.date) {
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

  const myPerformance = dbParticipations.filter(p => p.studentName === currentUser?.fullName && p.status === 'Approved');

  // --- ACTIONS ---
  const handleAddFund = async () => {
    if (!fundForm.memberName.trim() || !fundForm.amount) { toast({ title: 'Validation Error', description: 'Please fill required fields', variant: 'destructive' }); return; }

    setIsSubmitting(true);
    const payload = {
      studentName: fundForm.memberName.trim(), 
      department: fundForm.class.split('-')[0] || 'Unknown',
      semester: fundForm.class.split('-')[1] || 'Unknown', 
      amount: Number(fundForm.amount),
      status: fundForm.status, 
      date: new Date().toISOString().split('T')[0], 
      uploadedBy: currentUser.fullName
    };

    try {
      const res = await fetch(`${API_URL}/fund-collections/record`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setFundList([await res.json(), ...fundList]);
        toast({ title: 'Success', description: 'Fund record added to the Treasury.' });
        setFundDialogOpen(false);
        setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
      } else throw new Error();
    } catch (e) { 
      toast({ title: 'Failed', description: 'Could not record fund.', variant: 'destructive' }); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (fund, newStatus) => {
    // Note: For an enterprise app, this should hit an API route. Kept optimistic update as requested in base logic.
    setFundList(prev => prev.map(f => f._id === fund._id ? { ...f, status: newStatus } : f));
    toast({ title: 'Success', description: `Record updated to ${newStatus}` });
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount) { toast({ title: 'Validation Error', description: 'Please fill required fields', variant: 'destructive' }); return; }
    if (Number(expenseForm.amount) > balance) { toast({ title: 'Insufficient Funds', description: `Only Rs ${balance.toLocaleString()} available.`, variant: 'destructive' }); return; }

    setIsSubmitting(true);
    const payload = { ...expenseForm, amount: Number(expenseForm.amount), date: expenseForm.date || new Date().toISOString().split('T')[0] };

    try {
      const res = await fetch(`${API_URL}/expenses/record`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setExpenseList([await res.json(), ...expenseList]);
        toast({ title: 'Success', description: 'Expense added to ledger.' });
        setExpenseDialogOpen(false);
        setExpenseForm({ title: '', category: '', amount: '', date: '' });
      } else throw new Error();
    } catch (e) { 
      toast({ title: 'Failed', description: 'Could not record expense.', variant: 'destructive' }); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmParticipate = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        studentName: currentUser.fullName, email: currentUser.email,
        department: currentUser.department || 'N/A', rollNo: currentUser.rollNo || 'N/A',
        eventId: selectedEvent._id, eventTitle: selectedEvent.title, role: participateRole
      };
      const res = await fetch(`${API_URL}/participants/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newParticipation = await res.json();
        setDbParticipations(prev => [...prev, newParticipation]);
        toast({ title: 'Request Sent', description: `Requested to join "${selectedEvent.title}"` });
        setParticipateOpen(false);
      } else throw new Error();
    } catch (e) { 
      toast({ title: 'Failed to join', description: 'Server error.', variant: 'destructive' }); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = () => {
    if (!feedbackForm.comment.trim()) { toast({ title: 'Validation Error', description: 'Please write feedback', variant: 'destructive' }); return; }
    setFeedbacks(prev => [...prev, { id: String(Date.now()), eventId: selectedEvent._id, memberName: currentUser.fullName, rating: feedbackForm.rating, comment: feedbackForm.comment, date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Success', description: 'Feedback submitted successfully.' });
    setFeedbackOpen(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'funds', label: 'Master Ledger', icon: Wallet },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'performance', label: 'Performance', icon: Award },
  ];

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Database...</h2>
        <p>Gathering treasury logs and class registries.</p>
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
              <h1 className={styles.headerTitle}>Finance Dashboard</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>Finance Head Access</Badge>
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
              <LogOut size={16} /> <span className={styles.hideMobile} style={{marginLeft: '6px'}}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} style={{marginRight: '8px'}} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Financial Overview</h2>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><Wallet size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Collected</span>
                    <span className={styles.statValue}>Rs {totalFunds.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                  <div className={styles.statIcon}><Receipt size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Expenses</span>
                    <span className={styles.statValue}>Rs {totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><DollarSign size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Available Balance</span>
                    <span className={styles.statValue}>Rs {balance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Fund Collection Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={fundChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Area type="monotone" dataKey="amount" stroke="#52a447" fill="#52a447" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Expense Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={expChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Master Ledger</h2>
                  <p className={styles.sectionDesc}>Track all direct payments and CR-generated debts.</p>
                </div>
                <Button onClick={() => setFundDialogOpen(true)} style={{backgroundColor: '#52a447'}}><Plus size={16} style={{marginRight: '6px'}}/> Add Record</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member Details</th><th>Amount</th><th>Date Recorded</th><th>Status</th><th style={{textAlign: 'right'}}>Data Source</th></tr></thead>
                  <tbody>
                    {[...paidTransactions, ...allPendingRecords].map(f => (
                      <tr key={f._id || f.id} className={f.isDebt ? styles.rowDebt : ''}>
                        <td>
                          <div className={styles.bold}>{f.studentName || f.memberName}</div>
                          <div className={styles.mutedInfo}>{f.department} {f.semester}</div>
                        </td>
                        <td className={styles.amountText} style={{ color: f.isDebt ? '#ef4444' : '#52a447' }}>Rs {f.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{f.isDebt ? <span className={styles.debtDate}><Clock size={12}/> Outstanding</span> : new Date(f.date).toLocaleDateString()}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Pending' ? 'warning' : 'destructive'}>{f.status === 'Pending' ? 'Has Arrears' : f.status}</Badge></td>
                        <td style={{textAlign: 'right'}}>
                          {f.isDebt ? <span className={styles.sourceTag}><Database size={12}/> Class Sync</span> : <Badge variant="outline">{f.uploadedBy}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Expense Records</h2>
                  <p className={styles.sectionDesc}>Manage treasury deductions.</p>
                </div>
                <Button onClick={() => setExpenseDialogOpen(true)} style={{backgroundColor: '#52a447'}}><Plus size={16} style={{marginRight: '6px'}}/> Add Expense</Button>
              </div>
              
              <div className={styles.overdraftBanner}>
                <strong>Available Treasury Balance:</strong> Rs {balance.toLocaleString()}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Expense Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {expenseList.map(e => (
                      <tr key={e._id || e.id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="outline">{e.category}</Badge></td>
                        <td className={styles.amountText} style={{ color: '#ef4444' }}>- Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                    {expenseList.length === 0 && <tr><td colSpan={4} className={styles.emptyTable}>No expenses recorded.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div className={styles.gridContainer}>
                {upcomingEvents.map(e => {
                  const userPart = dbParticipations.find(p => p.eventId === e._id && p.studentName === currentUser?.fullName);
                  const isRejected = userPart?.status === 'Rejected';
                  const hasActiveReq = userPart && !isRejected;

                  return (
                    <div key={e._id} className={styles.card}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>{e.title}</h3>
                        <Badge variant="default">{e.status}</Badge>
                      </div>
                      <p className={styles.cardDesc}>{e.description}</p>
                      <div className={styles.cardMeta} style={{marginBottom: '16px'}}><CalendarDays size={14} /> {e.date} • Rs {e.budget?.toLocaleString() || 0}</div>
                      
                      <Button
                        size="sm" disabled={hasActiveReq || isSubmitting}
                        variant={hasActiveReq ? 'outline' : 'primary'}
                        onClick={() => { setSelectedEvent(e); setParticipateOpen(true); }}
                        style={{width: '100%', backgroundColor: hasActiveReq ? 'transparent' : '#52a447', color: hasActiveReq ? '#0f172a' : 'white'}}
                      >
                        {hasActiveReq ? <><CheckCircle size={14} style={{ marginRight: '6px' }} /> {userPart.status === 'Approved' ? 'Joined' : 'Request Pending'}</> : <><Award size={14} style={{ marginRight: '6px' }} /> Participate</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>My Performance Record</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Event</th><th>Role</th><th>Teamwork</th><th>Communication</th><th>Responsibility</th><th>Total</th></tr></thead>
                  <tbody>
                    {myPerformance.map(p => (
                      <tr key={p._id}>
                        <td className={styles.bold}>{p.eventTitle}</td>
                        <td><Badge variant="outline">{p.role}</Badge></td>
                        <td>{p.teamwork}/5</td><td>{p.communication}/5</td><td>{p.responsibility}/5</td>
                        <td className={styles.amountText}>{p.totalScore}/15</td>
                      </tr>
                    ))}
                    {myPerformance.length === 0 && <tr><td colSpan={6} className={styles.emptyTable}>No approved performance records yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={fundDialogOpen} onClose={() => !isSubmitting && setFundDialogOpen(false)} title="Add Fund Record" footer={<div style={{display:'flex', gap:'8px', width:'100%', justifyContent:'flex-end'}}><Button variant="outline" onClick={() => setFundDialogOpen(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddFund} disabled={isSubmitting} style={{backgroundColor: '#52a447'}}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : 'Save'}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name <span style={{color:'red'}}>*</span></label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Department-Sem</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BSCS-6th" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Amount (Rs) <span style={{color:'red'}}>*</span></label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))} disabled={isSubmitting}><option value="Paid">Paid</option><option value="Pending">Pending (Arrears)</option><option value="Unpaid">Unpaid</option></Select>
          </div>
        </div>
      </Modal>

      <Modal open={expenseDialogOpen} onClose={() => !isSubmitting && setExpenseDialogOpen(false)} title="Add Expense" footer={<div style={{display:'flex', gap:'8px', width:'100%', justifyContent:'flex-end'}}><Button variant="outline" onClick={() => setExpenseDialogOpen(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddExpense} disabled={isSubmitting} style={{backgroundColor: '#52a447'}}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : 'Save'}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title <span style={{color:'red'}}>*</span></label><Input value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Category</label>
            <Select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} disabled={isSubmitting}>
              <option value="Event">Event</option><option value="Supplies">Supplies</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Amount (Rs) <span style={{color:'red'}}>*</span></label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} disabled={isSubmitting} /></div>
        </div>
      </Modal>

      <Modal open={participateOpen} onClose={() => !isSubmitting && setParticipateOpen(false)} title={`Join: ${selectedEvent?.title || ''}`} footer={<div style={{display:'flex', gap:'8px', width:'100%', justifyContent:'flex-end'}}><Button variant="outline" onClick={() => setParticipateOpen(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={confirmParticipate} disabled={isSubmitting} style={{backgroundColor: '#52a447'}}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Sending...</> : 'Confirm'}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Select Role</label>
            <Select value={participateRole} onChange={e => setParticipateRole(e.target.value)} disabled={isSubmitting}>
              <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Coordinator">Coordinator</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceDashboard;