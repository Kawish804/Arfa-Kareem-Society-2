import { useState, useEffect } from 'react';
import { Check, X, Users, CalendarDays, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './ParticipantRequests.module.css';

const ParticipantRequests = () => {
  const [requests, setRequests] = useState([]); // Dynamic empty array
  const [viewRequest, setViewRequest] = useState(null);
  const { toast } = useToast();

  // FETCH DYNAMIC DATA
  useEffect(() => {
    fetch('http://localhost:5000/api/participants/all')
      .then(res => res.json())
      .then(data => setRequests(data))
      .catch(err => console.error("Fetch error:", err));
  }, []);

  const statusVariant = (s) => s === 'Approved' ? 'success' : s === 'Rejected' ? 'destructive' : 'outline';

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const updateStatus = async (r, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/participants/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setRequests(prev => prev.map(x => x._id === r._id ? { ...x, status: newStatus } : x));
        toast({ title: `Participation ${newStatus}`, description: `${r.studentName} is ${newStatus.toLowerCase()} for ${r.eventTitle}` });
        setViewRequest(null);
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this request permanently?")) return;
    try {
      await fetch(`http://localhost:5000/api/participants/${id}`, { method: 'DELETE' });
      setRequests(prev => prev.filter(r => r._id !== id));
      toast({ title: 'Request Deleted' });
    } catch (error) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Participant Requests" description="Review and manage event participation requests from students" />

      <div className={styles.statsRow}>
        <div className={styles.stat}><span className={styles.statNum}>{requests.length}</span><span className={styles.statLabel}>Total</span></div>
        <div className={`${styles.stat} ${styles.statPending}`}><span className={styles.statNum}>{pendingCount}</span><span className={styles.statLabel}>Pending</span></div>
        <div className={`${styles.stat} ${styles.statApproved}`}><span className={styles.statNum}>{approvedCount}</span><span className={styles.statLabel}>Approved</span></div>
        <div className={`${styles.stat} ${styles.statRejected}`}><span className={styles.statNum}>{rejectedCount}</span><span className={styles.statLabel}>Rejected</span></div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th className={styles.hideSmall}>Event</th>
              <th className={styles.hideMd}>Role</th>
              <th className={styles.hideMd}>Date</th>
              <th>Status</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r._id}>
                <td>
                  <div className={styles.bold}>{r.studentName}</div>
                  <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{r.department} {r.rollNo ? `(${r.rollNo})` : ''}</div>
                </td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>{r.eventTitle}</td>
                <td className={styles.hideMd}><Badge variant="secondary">{r.role}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{r.date}</td>
                <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                <td className={styles.actionsCell}>
                  {r.status === 'Pending' ? (
                    <div className={styles.actionBtns}>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r, 'Approved')}><Check size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r, 'Rejected')}><X size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => setViewRequest(r)}>View</Button>
                    </div>
                  ) : (
                    <div className={styles.actionBtns}>
                      <Button size="sm" variant="outline" onClick={() => setViewRequest(r)}>View</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteRequest(r._id)}>
                        <Trash2 size={14} color="var(--destructive)" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewRequest} onClose={() => setViewRequest(null)} title="Participation Request Details"
        footer={viewRequest?.status === 'Pending' ? <>
          <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
          <Button variant="outline" onClick={() => updateStatus(viewRequest, 'Rejected')}><X size={14} /> Reject</Button>
          <Button onClick={() => updateStatus(viewRequest, 'Approved')}><Check size={14} /> Approve</Button>
        </> : <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>}>
        {viewRequest && (
          <div className={styles.detailCard}>
            <div className={styles.detailRow}><Users size={16} /> <strong>Student:</strong> {viewRequest.studentName}</div>
            <div className={styles.detailRow} style={{ paddingLeft: '24px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {viewRequest.department} • {viewRequest.rollNo || 'No Roll No'} • {viewRequest.contact || 'No Contact'}
            </div>
            <div className={styles.detailRow}><CalendarDays size={16} /> <strong>Event:</strong> {viewRequest.eventTitle}</div>
            <div className={styles.detailRow}><strong>Role:</strong> <Badge variant="secondary">{viewRequest.role}</Badge></div>
            <div className={styles.detailRow}><strong>Date:</strong> {viewRequest.date}</div>
            <div className={styles.detailRow}><strong>Status:</strong> <Badge variant={statusVariant(viewRequest.status)}>{viewRequest.status}</Badge></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParticipantRequests;