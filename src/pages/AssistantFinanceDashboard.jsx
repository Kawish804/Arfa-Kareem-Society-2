import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, Wallet, Receipt, DollarSign, Plus, Eye
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; 
import styles from './AssistantFinanceDashboard.module.css';

const AssistantFinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); // 🔴 Gets the live logged-in user

  const [activeTab, setActiveTab] = useState('add-fund');
  
  // 🔴 LIVE DATABASE STATES
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });

  // 🔴 FETCH LIVE DATA ON LOAD
  useEffect(() => {
    const fetchFinanceData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        // Fetch all three endpoints at the same time
        const [fundRes, expRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/fund-collections/records', { headers }),
          fetch('http://localhost:5000/api/expenses/records', { headers }),
          fetch('http://localhost:5000/api/notifications/all', { headers })
        ]);

        if (fundRes.ok) setFundList(await fundRes.json());
        if (expRes.ok) setExpenseList(await expRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          // Show general broadcast notifications or ones specifically for the Assistant
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        toast({ title: 'Failed to load live data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [currentUser, toast]);

  // 🔴 DYNAMIC CALCULATIONS
  const unreadNotifs = notifs.filter(n => !n.read).length;
  const totalFunds = fundList.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const paidFunds = fundList.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 🔴 POST NEW FUND ENTRY TO DATABASE
  const handleAddFund = async () => {
    if (!fundForm.memberName || !fundForm.amount) { 
      toast({ title: 'Fill required fields', variant: 'destructive' }); 
      return; 
    }

    const payload = {
      studentName: fundForm.memberName,
      department: fundForm.class || 'N/A', 
      rollNo: 'N/A',
      semester: 'N/A',
      timing: 'N/A',
      amount: Number(fundForm.amount),
      status: fundForm.status,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.fullName || 'Assistant Finance Head' // Tracks who entered it
    };

    try {
      const res = await fetch('http://localhost:5000/api/fund-collections/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedFund = await res.json();
        setFundList(prev => [savedFund, ...prev]); 
        toast({ title: 'Fund entry successfully added to Treasury' });
        setFundDialog(false);
        setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
      } else {
        toast({ title: 'Failed to save entry', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { key: 'add-fund', label: 'Add Fund Entry', icon: Plus },
    { key: 'records', label: 'View Records', icon: Eye },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <div className={styles.headerTitle}>Assistant Finance Head</div>
              <div className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Assistant'} — Data entry & assist Finance Head</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">AFH</Badge>
            <Button size="sm" variant="outline" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={16} /> 
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{unreadNotifs}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}><LogOut size={16} /> Logout</Button>
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
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading live treasury data...</p>
          ) : (
            <>
              {/* --- ADD FUND TAB --- */}
              {activeTab === 'add-fund' && (
                <>
                  <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className={styles.sectionTitle}>Add Fund Entry</h2>
                    <Button size="sm" onClick={() => setFundDialog(true)}><Plus size={14} style={{ marginRight: '6px' }} /> New Entry</Button>
                  </div>
                  <p className={styles.roleDesc}>Enter fund collection records here. The Finance Head can see these instantly.</p>

                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <Wallet size={20} className={styles.statIconBlue} />
                      <div className={styles.statVal}>Rs. {totalFunds.toLocaleString()}</div>
                      <div className={styles.statLabel}>Total Tracked Funds</div>
                    </div>
                    <div className={styles.statCard}>
                      <DollarSign size={20} className={styles.statIconGreen} />
                      <div className={styles.statVal}>Rs. {paidFunds.toLocaleString()}</div>
                      <div className={styles.statLabel}>Successfully Collected</div>
                    </div>
                    <div className={styles.statCard}>
                      <Receipt size={20} className={styles.statIconRed} />
                      <div className={styles.statVal}>{fundList.filter(f => f.status === 'Unpaid' || f.status === 'Pending').length}</div>
                      <div className={styles.statLabel}>Unpaid / Pending Entries</div>
                    </div>
                  </div>

                  <h3 className={styles.subTitle} style={{ marginTop: '30px', marginBottom: '15px' }}>Recent Fund Entries</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {fundList.slice(0, 5).map(f => (
                          <tr key={f._id || f.id}>
                            <td className={styles.bold}>{f.studentName || f.memberName}</td>
                            <td>{f.department || f.class}</td>
                            <td className={styles.bold} style={{ color: 'var(--success)' }}>Rs. {f.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                            <td><Badge variant={f.status === 'Paid' ? 'default' : f.status === 'Pending' ? 'warning' : 'secondary'}>{f.status}</Badge></td>
                          </tr>
                        ))}
                        {fundList.length === 0 && <tr><td colSpan={5} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No funds recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* --- VIEW RECORDS TAB --- */}
              {activeTab === 'records' && (
                <>
                  <h2 className={styles.sectionTitle}>All Financial Records</h2>
                  <p className={styles.roleDesc}>View all fund and expense records. Contact the Finance Head to make deletions or major changes.</p>

                  <h3 className={styles.subTitle} style={{ marginTop: '20px', marginBottom: '15px' }}>Fund Records ({fundList.length} total)</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th><th>Logged By</th></tr></thead>
                      <tbody>
                        {fundList.map(f => (
                          <tr key={f._id || f.id}>
                            <td className={styles.bold}>{f.studentName || f.memberName}</td>
                            <td>{f.department || f.class}</td>
                            <td className={styles.bold} style={{ color: 'var(--success)' }}>Rs. {f.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                            <td><Badge variant={f.status === 'Paid' ? 'default' : f.status === 'Pending' ? 'warning' : 'secondary'}>{f.status}</Badge></td>
                            <td><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.uploadedBy || 'System'}</span></td>
                          </tr>
                        ))}
                        {fundList.length === 0 && <tr><td colSpan={6} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No funds recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <h3 className={styles.subTitle} style={{ marginTop: 32, marginBottom: '15px' }}>Expense Records ({expenseList.length} total)</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                      <tbody>
                        {expenseList.map(e => (
                          <tr key={e._id || e.id}>
                            <td className={styles.bold}>{e.title}</td>
                            <td><Badge variant="outline">{e.category}</Badge></td>
                            <td className={styles.bold} style={{ color: 'var(--destructive)' }}>- Rs. {e.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {expenseList.length === 0 && <tr><td colSpan={4} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No expenses recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Fund Modal */}
      <Modal open={fundDialog} onClose={() => setFundDialog(false)} title="Add Fund Entry"
        footer={<><Button variant="outline" onClick={() => setFundDialog(false)}>Cancel</Button><Button onClick={handleAddFund}>Save Entry</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} placeholder="Student name" /></div>
          <div className={styles.field}><label>Department/Class</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BSCS-6A" /></div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Unpaid">Unpaid</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssistantFinanceDashboard;