import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, Wallet, Receipt, TrendingUp,
  DollarSign, Plus, Eye
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { funds as initialFunds, expenses, notifications } from '@/data/mockData.js';
import styles from './AssistantFinanceDashboard.module.css';

const AssistantFinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('add-fund');
  const [fundList, setFundList] = useState(initialFunds);
  const [notifs] = useState(notifications);
  const [fundDialog, setFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({ memberName: '', class: '', amount: '', status: 'Paid' });
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadNotifs = notifs.filter(n => !n.read).length;
  const totalFunds = fundList.reduce((s, f) => s + f.amount, 0);
  const paidFunds = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAddFund = () => {
    if (!fundForm.memberName || !fundForm.amount) { toast({ title: 'Fill required fields', variant: 'destructive' }); return; }
    setFundList(prev => [...prev, { id: String(Date.now()), memberName: fundForm.memberName, class: fundForm.class, amount: Number(fundForm.amount), status: fundForm.status, date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Fund entry added' });
    setFundDialog(false);
    setFundForm({ memberName: '', class: '', amount: '', status: 'Paid' });
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
              <div className={styles.headerSub}>Data entry & assist Finance Head — No final approval</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">AFH</Badge>
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
          {activeTab === 'add-fund' && (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Add Fund Entry</h2>
                <Button size="sm" onClick={() => setFundDialog(true)}><Plus size={14} /> New Entry</Button>
              </div>
              <p className={styles.roleDesc}>Enter fund collection records. The Finance Head will handle final approvals and status changes.</p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <Wallet size={20} className={styles.statIconBlue} />
                  <div className={styles.statVal}>Rs. {totalFunds.toLocaleString()}</div>
                  <div className={styles.statLabel}>Total Funds</div>
                </div>
                <div className={styles.statCard}>
                  <DollarSign size={20} className={styles.statIconGreen} />
                  <div className={styles.statVal}>Rs. {paidFunds.toLocaleString()}</div>
                  <div className={styles.statLabel}>Collected</div>
                </div>
                <div className={styles.statCard}>
                  <Receipt size={20} className={styles.statIconRed} />
                  <div className={styles.statVal}>{fundList.filter(f => f.status === 'Unpaid').length}</div>
                  <div className={styles.statLabel}>Unpaid Entries</div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Recent Entries</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member</th><th>Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {fundList.slice(-5).reverse().map(f => (
                      <tr key={f.id}>
                        <td className={styles.bold}>{f.memberName}</td>
                        <td>{f.class}</td>
                        <td>Rs. {f.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{f.date}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'default' : 'secondary'}>{f.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'records' && (
            <>
              <h2 className={styles.sectionTitle}>All Financial Records</h2>
              <p className={styles.roleDesc}>View fund and expense records. Contact the Finance Head to make changes or approvals.</p>

              <h3 className={styles.subTitle}>Fund Records ({fundList.length} total)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Member</th><th>Class</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {fundList.map(f => (
                      <tr key={f.id}>
                        <td className={styles.bold}>{f.memberName}</td>
                        <td>{f.class}</td>
                        <td>Rs. {f.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{f.date}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'default' : 'secondary'}>{f.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className={styles.subTitle} style={{ marginTop: 24 }}>Expense Records ({expenses.length} total)</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td className={styles.bold}>{e.title}</td>
                        <td><Badge variant="outline">{e.category}</Badge></td>
                        <td>Rs. {e.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{e.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Fund Modal */}
      <Modal open={fundDialog} onClose={() => setFundDialog(false)} title="Add Fund Entry"
        footer={<><Button variant="outline" onClick={() => setFundDialog(false)}>Cancel</Button><Button onClick={handleAddFund}>Save Entry</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input value={fundForm.memberName} onChange={e => setFundForm(p => ({ ...p, memberName: e.target.value }))} placeholder="Student name" /></div>
          <div className={styles.field}><label>Class</label><Input value={fundForm.class} onChange={e => setFundForm(p => ({ ...p, class: e.target.value }))} placeholder="e.g. BSCS-6A" /></div>
          <div className={styles.field}><label>Amount *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} placeholder="Enter amount" /></div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssistantFinanceDashboard;
