import { useState } from 'react';
import { Check, X, Users, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { events } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './ParticipantRequests.module.css';

const initialParticipantRequests = [
  { id: '1', studentName: 'Ali Hassan', eventId: '1', eventTitle: 'Tech Talk 2024', role: 'Attendee', date: '2024-03-10', status: 'Pending' },
  { id: '2', studentName: 'Sara Khan', eventId: '2', eventTitle: 'Career Fair', role: 'Volunteer', date: '2024-03-11', status: 'Pending' },
  { id: '3', studentName: 'Usman Tariq', eventId: '1', eventTitle: 'Tech Talk 2024', role: 'Speaker', date: '2024-03-09', status: 'Approved' },
  { id: '4', studentName: 'Fatima Noor', eventId: '3', eventTitle: 'Hackathon 2024', role: 'Organizer', date: '2024-03-12', status: 'Pending' },
  { id: '5', studentName: 'Ahmed Raza', eventId: '2', eventTitle: 'Career Fair', role: 'Attendee', date: '2024-03-08', status: 'Rejected' },
];

const ParticipantRequests = () => {
  const [requests, setRequests] = useState(initialParticipantRequests);
  const [viewRequest, setViewRequest] = useState(null);
  const { toast } = useToast();

  const statusVariant = (s) => s === 'Approved' ? 'success' : s === 'Rejected' ? 'destructive' : 'outline';

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const handleApprove = (r) => {
    setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Approved' } : x));
    toast({ title: 'Participation Approved', description: `${r.studentName} approved for ${r.eventTitle}` });
    setViewRequest(null);
  };

  const handleReject = (r) => {
    setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Rejected' } : x));
    toast({ title: 'Participation Rejected', description: `${r.studentName} rejected for ${r.eventTitle}`, variant: 'destructive' });
    setViewRequest(null);
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
              <tr key={r.id}>
                <td className={styles.bold}>{r.studentName}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>{r.eventTitle}</td>
                <td className={styles.hideMd}><Badge variant="secondary">{r.role}</Badge></td>
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
                      <Button size="sm" variant="outline" onClick={() => setViewRequest(r)}>View</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setViewRequest(r)}>View</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewRequest} onClose={() => setViewRequest(null)} title="Participation Request Details"
        footer={viewRequest?.status === 'Pending' ? <>
          <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>
          <Button variant="outline" onClick={() => handleReject(viewRequest)}><X size={14} /> Reject</Button>
          <Button onClick={() => handleApprove(viewRequest)}><Check size={14} /> Approve</Button>
        </> : <Button variant="outline" onClick={() => setViewRequest(null)}>Close</Button>}>
        {viewRequest && (
          <div className={styles.detailCard}>
            <div className={styles.detailRow}><Users size={16} /> <strong>Student:</strong> {viewRequest.studentName}</div>
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
