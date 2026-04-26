import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Wallet, Receipt, TrendingUp, TrendingDown, 
  Bell, LogOut, Plus, Send, PieChart, FileText, DollarSign, 
  CreditCard, Image as ImageIcon, Trash2, Eye 
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './FinanceSecretaryDashboard.module.css';

const FinanceSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth(); // 🔴 LIVE USER AUTH
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // --- 🔴 LIVE DATABASE STATES ---
  const [fundList, setFundList] = useState([]); 
  const [expenseList, setExpenseList] = useState([]); 
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- DIALOGS ---
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ 
    title: '', category: '', amount: '', receiptName: '', receiptData: '' 
  });
  const [previewReceipt, setPreviewReceipt] = useState(null); 

  // --- 🔴 FETCH REAL DATA FROM MONGODB ---
  useEffect(() => {
    const fetchFinanceData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        // Fetch Live Expenses
        const expRes = await fetch('http://localhost:5000/api/expenses/records', { headers });
        if (expRes.ok) setExpenseList(await expRes.json());

        // Fetch Live Funds (Collected by CRs and Admin)
        const fundRes = await fetch('http://localhost:5000/api/fund-collections/records', { headers });
        if (fundRes.ok) setFundList(await fundRes.json());

        // Fetch Notifications
        const notifRes = await fetch('http://localhost:5000/api/notifications', { headers });
        if (notifRes.ok) {
          const fetchedNotifs = await notifRes.json();
          // Filter out private notifications meant for others
          const validNotifs = fetchedNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName);
          setNotifs(validNotifs);
        }
      } catch (error) {
        console.error('Failed to fetch finance data:', error);
      }
    };

    fetchFinanceData();
  }, [currentUser]);

  // --- CALCULATIONS (Now using REAL Live Math) ---
  const totalFunds = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const balance = totalFunds - totalExpenses;
  // Summing up expected amounts from people who haven't paid or partially paid
  const pendingFunds = fundList.filter(f => f.status === 'Unpaid' || f.status === 'Pending').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const unreadNotifs = notifs.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- UTILITY: CONVERT IMAGE TO BASE64 ---
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

  // --- ADD REAL EXPENSE ---
  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) { 
      toast({ title: 'Fill required fields', variant: 'destructive' }); 
      return; 
    }

    if (Number(expenseForm.amount) > balance) {
      toast({ title: 'Insufficient Funds', description: `The treasury only has Rs ${balance.toLocaleString()} available.`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    const newExpenseData = {
      title: expenseForm.title,
      category: expenseForm.category || 'General',
      amount: Number(expenseForm.amount),
      date: new Date().toISOString().split('T')[0],
      receiptName: expenseForm.receiptName || null,
      receiptData: expenseForm.receiptData || null
    };

    try {
      const res = await fetch('http://localhost:5000/api/expenses/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(newExpenseData)
      });

      if (res.ok) {
        const savedExpense = await res.json();
        setExpenseList(prev => [savedExpense, ...prev]);
        toast({ title: 'Expense recorded successfully!', description: `Rs ${newExpenseData.amount.toLocaleString()} deducted from treasury.` });
        setExpenseDialog(false);
        setExpenseForm({ title: '', category: '', amount: '', receiptName: '', receiptData: '' });
      } else {
        toast({ title: 'Failed to save expense', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server connection failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE REAL EXPENSE ---
  const handleDeleteExpense = async (id, amount) => {
    if (!window.confirm(`Are you sure you want to delete this expense? Rs ${amount.toLocaleString()} will be refunded to the treasury.`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/expenses/record/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.ok) {
        setExpenseList(prev => prev.filter(e => e._id !== id));
        toast({ title: 'Expense deleted and funds refunded' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete expense', variant: 'destructive' });
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Finance Secretary</h1>
              <p className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Secretary'}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Finance Secretary</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={14} />
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold', border: '2px solid white' }}>{unreadNotifs}</span>}
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
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><TrendingUp size={20} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Collected</span>
                    <span className={styles.statValue}>Rs {totalFunds.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                  <div className={styles.statIcon}><TrendingDown size={20} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Expenses</span>
                    <span className={styles.statValue}>Rs {totalExpenses.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><DollarSign size={20} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Current Balance</span>
                    <span className={styles.statValue}>Rs {balance.toLocaleString()}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}><CreditCard size={20} /></div>
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
                    )) : <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No expenses recorded yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🔴 NEW: FUNDS TAB LOGIC TO SEE CR COLLECTIONS */}
          {activeTab === 'funds' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>All Fund Records</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>View all funds collected by Class Representatives and the President.</p>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Collected By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundList.length > 0 ? fundList.map(f => (
                      <tr key={f._id}>
                        <td className={styles.bold}>
                          {f.studentName}
                          <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{f.department} {f.rollNo ? `(${f.rollNo})` : ''}</div>
                        </td>
                        <td className={styles.bold}>Rs {f.amount?.toLocaleString() || 0}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'success' : 'warning'}>{f.status}</Badge></td>
                        <td className={styles.muted}>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</td>
                        <td><Badge variant="outline">{f.uploadedBy || 'System'}</Badge></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className={styles.empty} style={{ textAlign: 'center', padding: '30px' }}>No fund records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>Expense Records (Live)</h2>
                <Button size="sm" onClick={() => setExpenseDialog(true)}><Plus size={14} style={{ marginRight: '6px' }}/> Add Expense</Button>
              </div>
              
              {/* Overdraft Warning Banner */}
              <div style={{ padding: '10px 15px', backgroundColor: '#eff6ff', borderLeft: '4px solid var(--primary)', borderRadius: '6px', marginBottom: '15px', fontSize: '0.85rem' }}>
                <strong>Available Treasury Balance:</strong> Rs {balance.toLocaleString()}
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Receipt</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseList.length > 0 ? expenseList.map(e => (
                      <tr key={e._id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="secondary">{e.category}</Badge></td>
                        <td style={{ color: '#ef4444', fontWeight: 'bold' }}>- Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.muted}>{e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString()}</td>
                        <td>
                          {e.receiptData ? (
                            <Button variant="outline" size="sm" onClick={() => setPreviewReceipt({ name: e.receiptName, data: e.receiptData })}>
                              <Eye size={14} style={{ marginRight: '4px' }} /> View
                            </Button>
                          ) : (
                            <span className={styles.muted}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(e._id, e.amount)}>
                            <Trash2 size={16} color="var(--destructive)" />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className={styles.empty} style={{ textAlign: 'center', padding: '30px' }}>No expenses recorded yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD EXPENSE MODAL */}
      <Modal open={expenseDialog} onClose={() => setExpenseDialog(false)} title="Record Expense"
        footer={<><Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button><Button onClick={handleAddExpense} disabled={loading}>{loading ? 'Saving...' : <><Send size={14} style={{ marginRight: '6px' }} /> Record Expense</>}</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}>
            <label>Title *</label>
            <Input value={expenseForm.title} onChange={e => setExpenseForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Venue Booking" />
          </div>
          <div className={styles.field}>
            <label>Category</label>
            <Select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
              <option value="">Select category</option>
              <option value="Event">Event</option>
              <option value="Supplies">Supplies</option>
              <option value="Transportation">Transportation</option>
              <option value="Food">Food</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}>
            <label>Amount (Rs) *</label>
            <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 5000" />
          </div>
          <div className={styles.field}>
            <label>Upload Receipt (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Input type="file" accept="image/*" onChange={handleFileUpload} />
              {expenseForm.receiptData && <ImageIcon size={20} color="green" title="Receipt attached" />}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'gray', marginTop: '5px' }}>Max file size: 2MB (JPG/PNG)</p>
          </div>
        </div>
      </Modal>

      {/* RECEIPT PREVIEW MODAL */}
      <Modal open={!!previewReceipt} onClose={() => setPreviewReceipt(null)} title={`Receipt: ${previewReceipt?.name || 'Attached'}`}
        footer={<Button onClick={() => setPreviewReceipt(null)}>Close</Button>}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {previewReceipt?.data && <img src={previewReceipt.data} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />}
        </div>
      </Modal>

    </div>
  );
};

export default FinanceSecretaryDashboard;