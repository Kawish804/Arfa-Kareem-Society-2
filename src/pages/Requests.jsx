import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useToast } from '../components/Toast/ToastProvider';
import styles from './Requests.module.css';

const Requests = () => {
  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // FETCH PENDING REQUESTS FROM DATABASE
  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/requests');
      const data = await response.json();
      if (response.ok) {
        setRequestList(data);
      }
    } catch (error) {
      toast({ title: 'Error fetching requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // APPROVE MEMBER
  const handleApprove = async (id, name) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/approve/${id}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Remove the approved user from the pending list on the screen
        setRequestList(prev => prev.filter(req => req._id !== id));
        toast({ title: 'Approved!', description: `${name} has been emailed their Membership ID.` });
      }
    } catch (error) {
      toast({ title: 'Error approving request', variant: 'destructive' });
    }
  };

  // REJECT MEMBER
  const handleReject = async (id, name) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/reject/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Remove the rejected user from the pending list on the screen
        setRequestList(prev => prev.filter(req => req._id !== id));
        toast({ title: 'Rejected', description: `${name}'s request was removed.`, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error rejecting request', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader 
        title="Membership Requests" 
        description="Review and approve new student applications for the society" 
      />

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th className={styles.hideSmall}>Email</th>
              <th className={styles.hideMd}>Department & Semester</th>
              <th>Status</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>Loading requests...</td></tr>
            ) : requestList.length === 0 ? (
              <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px', color: '#666'}}>No pending requests.</td></tr>
            ) : (
              requestList.map(r => (
                <tr key={r._id}>
                  <td className={styles.bold}>{r.fullName}</td>
                  <td className={`${styles.hideSmall} ${styles.muted}`}>{r.email}</td>
                  <td className={styles.hideMd}>
                    <Badge variant="secondary">{r.department} - {r.semester}</Badge>
                  </td>
                  <td><Badge variant="outline">Pending Approval</Badge></td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionBtns}>
                      <Button size="sm" variant="outline" onClick={() => handleApprove(r._id, r.fullName)}>
                        <Check size={14} /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(r._id, r.fullName)}>
                        <X size={14} /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Requests;