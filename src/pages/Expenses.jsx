import { useState } from 'react';
import { Wallet, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import StatCard from '@/components/StatCard.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { expenses as initialExpenses, dashboardStats } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Expenses.module.css';

const emptyForm = { title: '', category: '', amount: '', date: '' };

const Expenses = () => {
  const [expenseList, setExpenseList] = useState(initialExpenses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();
  const totalExpenses = expenseList.reduce((s, e) => s + e.amount, 0);
  const remaining = dashboardStats.totalFunds - totalExpenses;

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title || !form.amount || !form.category) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const newExpense = { id: String(Date.now()), title: form.title, category: form.category, amount: Number(form.amount), date: form.date || new Date().toISOString().split('T')[0], receipt: '' };
    setExpenseList(prev => [...prev, newExpense]);
    toast({ title: 'Expense Added' });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (e) => {
    setExpenseList(prev => prev.filter(x => x.id !== e.id));
    toast({ title: 'Expense Deleted', description: e.title, variant: 'destructive' });
  };

  return (
    <div>
      <PageHeader title="Expense Management" description="Track and manage expenses" actionLabel="Add Expense" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div className={styles.statsRow}>
        <StatCard title="Total Expenses" value={`Rs ${totalExpenses.toLocaleString()}`} icon={Wallet} />
        <StatCard title="Remaining Balance" value={`Rs ${remaining.toLocaleString()}`} icon={Wallet} description="Funds - Expenses" />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th className={styles.hideSmall}>Category</th>
              <th className={styles.hideMd}>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenseList.map(e => (
              <tr key={e.id}>
                <td className={styles.bold}>{e.title}</td>
                <td>Rs {e.amount.toLocaleString()}</td>
                <td className={styles.hideSmall}><Badge variant="secondary">{e.category}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{e.date}</td>
                <td>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e)}><Trash2 size={16} color="var(--destructive)" /></Button>
                </td>
              </tr>
            ))}
            {expenseList.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No expenses recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Expense"
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input placeholder="Expense title" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Category *</label>
            <Select value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">Select</option><option value="Events">Events</option><option value="Marketing">Marketing</option><option value="Equipment">Equipment</option><option value="Stationery">Stationery</option><option value="Gifts">Gifts</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" placeholder="0" value={form.amount} onChange={e => setField('amount', e.target.value)} /></div>
          <div className={styles.field}><label>Upload Receipt</label><Input type="file" /></div>
          <div className={styles.field}><label>Date</label><Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
