import { useState } from 'react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { DollarSign, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import styles from './FundRequests.module.css';

const initialRequests = [
  { id: '1', name: 'Ali Hassan', email: 'ali@university.edu', amount: 5000, purpose: 'Event Sponsorship', description: 'Need funds for tech workshop supplies and refreshments.', date: '2024-01-15', status: 'Pending' },
  { id: '2', name: 'Sara Ahmed', email: 'sara@university.edu', amount: 3000, purpose: 'Project Materials', description: 'Requesting budget for final year project presentation materials.', date: '2024-01-14', status: 'Pending' },
  { id: '3', name: 'Usman Khan', email: 'usman@university.edu', amount: 8000, purpose: 'Competition Fee', description: 'Registration and travel for national coding competition.', date: '2024-01-13', status: 'Approved' },
  { id: '4', name: 'Fatima Noor', email: 'fatima@university.edu', amount: 2000, purpose: 'Study Resources', description: 'Books and online course subscription for skill development.', date: '2024-01-12', status: 'Rejected' },
];

const FundRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    totalAmount: requests.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0),
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const updateStatus = (id, status) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast({ title: `Request ${status}`, description: `Fund request has been ${status.toLowerCase()}.` });
  };

  return (
    <div>
      <PageHeader title="Fund Requests" subtitle="Manage fund appeals from students" />

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{stats.total}</div>
          <div className={styles.statLabel}>Total Requests</div>
        </div>
        <div className={`${styles.stat} ${styles.statPending}`}>
          <div className={styles.statNum}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={`${styles.stat} ${styles.statApproved}`}>
          <div className={styles.statNum}>{stats.approved}</div>
          <div className={styles.statLabel}>Approved</div>
        </div>
        <div className={`${styles.stat} ${styles.statRejected}`}>
          <div className={styles.statNum}>{stats.rejected}</div>
          <div className={styles.statLabel}>Rejected</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>Rs {stats.totalAmount.toLocaleString()}</div>
          <div className={styles.statLabel}>Approved Amount</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
          <Button key={s} size="sm" variant={filter === s ? 'primary' : 'outline'} onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th className={styles.hideMd}>Purpose</th>
              <th>Amount</th>
              <th className={styles.hideSmall}>Date</th>
              <th>Status</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>
                  <div className={styles.bold}>{r.name}</div>
                  <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{r.email}</div>
                </td>
                <td className={styles.hideMd}>{r.purpose}</td>
                <td className={styles.bold}>Rs {r.amount.toLocaleString()}</td>
                <td className={styles.hideSmall}>{r.date}</td>
                <td>
                  <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'warning'}>{r.status}</Badge>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionBtns}>
                    <Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye size={14} /></Button>
                    {r.status === 'Pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(r.id, 'Approved')}><CheckCircle size={14} /></Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'Rejected')}><XCircle size={14} /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No fund requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Fund Request Details"
        footer={selected?.status === 'Pending' ? (
          <>
            <Button variant="outline" onClick={() => { updateStatus(selected.id, 'Rejected'); setSelected(null); }}>Reject</Button>
            <Button onClick={() => { updateStatus(selected.id, 'Approved'); setSelected(null); }}>Approve</Button>
          </>
        ) : <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}>
        {selected && (
          <div className={styles.detailCard}>
            <div className={styles.detailRow}><strong>Name:</strong> {selected.name}</div>
            <div className={styles.detailRow}><strong>Email:</strong> {selected.email}</div>
            <div className={styles.detailRow}><strong>Amount:</strong> Rs {selected.amount.toLocaleString()}</div>
            <div className={styles.detailRow}><strong>Purpose:</strong> {selected.purpose}</div>
            <div className={styles.detailRow}><strong>Date:</strong> {selected.date}</div>
            <div className={styles.detailRow}><strong>Status:</strong> <Badge variant={selected.status === 'Approved' ? 'success' : selected.status === 'Rejected' ? 'danger' : 'warning'}>{selected.status}</Badge></div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--background)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
              {selected.description}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FundRequests;
