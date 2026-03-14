import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Wallet, Receipt, CalendarDays, BarChart3, Award, MessageSquare, LogOut, Plus, Upload, Users, Star, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import StatCard from '../components/StatCard.jsx';
import { funds as initialFunds, expenses as initialExpenses, events, eventParticipants, eventFeedbacks, chartData } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './FinanceDashboard.module.css';

const currentUser = { id: '3', name: 'Hassan Raza', email: 'hassan..society.edu', class: 'BSCS-6A', role: 'Finance Head' };

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [fundList, setFundList] = useState(initialFunds);
  const [expenseList, setExpenseList] = useState(initialExpenses);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });
  const [expenseForm, setExpenseForm] = useState({ title: '', category: '', amount: '', date: '' });
  const [participations] = useState(eventParticipants.filter(p => p.memberId === currentUser.id));
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [feedbacks, setFeedbacks] = useState(eventFeedbacks);
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateRole, setParticipateRole] = useState('Volunteer');
  const [myParticipations, setMyParticipations] = useState(eventParticipants.filter(p => p.memberId === currentUser.id));

  const totalFunds = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);
  const balance = totalFunds - totalExpenses;

  const handleAddFund = () => {
    if (!fundForm.memberName || !fundForm.amount) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    setFundList(prev => [...prev, { id: String(Date.now()), ...fundForm, amount: Number(fundForm.amount), date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Fund record added' });
    setFundDialogOpen(false);
    setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
  };

  const handleUpdateStatus = (fund, newStatus) => {
    setFundList(prev => prev.map(f => f.id === fund.id ? { ...f, status: newStatus } : f));
    toast({ title: `Status updated to ${newStatus}` });
  };

  const handleAddExpense = () => {
    if (!expenseForm.title || !expenseForm.amount) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    setExpenseList(prev => [...prev, { id: String(Date.now()), ...expenseForm, amount: Number(expenseForm.amount), date: expenseForm.date || new Date().toISOString().split('T')[0], receipt: '' }]);
    toast({ title: 'Expense added' });
    setExpenseDialogOpen(false);
    setExpenseForm({ title: '', category: '', amount: '', date: '' });
  };

  const handleParticipate = (event) => {
    if (myParticipations.find(p => p.eventId === event.id)) {
      toast({ title: 'Already registered', variant: 'destructive' });
      return;
    }
    setSelectedEvent(event);
    setParticipateOpen(true);
  };

  const confirmParticipate = () => {
    setMyParticipations(prev => [...prev, { id: String(Date.now()), eventId: selectedEvent.id, memberId: currentUser.id, memberName: currentUser.name, role: participateRole, teamwork: 0, communication: 0, responsibility: 0, totalScore: 0 }]);
    toast({ title: `Joined "${selectedEvent.title}" as ${participateRole}` });
    setParticipateOpen(false);
  };

  const myPerformance = myParticipations.map(p => {
    const event = events.find(e => e.id === p.eventId);
    return { ...p, eventTitle: event?.title || 'Unknown', eventDate: event?.date || '' };
  });

  const submitFeedback = () => {
    if (!feedbackForm.comment) { toast({ title: 'Please write feedback', variant: 'destructive' }); return; }
    setFeedbacks(prev => [...prev, { id: String(Date.now()), eventId: selectedEvent.id, memberName: currentUser.name, rating: feedbackForm.rating, comment: feedbackForm.comment, date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Feedback submitted' });
    setFeedbackOpen(false);
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Wallet },
    { id: 'funds', label: 'Fund Records', icon: DollarSign },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');
  const completedEvents = events.filter(e => e.status === 'Completed');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Finance Dashboard</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">{currentUser.role}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogOut size={14} /> Logout</Button>
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
                <StatCard title="Balance" value={`Rs ${balance.toLocaleString()}`} icon={DollarSign} />
              </div>
              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Fund Collection Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData.fundCollection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="amount" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Expense Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.expenses}>
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
                  <thead><tr><th>Member</th><th>Class</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {fundList.map(f => (
                      <tr key={f.id}>
                        <td className={styles.bold}>{f.memberName}</td>
                        <td className={styles.muted}>{f.class}</td>
                        <td>Rs {f.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{f.date}</td>
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
                <h2 className={styles.sectionTitle}>Expenses</h2>
                <Button size="sm" onClick={() => setExpenseDialogOpen(true)}><Plus size={14} /> Add Expense</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Receipt</th></tr></thead>
                  <tbody>
                    {expenseList.map(e => (
                      <tr key={e.id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="secondary">{e.category}</Badge></td>
                        <td>Rs {e.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{e.date}</td>
                        <td>{e.receipt ? <Badge variant="default">Uploaded</Badge> : <span className={styles.muted}>None</span>}</td>
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
                  const joined = myParticipations.find(p => p.eventId === e.id);
                  return (
                    <div key={e.id} className={styles.eventCard}>
                      <div className={styles.eventTop}>
                        <Badge variant="default">{e.status}</Badge>
                        <span className={styles.eventDate}><CalendarDays size={12} /> {e.date}</span>
                      </div>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <p className={styles.eventBudget}>Budget: Rs {e.budget.toLocaleString()}</p>
                      {joined ? <Badge variant="secondary">Joined as {joined.role}</Badge> : (
                        <Button size="sm" onClick={() => handleParticipate(e)}><Users size={14} /> Participate</Button>
                      )}
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
                <StatCard title="Paid Members" value={fundList.filter(f => f.status === 'Paid').length} icon={Users} />
              </div>
              <div className={styles.chartGrid}>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Monthly Fund Collection</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData.fundCollection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="amount" stroke="var(--success)" fill="var(--success)" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.chartCard}>
                  <h3 className={styles.chartTitle}>Monthly Expenses</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData.expenses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                      <tr key={p.id}>
                        <td className={styles.bold}>{p.eventTitle}</td>
                        <td><Badge variant="secondary">{p.role}</Badge></td>
                        <td>{p.teamwork}/5</td><td>{p.communication}/5</td><td>{p.responsibility}/5</td>
                        <td className={styles.bold}>{p.totalScore}/15</td>
                      </tr>
                    ))}
                    {myPerformance.length === 0 && <tr><td colSpan={6} className={styles.empty}>No performance records yet</td></tr>}
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
                  const myFb = feedbacks.find(f => f.eventId === e.id && f.memberName === currentUser.name);
                  return (
                    <div key={e.id} className={styles.eventCard}>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <p className={styles.eventDate}>{e.date}</p>
                      {myFb ? (
                        <div className={styles.fbGiven}>
                          <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= myFb.rating ? 'var(--warning)' : 'none'} color={s <= myFb.rating ? 'var(--warning)' : 'var(--text-light)'} />)}</div>
                          <p className={styles.muted}>{myFb.comment}</p>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedEvent(e); setFeedbackForm({ rating: 5, comment: '' }); setFeedbackOpen(true); }}>
                          <MessageSquare size={14} /> Give Feedback
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fund Dialog */}
      <Modal open={fundDialogOpen} onClose={() => setFundDialogOpen(false)} title="Add Fund Record"
        footer={<><Button variant="outline" onClick={() => setFundDialogOpen(false)}>Cancel</Button><Button onClick={handleAddFund}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} placeholder="Enter name" /></div>
          <div className={styles.field}><label>Class</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BSCS-6A" /></div>
          <div className={styles.field}><label>Amount *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Expense Dialog */}
      <Modal open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)} title="Add Expense"
        footer={<><Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancel</Button><Button onClick={handleAddExpense}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} placeholder="Expense title" /></div>
          <div className={styles.field}><label>Category</label>
            <Select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Select category</option><option value="Events">Events</option><option value="Marketing">Marketing</option><option value="Equipment">Equipment</option><option value="Stationery">Stationery</option><option value="Gifts">Gifts</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Amount *</label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
          <div className={styles.field}><label>Date</label><Input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div className={styles.field}><label>Upload Receipt</label><input type="file" accept="image/*,.pdf" /></div>
        </div>
      </Modal>

      {/* Participate Dialog */}
      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title="Join Event"
        footer={<><Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button><Button onClick={confirmParticipate}>Confirm</Button></>}>
        {selectedEvent && (
          <div className={styles.formFields}>
            <p className={styles.muted}>Joining: <strong>{selectedEvent.title}</strong></p>
            <div className={styles.field}><label>Select Role</label>
              <Select value={participateRole} onChange={e => setParticipateRole(e.target.value)}>
                <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Coordinator">Coordinator</option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Dialog */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Event Feedback"
        footer={<><Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button><Button onClick={submitFeedback}>Submit</Button></>}>
        {selectedEvent && (
          <div className={styles.formFields}>
            <p className={styles.muted}>Feedback for: <strong>{selectedEvent.title}</strong></p>
            <div className={styles.field}><label>Rating</label>
              <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setFeedbackForm(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
                  <Star size={28} fill={s <= feedbackForm.rating ? 'var(--warning)' : 'none'} color={s <= feedbackForm.rating ? 'var(--warning)' : 'var(--text-light)'} />
                </button>
              ))}</div>
            </div>
            <div className={styles.field}><label>Your Feedback *</label>
              <Textarea placeholder="Share your experience..." rows={4} value={feedbackForm.comment} onChange={e => setFeedbackForm(p => ({ ...p, comment: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinanceDashboard;