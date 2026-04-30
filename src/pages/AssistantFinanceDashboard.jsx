import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, Wallet, Receipt, DollarSign, Plus, Eye, Loader2
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; 
import styles from './AssistantFinanceDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssistantFinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); 

  const [activeTab, setActiveTab] = useState('add-fund');
  
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });

  useEffect(() => {
    const fetchFinanceData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [fundRes, expRes, notifRes] = await Promise.all([
          fetch(`${API_URL}/fund-collections/records`, { headers }),
          fetch(`${API_URL}/expenses/records`, { headers }),
          fetch(`${API_URL}/notifications/all`, { headers })
        ]);

        if (fundRes.ok) setFundList(await fundRes.json());
        if (expRes.ok) setExpenseList(await expRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        toast({ title: 'Connection Error', description: 'Failed to load live treasury data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [currentUser, toast]);

  const unreadNotifs = notifs.filter(n => !n.read).length;
  const totalFunds = fundList.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const paidFunds = fundList.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const handleAddFund = async () => {
    if (!fundForm.memberName.trim() || !fundForm.amount) { 
      toast({ title: 'Validation Error', description: 'Member Name and Amount are required.', variant: 'destructive' }); 
      return; 
    }

    setIsSubmitting(true);
    const payload = {
      studentName: fundForm.memberName.trim(),
      department: fundForm.class.trim() || 'N/A', 
      rollNo: 'N/A',
      semester: 'N/A',
      timing: 'N/A',
      amount: Number(fundForm.amount),
      status: fundForm.status,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.fullName || 'Assistant Finance Head'
    };

    try {
      const res = await fetch(`${API_URL}/fund-collections/record`, {
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
        toast({ title: 'Success', description: 'Fund entry successfully added to the Treasury.' });
        setFundDialog(false);
        setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not save the entry.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <div className={styles.headerTitle}>Assistant Finance Head</div>
              <div className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.roleBadge}>AFH Access</Badge>
            <Button size="sm" variant="ghost" onClick={() => navigate('/notifications')} className={styles.notifBtn}>
              <Bell size={18} /> 
              {unreadNotifs > 0 && <span className={styles.notifBadge}>{unreadNotifs}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}><LogOut size={16} style={{marginRight: '6px'}}/> Logout</Button>
          </div>
        </div>
      </header>

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
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spin} />
              <p>Syncing treasury database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'add-fund' && (
                <div className={styles.fadeEnter}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>Add Fund Entry</h2>
                      <p className={styles.roleDesc}>Record new incoming funds. These entries will be instantly visible to the Finance Head.</p>
                    </div>
                    <Button onClick={() => setFundDialog(true)}><Plus size={16} style={{ marginRight: '6px' }} /> New Entry</Button>
                  </div>

                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <div className={styles.statIconWrap} style={{background: '#eff6ff', color: '#3b82f6'}}>
                        <Wallet size={24} />
                      </div>
                      <div className={styles.statInfo}>
                        <div className={styles.statLabel}>Total Tracked Funds</div>
                        <div className={styles.statVal}>Rs. {totalFunds.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statIconWrap} style={{background: '#ecfdf5', color: '#10b981'}}>
                        <DollarSign size={24} />
                      </div>
                      <div className={styles.statInfo}>
                        <div className={styles.statLabel}>Successfully Collected</div>
                        <div className={styles.statVal}>Rs. {paidFunds.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className={styles.statCard}>
                      <div className={styles.statIconWrap} style={{background: '#fef2f2', color: '#ef4444'}}>
                        <Receipt size={24} />
                      </div>
                      <div className={styles.statInfo}>
                        <div className={styles.statLabel}>Unpaid / Pending</div>
                        <div className={styles.statVal}>{fundList.filter(f => f.status === 'Unpaid' || f.status === 'Pending').length} Entries</div>
                      </div>
                    </div>
                  </div>

                  <h3 className={styles.subTitle}>Recent Entries</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {fundList.slice(0, 5).map(f => (
                          <tr key={f._id || f.id}>
                            <td className={styles.bold}>{f.studentName || f.memberName}</td>
                            <td>{f.department || f.class}</td>
                            <td className={styles.bold} style={{ color: '#10b981' }}>Rs. {f.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                            <td><Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Pending' ? 'warning' : 'destructive'}>{f.status}</Badge></td>
                          </tr>
                        ))}
                        {fundList.length === 0 && <tr><td colSpan={5} className={styles.empty}>No funds recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'records' && (
                <div className={styles.fadeEnter}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionTitle}>Financial Records</h2>
                      <p className={styles.roleDesc}>Comprehensive view of all society funds and expenses. (Read-Only access for Assistant Role)</p>
                    </div>
                  </div>

                  <h3 className={styles.subTitle}>Fund Records ({fundList.length})</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th><th>Logged By</th></tr></thead>
                      <tbody>
                        {fundList.map(f => (
                          <tr key={f._id || f.id}>
                            <td className={styles.bold}>{f.studentName || f.memberName}</td>
                            <td>{f.department || f.class}</td>
                            <td className={styles.bold} style={{ color: '#10b981' }}>Rs. {f.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                            <td><Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Pending' ? 'warning' : 'destructive'}>{f.status}</Badge></td>
                            <td className={styles.muted}>{f.uploadedBy || 'System'}</td>
                          </tr>
                        ))}
                        {fundList.length === 0 && <tr><td colSpan={6} className={styles.empty}>No funds recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  <h3 className={styles.subTitle} style={{ marginTop: '40px' }}>Expense Records ({expenseList.length})</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead><tr><th>Expense Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                      <tbody>
                        {expenseList.map(e => (
                          <tr key={e._id || e.id}>
                            <td className={styles.bold}>{e.title}</td>
                            <td><Badge variant="outline">{e.category}</Badge></td>
                            <td className={styles.bold} style={{ color: '#ef4444' }}>- Rs. {e.amount?.toLocaleString()}</td>
                            <td className={styles.muted}>{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {expenseList.length === 0 && <tr><td colSpan={4} className={styles.empty}>No expenses recorded yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal open={fundDialog} onClose={() => !isSubmitting && setFundDialog(false)} title="New Fund Entry"
        footer={
          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%'}}>
            <Button variant="outline" onClick={() => setFundDialog(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleAddFund} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Saving...</> : 'Save Entry'}
            </Button>
          </div>
        }>
        <div className={styles.formFields}>
          <div className={styles.field}>
            <label>Member Name <span style={{color: 'red'}}>*</span></label>
            <Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} placeholder="E.g., Ali Khan" disabled={isSubmitting} />
          </div>
          <div className={styles.field}>
            <label>Department/Class</label>
            <Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="E.g., BSCS-6A" disabled={isSubmitting} />
          </div>
          <div className={styles.field}>
            <label>Amount (Rs) <span style={{color: 'red'}}>*</span></label>
            <Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" disabled={isSubmitting} />
          </div>
          <div className={styles.field}>
            <label>Payment Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))} disabled={isSubmitting}>
              <option value="Paid">Paid (Received)</option>
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