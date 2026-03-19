import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { DollarSign, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import styles from './FundRequests.module.css';

const FundRequests = () => {
  const { toast } = useToast();
  // 1. Start with an empty array and add a loading state
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // 2. Fetch data from the backend when the component mounts
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/funds/requests');
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          toast({ title: 'Failed to load requests', variant: 'destructive' });
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast({ title: 'Server error', description: 'Could not connect to database.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [toast]);

  // Calculate dynamic stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    totalAmount: requests.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0),
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  // 3. Update status in the database AND locally
  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/funds/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Update the UI locally if the database update was successful
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        toast({ title: `Request ${status}`, description: `Fund request has been ${status.toLowerCase()}.` });
      } else {
        toast({ title: 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast({ title: 'Server error', variant: 'destructive' });
    }
  };

  // Show a loading indicator while fetching data
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading fund requests...
      </div>
    );
  }

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
              <tr key={r._id}> {/* Use r._id for MongoDB */}
                <td>
                  <div className={styles.bold}>{r.name}</div>
                  <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{r.email}</div>
                </td>
                <td className={styles.hideMd}>{r.purpose}</td>
                <td className={styles.bold}>Rs {r.amount?.toLocaleString() || 0}</td>
                {/* Format the MongoDB date string properly */}
                <td className={styles.hideSmall}>{new Date(r.date).toLocaleDateString()}</td>
                <td>
                  <Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'danger' : 'warning'}>{r.status}</Badge>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionBtns}>
                    <Button size="sm" variant="outline" onClick={() => setSelected(r)}><Eye size={14} /></Button>
                    {r.status === 'Pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(r._id, 'Approved')}><CheckCircle size={14} /></Button>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r._id, 'Rejected')}><XCircle size={14} /></Button>
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
            <Button variant="outline" onClick={() => { updateStatus(selected._id, 'Rejected'); setSelected(null); }}>Reject</Button>
            <Button onClick={() => { updateStatus(selected._id, 'Approved'); setSelected(null); }}>Approve</Button>
          </>
        ) : <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}>
        {selected && (
          <div className={styles.detailCard}>
            <div className={styles.detailRow}><strong>Name:</strong> {selected.name}</div>
            <div className={styles.detailRow}><strong>Email:</strong> {selected.email}</div>
            <div className={styles.detailRow}><strong>Amount:</strong> Rs {selected.amount?.toLocaleString() || 0}</div>
            <div className={styles.detailRow}><strong>Purpose:</strong> {selected.purpose}</div>
            <div className={styles.detailRow}><strong>Date:</strong> {new Date(selected.date).toLocaleDateString()}</div>
            <div className={styles.detailRow}><strong>Status:</strong> <Badge variant={selected.status === 'Approved' ? 'success' : selected.status === 'Rejected' ? 'danger' : 'warning'}>{selected.status}</Badge></div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--background)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginTop: 8 }}>
              {selected.description || "No additional description provided."}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FundRequests;