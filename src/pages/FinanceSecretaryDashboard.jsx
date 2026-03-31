import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Wallet, Receipt, TrendingUp, TrendingDown, 
  Bell, LogOut, Plus, Send, PieChart, FileText, DollarSign, 
  CreditCard, BarChart3, Image as ImageIcon, Trash2, Eye 
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { funds as initialFunds, notifications as initialNotifications } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './FinanceSecretaryDashboard.module.css';

const currentUser = { name: 'Ayesha Malik', role: 'Finance Secretary' };

const FinanceSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // --- STATE ---
  const [fundList, setFundList] = useState(initialFunds); // Still mock data for now
  const [expenseList, setExpenseList] = useState([]); // REAL DATA state
  const [notifs] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  // --- DIALOGS ---
  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });

  const [expenseDialog, setExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ 
    title: '', category: '', amount: '', receiptName: '', receiptData: '' 
  });
  const [previewReceipt, setPreviewReceipt] = useState(null); // For viewing uploaded receipts

  // --- FETCH EXPENSES FROM MONGODB ---
  const fetchExpenses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenseList(data);
      }
    } catch (error) {
      toast({ title: 'Failed to fetch expenses', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // --- CALCULATIONS ---
  const totalFunds = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);
  const balance = totalFunds - totalExpenses;
  const pendingFunds = fundList.filter(f => f.status === 'Unpaid').reduce((s, f) => s + f.amount, 0);

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
      // Check file size (e.g., limit to 2MB to prevent MongoDB document size limits)
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
      const res = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpenseData)
      });

      if (res.ok) {
        const savedExpense = await res.json();
        setExpenseList(prev => [savedExpense, ...prev]);
        toast({ title: 'Expense recorded successfully!' });
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
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenseList(prev => prev.filter(e => e._id !== id));
        toast({ title: 'Expense deleted' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete expense', variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: PieChart },
    { id: 'funds', label: 'Fund Records', icon: Wallet },
    { id: 'expenses', label: 'Expenses (Live)', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const expenseByCategory = expenseList.reduce((acc, e) => { 
    acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; 
  }, {});

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Finance Secretary</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Finance Secretary</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><Bell size={14} /></Button>
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
                    <span className={styles.statLabel}>Pending Dues</span>
                    <span className={styles.statValue}>Rs {pendingFunds.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                  <h3 className={styles.cardTitle}>Expense Breakdown</h3>
                  <div className={styles.breakdownList}>
                    {Object.entries(expenseByCategory).map(([cat, amt]) => (
                      <div key={cat} className={styles.breakdownRow}>
                        <span className={styles.breakdownLabel}>{cat}</span>
                        <span className={styles.breakdownValue}>Rs {amt.toLocaleString()}</span>
                        <div className={styles.breakdownBar}>
                          <div className={styles.breakdownFill} style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Expense Records (Live)</h2>
                <Button size="sm" onClick={() => setExpenseDialog(true)}><Plus size={14} /> Add Expense</Button>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseList.length > 0 ? expenseList.map(e => (
                      <tr key={e._id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="secondary">{e.category}</Badge></td>
                        <td>Rs {e.amount?.toLocaleString()}</td>
                        <td className={styles.muted}>{e.date || new Date(e.createdAt).toLocaleDateString()}</td>
                        <td>
                          {e.receiptData ? (
                            <Button variant="ghost" size="sm" onClick={() => setPreviewReceipt({ name: e.receiptName, data: e.receiptData })}>
                              <Eye size={16} color="var(--primary)" /> View
                            </Button>
                          ) : (
                            <span className={styles.muted}>No receipt</span>
                          )}
                        </td>
                        <td>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteExpense(e._id)}>
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={6} className={styles.empty}>No expenses recorded yet.</td></tr>
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
        footer={<><Button variant="outline" onClick={() => setExpenseDialog(false)}>Cancel</Button><Button onClick={handleAddExpense} disabled={loading}>{loading ? 'Saving...' : <><Send size={14} /> Save Expense</>}</Button></>}>
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