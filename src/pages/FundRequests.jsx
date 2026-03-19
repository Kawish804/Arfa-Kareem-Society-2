import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { DollarSign, Clock, CheckCircle, XCircle, Eye, AlertCircle, Trash2 } from 'lucide-react';
import styles from './FundRequests.module.css';

const FundRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [reqRes, fundsRes, expRes] = await Promise.all([
          fetch('http://localhost:5000/api/funds/requests'),
          fetch('http://localhost:5000/api/fund-collections/records'),
          fetch('http://localhost:5000/api/expenses/records')
        ]);

        if (reqRes.ok && fundsRes.ok && expRes.ok) {
          const reqData = await reqRes.json();
          const fundsData = await fundsRes.json();
          const expData = await expRes.json();

          setRequests(reqData);

          const totalCollected = fundsData.filter(f => f.status === 'Paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
          const totalExpenses = expData.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          
          setAvailableBalance(totalCollected - totalExpenses);
        } else {
          toast({ title: 'Failed to load data', variant: 'destructive' });
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        toast({ title: 'Server error', description: 'Could not connect to database.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [toast]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    totalAmount: requests.filter(r => r.status === 'Approved').reduce((s, r) => s + r.amount, 0),
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const updateStatus = async (id, status) => {
    const requestToUpdate = requests.find(r => r._id === id);

    if (status === 'Approved') {
      if (requestToUpdate.amount > availableBalance) {
        toast({ 
          title: 'Insufficient Funds!', 
          description: `Cannot approve Rs ${requestToUpdate.amount.toLocaleString()}. You only have Rs ${availableBalance.toLocaleString()} available.`, 
          variant: 'destructive' 
        });
        return; 
      }
    }

    try {
      const response = await fetch(`http://localhost:5000/api/funds/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        if (status === 'Approved') {
          const newExpense = {
            title: `Approved Fund Req: ${requestToUpdate.purpose || 'Student Grant'}`,
            category: 'Other',
            amount: requestToUpdate.amount,
            date: new Date().toISOString().split('T')[0],
          };

          await fetch('http://localhost:5000/api/expenses/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newExpense)
          });

          setAvailableBalance(prev => prev - requestToUpdate.amount);
        }

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

  // NEW: Delete Function logic
  const deleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this request?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/funds/requests/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r._id !== id));
        toast({ title: 'Request Deleted', description: 'The fund request has been permanently removed.' });
        if (selected && selected._id === id) {
          setSelected(null); // close the modal if they delete it from inside the modal
        }
      } else {
        toast({ title: 'Failed to delete request', variant: 'destructive' });
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast({ title: 'Server error', variant: 'destructive' });
    }
  };

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

      <div style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--primary)' }}>
        <DollarSign size={24} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Current Available Treasury Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>Rs {availableBalance.toLocaleString()}</div>
        </div>
      </div>

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
              <tr key={r._id}> 
                <td>
                  <div className={styles.bold}>{r.name}</div>
                  <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{r.email}</div>
                </td>
                <td className={styles.hideMd}>{r.purpose}</td>
                <td className={styles.bold}>Rs {r.amount?.toLocaleString() || 0}</td>
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
                    {/* NEW: Delete Button in table row */}
                    <Button size="sm" variant="ghost" onClick={() => deleteRequest(r._id)}>
                      <Trash2 size={14} color="var(--destructive)" />
                    </Button>
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
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {/* NEW: Delete button inside the modal */}
            <Button variant="ghost" onClick={() => deleteRequest(selected._id)}>
              <Trash2 size={14} color="var(--destructive)" style={{ marginRight: '6px' }} /> Delete
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selected?.status === 'Pending' ? (
                <>
                  <Button variant="outline" onClick={() => { updateStatus(selected._id, 'Rejected'); setSelected(null); }}>Reject</Button>
                  <Button onClick={() => { updateStatus(selected._id, 'Approved'); setSelected(null); }}>Approve</Button>
                </>
              ) : <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>}
            </div>
          </div>
        }>
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
            
            {selected.status === 'Pending' && selected.amount > availableBalance && (
               <div style={{ marginTop: '12px', padding: '12px', background: '#FEF2F2', color: '#DC2626', borderRadius: '6px', display: 'flex', gap: '8px', fontSize: '0.875rem' }}>
                 <AlertCircle size={16} />
                 <span><strong>Warning:</strong> You do not have enough funds to approve this request right now.</span>
               </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FundRequests;