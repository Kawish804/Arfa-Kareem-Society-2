import { useState } from 'react';
import { Check, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { requests as initialRequests } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Requests.module.css';

const emptyForm = { title: '', submittedBy: '', type: '' };

const Requests = () => {
  const [requestList, setRequestList] = useState(initialRequests);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();
  const statusVariant = (s) => s === 'Approved' ? 'success' : s === 'Rejected' ? 'destructive' : 'outline';

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleApprove = (r) => {
    setRequestList(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Approved' } : x));
    toast({ title: 'Approved', description: r.title });
  };

  const handleReject = (r) => {
    setRequestList(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Rejected' } : x));
    toast({ title: 'Rejected', description: r.title, variant: 'destructive' });
  };

  const handleSubmit = () => {
    if (!form.title || !form.submittedBy || !form.type) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    const newReq = { id: String(Date.now()), title: form.title, submittedBy: form.submittedBy, date: new Date().toISOString().split('T')[0], status: 'Pending', type: form.type };
    setRequestList(prev => [...prev, newReq]);
    toast({ title: 'Request Submitted' });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <PageHeader title="Requests & Approvals" description="Manage member requests and approvals" actionLabel="Submit Request" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Request Title</th>
              <th className={styles.hideSmall}>Submitted By</th>
              <th className={styles.hideMd}>Type</th>
              <th className={styles.hideMd}>Date</th>
              <th>Status</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestList.map(r => (
              <tr key={r.id}>
                <td className={styles.bold}>{r.title}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>{r.submittedBy}</td>
                <td className={styles.hideMd}><Badge variant="secondary">{r.type}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{r.date}</td>
                <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                <td className={styles.actionsCell}>
                  {r.status === 'Pending' ? (
                    <div className={styles.actionBtns}>
                      <Button size="sm" variant="outline" onClick={() => handleApprove(r)}>
                        <Check size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(r)}>
                        <X size={14} /> Reject
                      </Button>
                    </div>
                  ) : <span className={styles.muted}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Submit Request"
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Request Title *</label><Input placeholder="What do you need?" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div className={styles.field}><label>Your Name *</label><Input placeholder="Your full name" value={form.submittedBy} onChange={e => setField('submittedBy', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Type *</label>
            <Select value={form.type} onChange={e => setField('type', e.target.value)}>
              <option value="">Select type</option>
              <option value="Budget">Budget Approval</option>
              <option value="Event">Event Approval</option>
              <option value="Department">Department Support</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
