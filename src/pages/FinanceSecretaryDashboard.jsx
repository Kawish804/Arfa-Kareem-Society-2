import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Wallet, Receipt, TrendingUp, TrendingDown, 
  Bell, LogOut, Plus, Send, PieChart, DollarSign, 
  CreditCard, Image as ImageIcon, Trash2, Eye, MessageSquare, Loader2 
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './FinanceSecretaryDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FinanceSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // LIVE DATABASE STATES
  const [fundList, setFundList] = useState([]); 
  const [expenseList, setExpenseList] = useState([]); 
  const [societyStudents, setSocietyStudents] = useState([]);
  const [monthlyFee, setMonthlyFee] = useState(500);

  const [notifs, setNotifs] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DIALOGS
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', category: '', amount: '', receiptName: '', receiptData: '' });
  const [previewReceipt, setPreviewReceipt] = useState(null); 

  useEffect(() => {
    const fetchFinanceData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [expRes, fundRes, stuRes, feeRes, notifRes, chatRes] = await Promise.all([
          fetch(`${API_URL}/expenses/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/fund-collections/records`, { headers }).catch(() => null),
          fetch(`${API_URL}/students/all`, { headers }).catch(() => fetch(`${API_URL}/students`, { headers }).catch(() => null)),
          fetch(`${API_URL}/settings/fee`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => null)
        ]);

        if (expRes?.ok) setExpenseList(await expRes.json());
        if (fundRes?.ok) setFundList(await fundRes.json());
        if (stuRes?.ok) setSocietyStudents(await stuRes.json());
        if (feeRes?.ok) setMonthlyFee((await feeRes.json()).fee);
        
        if (notifRes?.ok) {
          const fetchedNotifs = await notifRes.json();
          setNotifs(fetchedNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }

        if (chatRes?.ok) {
          const msgs = await chatRes.json();
          const myId = currentUser?._id || currentUser?.id;
          setUnreadChatCount(msgs.filter(m => !m.read && m.receiver === myId).length);
        }
      } catch (error) {
        toast({ title: 'Connection Error', description: 'Failed to synchronize data.', variant: 'destructive' });
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
      amount: monthlyFee + (s.arrears || 0), status: s.fundStatus, uploadedBy: 'CR Sync'
    }));

  const allPendingRecords = [...manualUnpaid, ...activeStudentDebts];
  
  const totalFunds = paidTransactions.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalFunds - totalExpenses;
  const pendingFunds = allPendingRecords.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const unreadNotifs = notifs.filter(n => !n.read).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please upload an image under 2MB', variant: 'destructive' });
        return;
      }
      const base64 = await convertToBase64(file);
      setExpenseForm(prev => ({ ...prev, receiptName: file.name, receiptData: base64 }));
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title.trim() || !expenseForm.amount) { 
      toast({ title: 'Validation Error', description: 'Fill required fields', variant: 'destructive' }); 
      return; 
    }

    if (Number(expenseForm.amount) > balance) {
      toast({ title: 'Insufficient Funds', description: `Treasury only has Rs ${balance.toLocaleString()} available.`, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const newExpenseData = {
      title: expenseForm.title.trim(),
      category: expenseForm.category || 'General',
      amount: Number(expenseForm.amount),
      date: new Date().toISOString().split('T')[0],
      receiptName: expenseForm.receiptName || null,
      receiptData: expenseForm.receiptData || null
    };

    try {
      const res = await fetch(`${API_URL}/expenses/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(newExpenseData)
      });

      if (res.ok) {
        const savedExpense = await res.json();
        setExpenseList(prev => [savedExpense, ...prev]);
        toast({ title: 'Expense Recorded', description: `Rs ${newExpenseData.amount.toLocaleString()} deducted.` });
        setExpenseDialog(false);
        setExpenseForm({ title: '', category: '', amount: '', receiptName: '', receiptData: '' });
      } else {
        throw new Error('Failed');
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not save expense.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id, amount) => {
    if (!window.confirm(`Are you sure? Rs ${amount.toLocaleString()} will be refunded to the treasury.`)) return;

    try {
      const res = await fetch(`${API_URL}/expenses/record/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.ok) {
        setExpenseList(prev => prev.filter(e => e._id !== id));
        toast({ title: 'Success', description: 'Expense deleted and funds refunded.' });
      } else throw new Error();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete expense.', variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'funds', label: 'Fund Records', icon: Wallet },
    { id: 'expenses', label: 'Expenses (Live)', icon: Receipt },
  ];

  const expenseByCategory = expenseList.reduce((acc, e) => { 
    acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0); return acc; 
  }, {});

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Treasury...</h2>
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
              <h1 className={styles.headerTitle}>Finance Secretary</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>Secretary Access</Badge>
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
              <t.icon size={16} style={{marginRight: '6px'}} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Financial Overview</h2>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><TrendingUp size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Collected</span>
                    <span className={styles.statValue}>Rs {totalFunds.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                  <div className={styles.statIcon}><TrendingDown size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Expenses</span>
                    <span className={styles.statValue}>Rs {totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><DollarSign size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Current Balance</span>
                    <span className={styles.statValue}>Rs {balance.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}><CreditCard size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Expected / Arrears</span>
                    <span className={styles.statValue}>Rs {pendingFunds.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <h3 className={styles.cardTitle}>Expense Breakdown</h3>
                  <div className={styles.breakdownList}>
                    {Object.entries(expenseByCategory).length > 0 ? Object.entries(expenseByCategory).map(([cat, amt]) => (
                      <div key={cat} className={styles.breakdownRow}>
                        <span className={styles.breakdownLabel}>{cat}</span>
                        <span className={styles.breakdownValue}>Rs {amt.toLocaleString()}</span>
                        <div className={styles.breakdownBar}>
                          <div className={styles.breakdownFill} style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                        </div>
                      </div>
                    )) : <p className={styles.mutedInfo}>No expenses recorded yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>All Fund Records</h2>
                <p className={styles.sectionDesc}>View all funds collected by Class Representatives and Admin.</p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Student Name</th><th>Amount</th><th>Status</th><th>Date</th><th>Collected By</th></tr></thead>
                  <tbody>
                    {fundList.length > 0 ? fundList.map(f => (
                      <tr key={f._id}>
                        <td className={styles.bold}>
                          {f.studentName}
                          <div className={styles.mutedInfo} style={{ marginTop: '4px' }}>{f.department} {f.rollNo ? `(${f.rollNo})` : ''}</div>
                        </td>
                        <td className={styles.amountText}>Rs {f.amount?.toLocaleString() || 0}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'success' : f.status === 'Pending' ? 'warning' : 'destructive'}>{f.status}</Badge></td>
                        <td className={styles.mutedInfo}>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</td>
                        <td><Badge variant="outline">{f.uploadedBy || 'System'}</Badge></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className={styles.emptyTable}>No fund records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>Expense Records</h2>
                <Button onClick={() => setExpenseDialog(true)} style={{backgroundColor: '#52a447'}}><Plus size={16} style={{ marginRight: '6px' }}/> Add Expense</Button>
              </div>
              
              <div className={styles.overdraftBanner}>
                <strong>Available Treasury Balance:</strong> Rs {balance.toLocaleString()}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Receipt</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {expenseList.length > 0 ? expenseList.map(e => (
                      <tr key={e._id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="outline">{e.category}</Badge></td>
                        <td className={styles.bold} style={{ color: '#ef4444' }}>- Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.mutedInfo}>{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                        <td>
                          {e.receiptData ? (
                            <button className={styles.viewReceiptBtn} onClick={() => setPreviewReceipt({ name: e.receiptName, data: e.receiptData })}>
                              <Eye size={14} /> View File
                            </button>
                          ) : <span className={styles.mutedInfo}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e._id, e.amount)} className={styles.deleteBtn}>
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan={6} className={styles.emptyTable}>No expenses recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={expenseDialog} onClose={() => !isSubmitting && setExpenseDialog(false)} title="Record Expense"
        footer={<div style={{display:'flex', gap:'8px', width:'100%', justifyContent:'flex-end'}}><Button variant="outline" onClick={() => setExpenseDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddExpense} disabled={isSubmitting} style={{backgroundColor: '#52a447'}}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Record Expense</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title <span style={{color:'red'}}>*</span></label><Input value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Venue Booking" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Category</label><Select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} disabled={isSubmitting}>
            <option value="">Select category</option><option value="Event">Event</option><option value="Supplies">Supplies</option><option value="Transportation">Transportation</option><option value="Food">Food</option><option value="Marketing">Marketing</option><option value="Other">Other</option>
          </Select></div>
          <div className={styles.field}><label>Amount (Rs) <span style={{color:'red'}}>*</span></label><Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 5000" disabled={isSubmitting} /></div>
          <div className={styles.field}>
            <label>Upload Receipt (Optional)</label>
            <div className={styles.uploadWrap}>
              <input type="file" accept="image/*" id="expReceipt" className={styles.fileInput} onChange={handleFileUpload} disabled={isSubmitting} />
              <label htmlFor="expReceipt" className={`${styles.uploadBtn} ${isSubmitting ? styles.disabled : ''}`}>
                {expenseForm.receiptData ? 'Image Attached ✓' : 'Choose an image file...'}
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {previewReceipt && (
        <div className={styles.receiptOverlay} onClick={() => setPreviewReceipt(null)}>
          <div className={styles.receiptModal} onClick={e => e.stopPropagation()}>
            <div className={styles.receiptHeader}>
              <h3 className={styles.receiptTitle}>{previewReceipt.name || 'Expense Receipt'}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewReceipt(null)}><X size={18}/></Button>
            </div>
            <div className={styles.receiptBody}>
              <img src={previewReceipt.data} alt="Receipt" className={styles.receiptImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceSecretaryDashboard;