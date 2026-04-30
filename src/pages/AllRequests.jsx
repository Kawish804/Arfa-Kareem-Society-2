import { useState, useEffect } from 'react';
import { Check, X, MessageCircle, Send, Eye, Mail, User, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Select from '@/components/ui/Select.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './AllRequests.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AllRequests = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [replyText, setReplyText] = useState('');
  
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API_URL}/requests/all`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Ensure newer requests are at the top
          setAllRequests(data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (error) {
        toast({ title: 'Server connection error', description: 'Could not load requests.', variant: 'destructive' });
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
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/requests/${id}/status`, {
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
        toast({ title: `Request ${status}`, description: `Request has been marked as ${status.toLowerCase()}.` });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({ title: 'Action Failed', description: 'Could not update request status.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast({ title: 'Empty Reply', description: 'Please write a message before sending.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/requests/${selectedRequest._id}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}` 
        },
        body: JSON.stringify({ text: replyText.trim(), from: 'Admin / President' })
      });

      if (res.ok) {
        const updatedRequest = await res.json();
        setAllRequests(prev => prev.map(r => r._id === updatedRequest._id ? updatedRequest : r));
        setSelectedRequest(updatedRequest);
        setReplyText('');
        toast({ title: 'Reply Sent Successfully' });
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Failed to deliver the message.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusVariant = (s) => s === 'Approved' ? 'success' : s === 'Rejected' ? 'destructive' : 'warning';
  const typeVariant = (t) => t === 'Fund' ? 'default' : t === 'Event' ? 'secondary' : 'outline';

  const openRequest = (r) => {
    setSelectedRequest(r);
    setReplyText('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className={styles.pageWrap}>
      <PageHeader title="Manage Requests" description="Review, approve, and communicate regarding member requests." />

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{counts.all}</span>
          <span className={styles.statLabel}>Total Requests</span>
        </div>
        <div className={`${styles.statBox} ${styles.pending}`}>
          <span className={styles.statNum}>{counts.pending}</span>
          <span className={styles.statLabel}>Pending Review</span>
        </div>
        <div className={`${styles.statBox} ${styles.approved}`}>
          <span className={styles.statNum}>{counts.approved}</span>
          <span className={styles.statLabel}>Approved</span>
        </div>
        <div className={`${styles.statBox} ${styles.rejected}`}>
          <span className={styles.statNum}>{counts.rejected}</span>
          <span className={styles.statLabel}>Rejected</span>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchWrap}>
          <Input placeholder="Search by title, name, or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Department">Department Support</option>
          <option value="Event">Event Approval</option>
          <option value="Fund">Fund Allocation</option>
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
              <th>Title & Details</th>
              <th className={styles.hideSmall}>Submitted By</th>
              <th className={styles.hideMd}>Category</th>
              <th className={styles.hideMd}>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.empty}><Loader2 className={styles.spin} /> Loading requests...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>No requests match your current filters.</td></tr>
            ) : filtered.map(r => (
              <tr key={r._id} className={styles.clickableRow} onClick={() => openRequest(r)}>
                <td>
                  <div className={styles.bold}>{r.title}</div>
                  {r.replies?.length > 0 && (
                    <div className={styles.replyBadge}>
                      <MessageCircle size={12} /> {r.replies.length} Replies
                    </div>
                  )}
                </td>
                <td className={styles.hideSmall}>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>{r.submittedBy}</div>
                  <div className={styles.mutedInfo}>
                    <Mail size={12} /> {r.email || 'No Email'}
                  </div>
                  <div className={styles.mutedInfo} style={{ marginTop: '2px' }}>
                    <User size={12} /> {r.role || 'Member'}
                  </div>
                </td>
                <td className={styles.hideMd}><Badge variant={typeVariant(r.type)}>{r.type}</Badge></td>
                <td className={`${styles.hideMd} ${styles.mutedInfo}`}>{formatDate(r.createdAt || r.date).split(',')[0]}</td>
                <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                <td className={styles.actionsCell} onClick={e => e.stopPropagation()}>
                  <div className={styles.actionBtns}>
                    <Button size="sm" variant="ghost" onClick={() => openRequest(r)}><Eye size={16} /> Review</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selectedRequest} onClose={() => !isSubmitting && setSelectedRequest(null)} title="Request Details">
        {selectedRequest && (
          <div className={styles.detailContainer}>
            <div className={styles.detailHeader}>
              <div>
                <h3 className={styles.detailTitle}>{selectedRequest.title}</h3>
                <div className={styles.detailMeta}>
                  <span>By: <strong>{selectedRequest.submittedBy}</strong></span> • 
                  <span>{formatDate(selectedRequest.createdAt || selectedRequest.date)}</span>
                </div>
              </div>
              <Badge variant={statusVariant(selectedRequest.status)} className={styles.statusBadgeBig}>
                {selectedRequest.status}
              </Badge>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email Contact</span>
                <span className={styles.detailValue} style={{ color: 'var(--primary)' }}>{selectedRequest.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>User Role</span>
                <Badge variant="outline">{selectedRequest.role || 'Student'}</Badge>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Category</span>
                <Badge variant={typeVariant(selectedRequest.type)}>{selectedRequest.type}</Badge>
              </div>
            </div>

            <div className={styles.messageSection}>
              <h4 className={styles.sectionLabel}>Request Description</h4>
              <div className={styles.memberMessage}>
                <p>{selectedRequest.description || selectedRequest.message || selectedRequest.reason || 'No detailed description provided by the user.'}</p>
              </div>
            </div>

            {selectedRequest.replies?.length > 0 && (
              <div className={styles.messageSection}>
                <h4 className={styles.sectionLabel}>Conversation History</h4>
                <div className={styles.repliesThread}>
                  {selectedRequest.replies.map((reply, idx) => (
                    <div key={reply._id || idx} className={`${styles.replyBubble} ${reply.from.includes('Admin') || reply.from.includes('President') ? styles.replyAdmin : styles.replyUser}`}>
                      <div className={styles.msgHeader}>
                        <strong>{reply.from}</strong>
                        <span className={styles.msgTime}>{reply.date} {reply.time}</span>
                      </div>
                      <p>{reply.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.replySection}>
              <h4 className={styles.sectionLabel}>Add a Reply</h4>
              <div className={styles.replyInputRow}>
                <Textarea
                  placeholder={`Write a message to ${selectedRequest.submittedBy}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  rows={3}
                  disabled={isSubmitting}
                />
                <Button onClick={handleReply} disabled={isSubmitting || !replyText.trim()} className={styles.sendBtn}>
                  {isSubmitting ? <Loader2 size={16} className={styles.spin} /> : <Send size={16} />} 
                  Send Message
                </Button>
              </div>
            </div>

            {selectedRequest.status === 'Pending' && (
              <div className={styles.actionRow}>
                <Button variant="outline" onClick={() => handleAction(selectedRequest._id, 'Rejected')} disabled={isSubmitting} className={styles.rejectBtn}>
                  <X size={16} /> Reject Request
                </Button>
                <Button onClick={() => handleAction(selectedRequest._id, 'Approved')} disabled={isSubmitting} className={styles.approveBtn}>
                  <Check size={16} /> Approve Request
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AllRequests;