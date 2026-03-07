import { useState } from 'react';
import { Wallet } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import StatCard from '@/components/StatCard.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { funds as initialFunds } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Funds.module.css';

const emptyForm = { memberName: '', class: '', amount: '', status: '' };

const Funds = () => {
  const [fundList, setFundList] = useState(initialFunds);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();
  const totalCollected = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.memberName || !form.amount || !form.status) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const newFund = { id: String(Date.now()), memberName: form.memberName, class: form.class, amount: Number(form.amount), status: form.status, date: new Date().toISOString().split('T')[0] };
    setFundList(prev => [...prev, newFund]);
    toast({ title: 'Fund Record Added' });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <PageHeader title="Fund Management" description="Track and manage fund collection" actionLabel="Add Fund Record" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div className={styles.summaryWrap}>
        <StatCard title="Total Funds Collected" value={`Rs ${totalCollected.toLocaleString()}`} icon={Wallet}
          description={`${fundList.filter(f => f.status === 'Paid').length} of ${fundList.length} members paid`} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member Name</th>
              <th className={styles.hideSmall}>Class</th>
              <th>Amount</th>
              <th>Status</th>
              <th className={styles.hideMd}>Date</th>
            </tr>
          </thead>
          <tbody>
            {fundList.map(f => (
              <tr key={f.id}>
                <td className={styles.bold}>{f.memberName}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>{f.class}</td>
                <td>Rs {f.amount.toLocaleString()}</td>
                <td><Badge variant={f.status === 'Paid' ? 'default' : 'destructive'}>{f.status}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Fund Record"
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input placeholder="Enter member name" value={form.memberName} onChange={e => setField('memberName', e.target.value)} /></div>
          <div className={styles.field}><label>Class</label><Input placeholder="e.g. BSCS-6A" value={form.class} onChange={e => setField('class', e.target.value)} /></div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" placeholder="5000" value={form.amount} onChange={e => setField('amount', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Payment Status *</label>
            <Select value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="">Select</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Funds;
