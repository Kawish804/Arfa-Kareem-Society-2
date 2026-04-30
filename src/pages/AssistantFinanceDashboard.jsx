import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Wallet, Receipt, DollarSign, Plus, Eye, Loader2,
  Bell, LogOut, MessageSquare, AlertCircle, Clock
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './AssistantFinanceDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssistantFinanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('add-fund');

  // LIVE DATABASE STATES
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [societyStudents, setSocietyStudents] = useState([]);
  const [monthlyFee, setMonthlyFee] = useState(500);

  const [notifs, setNotifs] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });

  useEffect(() => {
    const fetchFinanceData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [fundRes, expRes, stuRes, feeRes, notifRes, chatRes] = await Promise.all([
          fetch(`${API_URL}/fund-collections/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/expenses/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/students/all`, { headers }).catch(() => fetch(`${API_URL}/students`, { headers }).catch(() => null)),
          fetch(`${API_URL}/settings/fee`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => null)
        ]);

        if (fundRes?.ok) setFundList(await fundRes.json());
        if (expRes?.ok) setExpenseList(await expRes.json());
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
        toast({ title: 'Connection Error', description: 'Failed to load treasury data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [currentUser, toast]);

  // ENTERPRISE MASTER LEDGER MATH
  const paidTransactions = fundList.filter(f => f.status === 'Paid');
  const manualUnpaid = fundList.filter(f => f.status !== 'Paid');

  const activeStudentDebts = societyStudents
    .filter(s => s.fundStatus === 'Unpaid' || s.fundStatus === 'Pending')
    .map(s => ({
      _id: `debt_${s._id}`, studentName: s.fullName, department: s.department,
      amount: monthlyFee + (s.arrears || 0), status: s.fundStatus, uploadedBy: 'CR Sync', isDebt: true
    }));

  const allPendingRecords = [...manualUnpaid, ...activeStudentDebts];

  const totalFunds = paidTransactions.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const paidCount = paidTransactions.length;
  const pendingCount = allPendingRecords.length;

  const handleAddFund = async () => {
    if (!fundForm.memberName.trim() || !fundForm.amount) {
      toast({ title: 'Validation Error', description: 'Name and Amount required.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      studentName: fundForm.memberName.trim(),
      department: fundForm.class.trim() || 'N/A', rollNo: 'N/A', semester: 'N/A', timing: 'N/A',
      amount: Number(fundForm.amount), status: fundForm.status,
      date: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser?.fullName || 'Assistant Finance'
    };

    try {
      const res = await fetch(`${API_URL}/fund-collections/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedFund = await res.json();
        setFundList(prev => [savedFund, ...prev]);
        toast({ title: 'Success', description: 'Entry added to the Treasury.' });
        setFundDialog(false);
        setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
      } else throw new Error();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save the entry.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { key: 'add-fund', label: 'Add Fund Entry', icon: Plus },
    { key: 'records', label: 'Master Ledger', icon: Eye },
  ];

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Database...</h2>
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
              <h1 className={styles.headerTitle}>Assistant Finance Head</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>AFH Access</Badge>
            <TransferRoleWidget />

            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
              {unreadChatCount > 0 && <span className={styles.badgeAlert}>{unreadChatCount}</span>}
            </button>

            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {notifs.filter(n => !n.read).length > 0 && <span className={styles.badgeAlert}>{notifs.filter(n => !n.read).length}</span>}
            </button>

            <Button variant="outline" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.hideMobile} style={{ marginLeft: '6px' }}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} style={{ marginRight: '8px' }} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'add-fund' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Add Fund Entry</h2>
                  <p className={styles.sectionDesc}>Record new incoming funds to be sent to the Finance Head.</p>
                </div>
                <Button onClick={() => setFundDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> New Entry</Button>
              </div>

              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><DollarSign size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Successfully Collected</span>
                    <span className={styles.statValue}>Rs {totalFunds.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}><Clock size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Pending / Arrears</span>
                    <span className={styles.statValue}>{pendingCount} Records</span>
                  </div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Recent Entries</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {paidTransactions.slice(0, 5).map(f => (
                      <tr key={f._id}>
                        <td className={styles.bold}>{f.studentName}</td>
                        <td className={styles.mutedInfo}>{f.department}</td>
                        <td className={styles.amountText}>Rs {f.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{f.date ? new Date(f.date).toLocaleDateString() : 'N/A'}</td>
                        <td><Badge variant="success">{f.status}</Badge></td>
                      </tr>
                    ))}
                    {paidTransactions.length === 0 && <tr><td colSpan={5} className={styles.emptyTable}>No funds recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Master Ledger</h2>
                  <p className={styles.sectionDesc}>View all society funds and expenses. (Read-Only access)</p>
                </div>
              </div>

              <h3 className={styles.subTitle}>Fund Records ({fundList.length + activeStudentDebts.length})</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member</th><th>Dept/Class</th><th>Amount</th><th>Date</th><th>Status</th><th>Logged By</th></tr></thead>
                  <tbody>
                    {[...paidTransactions, ...allPendingRecords].map(f => (
                      <tr key={f._id} className={f.isDebt ? styles.rowDebt : ''}>
                        <td className={styles.bold}>{f.studentName}</td>
                        <td className={styles.mutedInfo}>{f.department}</td>
                        <td className={styles.amountText} style={{ color: f.isDebt ? '#ef4444' : '#52a447' }}>Rs {f.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{f.isDebt ? 'Outstanding' : new Date(f.date).toLocaleDateString()}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Pending' ? 'warning' : 'destructive'}>{f.status}</Badge></td>
                        <td><Badge variant="outline">{f.uploadedBy || 'System'}</Badge></td>
                      </tr>
                    ))}
                    {(fundList.length + activeStudentDebts.length) === 0 && <tr><td colSpan={6} className={styles.emptyTable}>No funds recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>

              <h3 className={styles.subTitle} style={{ marginTop: '40px' }}>Expense Records ({expenseList.length})</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Expense Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {expenseList.map(e => (
                      <tr key={e._id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="outline">{e.category}</Badge></td>
                        <td className={styles.bold} style={{ color: '#ef4444' }}>- Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {expenseList.length === 0 && <tr><td colSpan={4} className={styles.emptyTable}>No expenses recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD FUND MODAL */}
      <Modal open={fundDialog} onClose={() => !isSubmitting && setFundDialog(false)} title="New Fund Entry"
        footer={<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}><Button variant="outline" onClick={() => setFundDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddFund} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : 'Save Entry'}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name <span style={{ color: 'red' }}>*</span></label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} placeholder="E.g., Ali Khan" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Department/Class</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="E.g., BSCS-6A" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Amount (Rs) <span style={{ color: 'red' }}>*</span></label><Input type="number" value={fundForm.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Payment Status</label><Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))} disabled={isSubmitting}>
            <option value="Paid">Paid (Received)</option><option value="Pending">Pending</option><option value="Unpaid">Unpaid</option>
          </Select></div>
        </div>
      </Modal>
    </div>
  );
};

export default AssistantFinanceDashboard;