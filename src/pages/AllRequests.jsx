import { useState, useEffect } from 'react';
import { Check, X, MessageCircle, Send, Eye, Mail, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Select from '@/components/ui/Select.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './AllRequests.module.css';

const AllRequests = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH LIVE REQUESTS ---
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/requests/all', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAllRequests(data);
        } else {
          toast({ title: 'Failed to fetch requests', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Server connection error', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [toast]);

  const filtered = allRequests.filter(r => {
    if (filter !== 'All' && r.type !== filter) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    
    if (search) {
      const searchLower = search.toLowerCase();
      return r.title?.toLowerCase().includes(searchLower) || 
             r.submittedBy?.toLowerCase().includes(searchLower) || 
             r.email?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const counts = {
    all: allRequests.length,
    pending: allRequests.filter(r => r.status === 'Pending').length,
    approved: allRequests.filter(r => r.status === 'Approved').length,
    rejected: allRequests.filter(r => r.status === 'Rejected').length,
  };

  const handleAction = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        setAllRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        setSelectedRequest(prev => prev ? { ...prev, status } : null);
        toast({ title: `Request ${status}`, description: `Request has been ${status.toLowerCase()} successfully.` });
      } else {
        toast({ title: 'Update failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // 🔴 NEW: SAVE REPLY TO DATABASE
  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({ title: 'Please enter a reply', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/requests/${selectedRequest._id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
        },
        body: JSON.stringify({ text: replyText.trim(), from: 'President' })
      });

      if (res.ok) {
        const updatedRequest = await res.json();
        // Update local state with the new reply from DB
        setAllRequests(prev => prev.map(r => r._id === updatedRequest._id ? updatedRequest : r));
        setSelectedRequest(updatedRequest);
        setReplyText('');
        toast({ title: 'Reply Sent Successfully' });
      } else {
        toast({ title: 'Failed to send reply', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  const statusVariant = (s) => s === 'Approved' ? 'success' : s === 'Rejected' ? 'destructive' : 'warning';
  const typeVariant = (t) => t === 'Fund' ? 'default' : t === 'Participant' ? 'secondary' : 'outline';

  const openRequest = (r) => {
    setSelectedRequest(r);
    setReplyText('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PK');
  };

  return (
    <div>
      <PageHeader title="All Requests" description="View, manage, and reply to all requests submitted by society members" />

      <div className={styles.statsRow}>
        <div className={styles.statBox}><span className={styles.statNum}>{counts.all}</span><span className={styles.statLabel}>Total</span></div>
        <div className={`${styles.statBox} ${styles.pending}`}><span className={styles.statNum}>{counts.pending}</span><span className={styles.statLabel}>Pending</span></div>
        <div className={`${styles.statBox} ${styles.approved}`}><span className={styles.statNum}>{counts.approved}</span><span className={styles.statLabel}>Approved</span></div>
        <div className={`${styles.statBox} ${styles.rejected}`}><span className={styles.statNum}>{counts.rejected}</span><span className={styles.statLabel}>Rejected</span></div>
      </div>

      <div className={styles.filterRow}>
        <Input placeholder="Search by title, name, or email..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        <Select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All Types</option>
          <option value="Department">Department Support</option>
          <option value="Event">Event Approval</option>
          <option value="Other">Other</option>
        </Select>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </Select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th className={styles.hideSmall}>Submitted By</th>
              <th className={styles.hideMd}>Role</th>
              <th className={styles.hideMd}>Type</th>
              <th className={styles.hideMd}>Date</th>
              <th>Status</th>
              <th>Replies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.empty}>Loading requests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className={styles.empty}>No requests found</td></tr>
            ) : filtered.map(r => (
              <tr key={r._id} className={styles.clickableRow} onClick={() => openRequest(r)}>
                <td className={styles.bold}>{r.title}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>
                  {r.submittedBy}
                  <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Mail size={10} /> {r.email || 'No Email'}
                  </div>
                </td>
                
                {/* 🔴 NEW: DISPLAY ROLE */}
                <td className={styles.hideMd}>
                  <Badge variant="outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} /> {r.role || 'Student'}
                  </Badge>
                </td>
                
                <td className={styles.hideMd}><Badge variant={typeVariant(r.type)}>{r.type}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{formatDate(r.createdAt || r.date)}</td>
                <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                <td>
                  {r.replies?.length > 0 ? (
                    <span className={styles.replyCount}><MessageCircle size={14} /> {r.replies.length}</span>
                  ) : <span className={styles.muted}>—</span>}
                </td>
                <td className={styles.actionsCell} onClick={e => e.stopPropagation()}>
                  {r.status === 'Pending' ? (
                    <div className={styles.actionBtns}>
                      <Button size="sm" variant="outline" onClick={() => handleAction(r._id, 'Approved')} title="Approve" style={{ color: 'green', borderColor: 'green' }}><Check size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => handleAction(r._id, 'Rejected')} title="Reject" style={{ color: 'red', borderColor: 'red' }}><X size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => openRequest(r)}><Eye size={14} /></Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => openRequest(r)}><Eye size={14} /> View</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Request Details">
        {selectedRequest && (
          <div className={styles.detailContainer}>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Title</span><span className={styles.detailValue}>{selectedRequest.title}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Submitted By</span><span className={styles.detailValue}>{selectedRequest.submittedBy}</span></div>
              
              <div className={styles.detailItem}><span className={styles.detailLabel}>Email Account</span><span className={styles.detailValue} style={{ color: 'var(--primary)' }}>{selectedRequest.email}</span></div>
              
              {/* 🔴 MODAL ROLE DISPLAY */}
              <div className={styles.detailItem}><span className={styles.detailLabel}>Role</span><Badge variant="outline">{selectedRequest.role || 'Student'}</Badge></div>
              
              <div className={styles.detailItem}><span className={styles.detailLabel}>Type</span><Badge variant={typeVariant(selectedRequest.type)}>{selectedRequest.type}</Badge></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Date</span><span className={styles.detailValue}>{formatDate(selectedRequest.createdAt || selectedRequest.date)}</span></div>
              <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><Badge variant={statusVariant(selectedRequest.status)}>{selectedRequest.status}</Badge></div>
            </div>

            <div className={styles.messageSection}>
              <h4 className={styles.sectionLabel}><MessageCircle size={16} /> Request Description</h4>
              <div className={styles.memberMessage}>
                <div className={styles.msgHeader}>
                  <strong>{selectedRequest.submittedBy}</strong>
                  <span className={styles.muted}>{formatDate(selectedRequest.createdAt || selectedRequest.date)}</span>
                </div>
                <p>{selectedRequest.description || selectedRequest.message || selectedRequest.reason || 'No detailed description provided.'}</p>
              </div>
            </div>

            {selectedRequest.replies?.length > 0 && (
              <div className={styles.messageSection}>
                <h4 className={styles.sectionLabel}>Conversation</h4>
                <div className={styles.repliesThread}>
                  {selectedRequest.replies.map(reply => (
                    <div key={reply._id || reply.id} className={styles.replyBubble}>
                      <div className={styles.msgHeader}>
                        <strong className={styles.presidentTag}>{reply.from}</strong>
                        <span className={styles.muted}>{reply.date} {reply.time}</span>
                      </div>
                      <p>{reply.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.replySection}>
              <h4 className={styles.sectionLabel}>Reply to Sender</h4>
              <div className={styles.replyInputRow}>
                <Textarea
                  placeholder={`Write a reply to ${selectedRequest.submittedBy}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleReply} className={styles.sendBtn}><Send size={16} /> Send Reply</Button>
              </div>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div className={styles.actionRow} style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button variant="outline" onClick={() => handleAction(selectedRequest._id, 'Rejected')} style={{ borderColor: 'red', color: 'red' }}><X size={14} style={{ marginRight: '6px'}} /> Reject Request</Button>
                <Button onClick={() => handleAction(selectedRequest._id, 'Approved')} style={{ backgroundColor: 'green' }}><Check size={14} style={{ marginRight: '6px'}} /> Approve Request</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllRequests;