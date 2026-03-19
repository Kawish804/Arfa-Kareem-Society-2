import { useState, useEffect } from 'react';
import { Wallet, Trash2, Eye, FileText, X, Filter, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import StatCard from '@/components/StatCard.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx'; // We'll use this for consistency
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Expenses.module.css';

const emptyForm = { title: '', category: '', amount: '', date: '', receipt: null, receiptPreview: null };

const Expenses = () => {
  const [expenseList, setExpenseList] = useState([]);
  const [totalCollectedFunds, setTotalCollectedFunds] = useState(0); 
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [timeFilter, setTimeFilter] = useState('All');
  const { toast } = useToast();

  useEffect(() => {
    fetch('http://localhost:5000/api/expenses/records')
      .then(res => res.json())
      .then(data => setExpenseList(data))
      .catch(err => console.error("Error fetching expenses:", err));

    fetch('http://localhost:5000/api/fund-collections/records')
      .then(res => res.json())
      .then(data => {
        const collected = data.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
        setTotalCollectedFunds(collected);
      })
      .catch(err => console.error("Error fetching funds:", err));
  }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const getFilteredExpenses = () => {
    if (timeFilter === 'All') return expenseList;
    const today = new Date();
    return expenseList.filter(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      if (timeFilter === 'This Year') return recordDate.getFullYear() === today.getFullYear();
      if (timeFilter === 'This Month') return recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth();
      if (timeFilter === 'This Week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      }
      return true;
    });
  };

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const remaining = totalCollectedFunds - totalExpenses;

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' });
      return;
    }
    const headers = ['Title', 'Category', 'Amount (Rs)', 'Date', 'Receipt Status'];
    const csvRows = filteredExpenses.map(e => {
      const date = e.date ? new Date(e.date).toLocaleDateString() : 'N/A';
      const receiptStatus = (e.receiptData || e.receiptName) ? 'Attached' : 'No Receipt';
      return `"${e.title}","${e.category}",${e.amount || 0},"${date}","${receiptStatus}"`;
    });
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Society_Expenses_${timeFilter.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Export Successful', description: 'Your Excel file is downloading.' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, receipt: file, receiptPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.category) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const newExpense = { 
      title: form.title, 
      category: form.category, 
      amount: Number(form.amount), 
      date: form.date || new Date().toISOString().split('T')[0],
      receiptName: form.receipt ? form.receipt.name : null,
      receiptData: form.receiptPreview || null,
    };
    try {
      const res = await fetch('http://localhost:5000/api/expenses/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        const savedExpense = await res.json();
        setExpenseList(prev => [savedExpense, ...prev]);
        toast({ title: 'Expense Added' });
        setDialogOpen(false);
        setForm(emptyForm);
      }
    } catch (error) {
      toast({ title: 'Failed to add expense', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/expenses/record/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenseList(prev => prev.filter(x => x._id !== id));
        toast({ title: 'Expense Deleted', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Expense Management" description="Track and manage society expenses" actionLabel="Add Expense" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-muted)" style={{ marginRight: '4px' }} />
        {['All', 'This Week', 'This Month', 'This Year'].map(filterOption => (
          <Button key={filterOption} size="sm" variant={timeFilter === filterOption ? 'primary' : 'outline'} onClick={() => setTimeFilter(filterOption)}>{filterOption}</Button>
        ))}
      </div>

      <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title={`Total Expenses (${timeFilter})`} value={`Rs ${totalExpenses.toLocaleString()}`} icon={Wallet} />
        <StatCard title="Available Balance" value={`Rs ${remaining.toLocaleString()}`} icon={Wallet} description={`Based on Rs ${totalCollectedFunds.toLocaleString()} total funds collected`} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-main)', fontWeight: 600 }}>Expense Records</h3>
        <Button size="sm" variant="outline" onClick={exportToCSV}><Download size={14} style={{ marginRight: '6px' }} /> Export to Excel</Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th className={styles.hideSmall}>Category</th>
              <th className={styles.hideMd}>Date</th>
              <th>Receipt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e._id}>
                <td className={styles.bold}>{e.title}</td>
                <td className={styles.bold}>Rs {e.amount?.toLocaleString() || 0}</td>
                <td className={styles.hideSmall}><Badge variant="secondary">{e.category}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                <td>
                  {e.receiptData ? (
                    <button className={styles.viewReceiptBtn} onClick={() => setPreviewReceipt(e)}><Eye size={14} /> View</button>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </td>
                <td><Button variant="ghost" size="icon" onClick={() => handleDelete(e._id)}><Trash2 size={16} color="var(--destructive)" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIXED RECEIPT MODAL: Now uses the standard Modal component */}
      <Modal 
        open={!!previewReceipt} 
        onClose={() => setPreviewReceipt(null)} 
        title="Expense Receipt"
        footer={<Button variant="outline" onClick={() => setPreviewReceipt(null)}>Close</Button>}
      >
        {previewReceipt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>{previewReceipt.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Rs {previewReceipt.amount?.toLocaleString()} • {new Date(previewReceipt.date).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px', overflow: 'hidden' }}>
              {previewReceipt.receiptData?.startsWith('data:image') ? (
                <img src={previewReceipt.receiptData} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '4px' }} />
              ) : previewReceipt.receiptData?.startsWith('data:application/pdf') ? (
                <iframe src={previewReceipt.receiptData} style={{ width: '100%', height: '450px', border: 'none' }} title="Receipt PDF" />
              ) : (
                <p className={styles.muted}>No preview available</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Expense Modal */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Expense" footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input placeholder="Expense title" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Category *</label>
            <Select value={form.category} onChange={e => setField('category', e.target.value)}>
              <option value="">Select</option><option value="Events">Events</option><option value="Marketing">Marketing</option><option value="Equipment">Equipment</option><option value="Stationery">Stationery</option><option value="Gifts">Gifts</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" placeholder="0" value={form.amount} onChange={e => setField('amount', e.target.value)} /></div>
          <div className={styles.field}><label>Date</label><Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Upload Receipt</label>
            <div className={styles.uploadWrap} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="file" accept="image/*,.pdf" id="expenseReceiptUpload" className={styles.fileInput} onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="expenseReceiptUpload" className={styles.uploadBtn} style={{ cursor: 'pointer', padding: '8px 12px', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center', color: 'var(--primary)' }}>
                {form.receipt ? form.receipt.name : '+ Choose file...'}
              </label>
              {form.receiptPreview && form.receiptPreview.startsWith('data:image') && (
                <img src={form.receiptPreview} alt="Preview" style={{ maxHeight: '100px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border)' }} />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;