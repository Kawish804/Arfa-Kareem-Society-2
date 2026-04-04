import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileCheck, CalendarDays, Megaphone, Bell, LogOut, Plus, Send, Wallet, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './CRDashboard.module.css';

// 🔴 Standard Monthly Society Fee
const MONTHLY_FEE = 500;

const CRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('funds');
  const [requestList, setRequestList] = useState([]);
  
  // 🔴 NOTIFICATION & BADGE STATES
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifs, setNotifs] = useState([]); 
  
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // CLASS LIST STATE
  const [myClassList, setMyClassList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [resetting, setResetting] = useState(false);

  // MODAL STATES
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(MONTHLY_FEE);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Department' });
  
  // Restored View Request Modal state
  const [viewRequestModal, setViewRequestModal] = useState(null); 

  // --- 1. FETCH CR'S CLASS ---
  useEffect(() => {
    const fetchMyClass = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/students/my-class', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          const formattedData = data.map(s => ({ ...s, arrears: s.arrears || 0 }));
          setMyClassList(formattedData);
        }
      } catch (error) {
        toast({ title: 'Failed to load class list', variant: 'destructive' });
      } finally {
        setLoadingList(false);
      }
    };
    fetchMyClass();
  }, [toast]);

  // --- 2. FETCH SOCIETY DATA (Events, Announcements, Requests, Notifications) ---
  useEffect(() => {
    const fetchSocietyData = async () => {
      if (!currentUser?.email) return;

      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const reqRes = await fetch(`http://localhost:5000/api/requests/my-requests/${currentUser.email}`, { headers });
        if (reqRes.ok) setRequestList(await reqRes.json());

        const eventRes = await fetch('http://localhost:5000/api/events', { headers });
        if (eventRes.ok) setEvents(await eventRes.json());

        const annRes = await fetch('http://localhost:5000/api/announcements', { headers });
        if (annRes.ok) setAnnouncements(await annRes.json());

        // 🔴 FETCH REAL NOTIFICATIONS FOR TAB BADGES AND BELL
        const notifRes = await fetch('http://localhost:5000/api/notifications/all', { headers });
        if (notifRes.ok) {
          const fetchedNotifs = await notifRes.json();
          const validNotifs = fetchedNotifs.filter(n => {
            const isPresident = currentUser?.role === 'President' || currentUser?.role === 'Admin';
            const isBroadcast = n.type?.toLowerCase() === 'announcement' || n.type?.toLowerCase() === 'event';
            if (isPresident && isBroadcast) return false;
            return true;
          });
          
          setNotifs(validNotifs); // Save them to state so tabs can read them
          setUnreadCount(validNotifs.filter(n => !n.read).length); // Top bell counter
        }

      } catch (error) {
        console.error("Failed to load society data:", error);
      }
    };
    fetchSocietyData();
  }, [currentUser]);

  const paidCount = myClassList.filter(f => f.fundStatus === 'Paid').length;
  const unpaidCount = myClassList.filter(f => f.fundStatus === 'Unpaid').length;
  const pendingCount = myClassList.filter(f => f.fundStatus === 'Pending').length;

  // 🔴 HELPER FUNCTION: Get Unread Count for Specific Tabs
  const getTabBadgeCount = (tabId) => {
    const typeMap = { funds: 'fund', requests: 'request', events: 'event', announcements: 'announcement' };
    const mappedType = typeMap[tabId];
    return notifs.filter(n => !n.read && n.type?.toLowerCase() === mappedType).length;
  };

  // --- 3. PROCESS REAL TRANSACTION ---
  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    const totalOwed = MONTHLY_FEE + (student.arrears || 0);
    setPaymentAmount(totalOwed);
    setPaymentModalOpen(true);
  };

  const handleCollectPayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast({ title: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setProcessingPayment(true);
    try {
      const res1 = await fetch(`http://localhost:5000/api/students/${selectedStudent._id}/fund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Paid', arrears: 0 })
      });

      if (!res1.ok) throw new Error('Failed to update student status');

      const newTransaction = {
        studentName: selectedStudent.fullName, rollNo: selectedStudent.rollNumber,
        department: selectedStudent.department, semester: selectedStudent.semester,
        timing: selectedStudent.shift, amount: Number(paymentAmount),
        status: 'Paid', date: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser.fullName
      };

      const res2 = await fetch('http://localhost:5000/api/fund-collections/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(newTransaction)
      });

      if (!res2.ok) throw new Error('Failed to log transaction for President');

      setMyClassList(prev => prev.map(f => f._id === selectedStudent._id ? { ...f, fundStatus: 'Paid', arrears: 0 } : f));
      toast({ title: 'Payment Collected & Sent to President!' });
      setPaymentModalOpen(false);
    } catch (error) {
      toast({ title: 'Transaction failed', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingPayment(false);
    }
  };

  // --- 4. RESET FUNDS (ADDS ARREARS!) ---
  const handleResetMonth = async () => {
    if (!window.confirm(`Are you sure you want to start a new month? \n\n- All "Paid" students will reset to "Unpaid".\n- Anyone who didn't pay will have Rs ${MONTHLY_FEE} added to their Arrears.`)) return;

    setResetting(true);
    try {
      const promises = myClassList.map(student => {
        let newStatus = student.fundStatus;
        let newArrears = student.arrears || 0;

        if (student.fundStatus === 'Paid') {
          newStatus = 'Unpaid';
        } else {
          newStatus = 'Pending';
          newArrears += MONTHLY_FEE;
        }

        if (newStatus !== student.fundStatus || newArrears !== student.arrears) {
          return fetch(`http://localhost:5000/api/students/${student._id}/fund`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
            body: JSON.stringify({ status: newStatus, arrears: newArrears })
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      setMyClassList(prev => prev.map(student => {
        if (student.fundStatus === 'Paid') return { ...student, fundStatus: 'Unpaid' };
        return { ...student, fundStatus: 'Pending', arrears: (student.arrears || 0) + MONTHLY_FEE };
      }));
      toast({ title: 'New month started! Arrears calculated.' });
    } catch (error) {
      toast({ title: 'Error resetting funds', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  // --- 5. SUBMIT REQUEST TO DATABASE ---
  const handleSubmitRequest = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Please enter a title', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({
          ...form,
          submittedBy: currentUser.fullName,
          email: currentUser.email,
          role: currentUser.role || 'Class Representative' 
        })
      });

      if (res.ok) {
        const newReq = await res.json();
        setRequestList(prev => [newReq, ...prev]);
        toast({ title: 'Request Submitted Successfully!' });
        setDialogOpen(false);
        setForm({ title: '', description: '', type: 'Department' });
      } else {
        toast({ title: 'Failed to submit request', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server connection failed', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'funds', label: 'Fund Collection', icon: Wallet },
    { id: 'requests', label: 'Requests', icon: FileCheck },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>CR Dashboard</h1>
              <p className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Representative'}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Class Representative</Badge>
            <TransferRoleWidget />
            
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={14} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold', border: '2px solid white' }}>
                  {unreadCount}
                </span>
              )}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut size={14} /> Logout</Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => {
            // 🔴 CALCULATE TAB SPECIFIC BADGES
            const badgeCount = getTabBadgeCount(t.id);
            return (
              <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <t.icon size={16} style={{ marginRight: '6px' }} />
                  <span>{t.label}</span>
                  {badgeCount > 0 && (
                    <span style={{ backgroundColor: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 'bold', marginLeft: '6px' }}>
                      {badgeCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className={styles.content}>

          {/* FUNDS TAB */}
          {activeTab === 'funds' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className={styles.sectionTitle}>Class Fund Collection</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Standard Monthly Fee: Rs {MONTHLY_FEE}</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleResetMonth} disabled={resetting || loadingList} style={{ color: 'var(--primary)' }}>
                  <RefreshCw size={14} style={{ marginRight: '6px' }} />
                  {resetting ? 'Processing...' : 'Start New Month'}
                </Button>
              </div>

              <div className={styles.fundStats}>
                <div className={styles.fundStatCard}><span className={styles.fundStatLabel}>Total Students</span><span className={styles.fundStatValue}>{myClassList.length}</span></div>
                <div className={styles.fundStatCard}><span className={styles.fundStatLabel}>Paid This Month</span><span className={styles.fundStatValue}>{paidCount}</span></div>
                <div className={styles.fundStatCard}><span className={styles.fundStatLabel}>Unpaid</span><span className={styles.fundStatValue + ' ' + styles.fundPending}>{unpaidCount}</span></div>
                <div className={styles.fundStatCard}><span className={styles.fundStatLabel}>Pending (Arrears)</span><span className={styles.fundStatValue} style={{ color: '#d97706' }}>{pendingCount}</span></div>
              </div>

              {loadingList ? (
                <p>Loading your class list...</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Student Details</th><th>Current Month</th><th>Arrears Owed</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                    </thead>
                    <tbody>
                      {myClassList.length > 0 ? myClassList.map(student => {
                        const totalOwed = MONTHLY_FEE + (student.arrears || 0);
                        return (
                          <tr key={student._id}>
                            <td>
                              <div className={styles.bold}>{student.fullName}</div>
                              <div className={styles.muted} style={{ fontSize: '0.75rem', marginTop: '2px' }}>{student.rollNumber} • {student.shift}</div>
                            </td>
                            <td>Rs {MONTHLY_FEE}</td>
                            <td><span style={{ color: student.arrears > 0 ? '#d97706' : 'inherit', fontWeight: student.arrears > 0 ? 'bold' : 'normal' }}>Rs {student.arrears || 0}</span></td>
                            <td><Badge variant={student.fundStatus === 'Paid' ? 'success' : student.fundStatus === 'Pending' ? 'warning' : 'secondary'}>{student.fundStatus === 'Pending' ? 'Has Arrears' : student.fundStatus}</Badge></td>
                            <td style={{ textAlign: 'right' }}>
                              {student.fundStatus === 'Paid' ? (
                                <Button variant="ghost" size="sm" disabled style={{ color: 'green', opacity: 0.8 }}><CheckCircle size={14} style={{ marginRight: '6px' }} /> Paid</Button>
                              ) : (
                                <Button variant="primary" size="sm" onClick={() => openPaymentModal(student)}>Collect Rs {totalOwed}</Button>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={5} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No students found in your class.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>My Requests</h2>
                <Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} /> Submit Request</Button>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr><th>Title</th><th>Type</th><th>Date Submitted</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {requestList.length > 0 ? requestList.map(req => (
                      <tr key={req._id}>
                        <td className={styles.bold}>{req.title}</td>
                        <td><Badge variant="outline">{req.type}</Badge></td>
                        <td className={styles.muted}>{new Date(req.createdAt || req.date).toLocaleDateString()}</td>
                        <td><Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'destructive' : 'warning'}>{req.status || 'Pending'}</Badge></td>
                        
                        {/* 🔴 RESTORED VIEW REPLIES BUTTON */}
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="outline" size="sm" onClick={() => setViewRequestModal(req)}>
                            View & Replies {req.replies?.length > 0 && `(${req.replies.length})`}
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>You haven't submitted any requests yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {events.length > 0 ? events.map(event => (
                  <div key={event._id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{event.title}</h3>
                      <Badge variant={event.status === 'Upcoming' ? 'default' : event.status === 'Completed' ? 'success' : 'secondary'}>{event.status}</Badge>
                    </div>
                    <div style={{ marginBottom: '12px' }}><Badge variant="outline">{event.type}</Badge></div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>{event.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem' }}>
                      <CalendarDays size={14} /> {event.date} {event.time && `• ${event.time}`}
                    </div>
                    {event.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem', marginTop: '4px' }}>
                        <Clock size={14} /> {event.venue}
                      </div>
                    )}
                  </div>
                )) : (
                  <p className={styles.muted}>No upcoming events at this time.</p>
                )}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div>
              <h2 className={styles.sectionTitle}>Society Announcements</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {announcements.length > 0 ? announcements.map(ann => (
                  <div key={ann._id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>{ann.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{ann.postedDate}</span>
                    </div>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{ann.description}</p>
                    <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Posted by: {ann.postedBy}</div>
                  </div>
                )) : (
                  <p className={styles.muted}>No recent announcements.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record Payment Receipt" footer={<><Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button><Button onClick={handleCollectPayment} disabled={processingPayment}>{processingPayment ? 'Processing...' : 'Confirm & Generate Receipt'}</Button></>}>
        {selectedStudent && (
          <div className={styles.formFields}>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>{selectedStudent.fullName}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '5px' }}><span>Current Month Dues:</span><span>Rs {MONTHLY_FEE}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#d97706', fontWeight: 'bold' }}><span>Total Arrears:</span><span>Rs {selectedStudent.arrears || 0}</span></div>
              <hr style={{ margin: '10px 0', borderColor: '#e2e8f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold' }}><span>Total Payable:</span><span>Rs {MONTHLY_FEE + (selectedStudent.arrears || 0)}</span></div>
            </div>
            <div className={styles.field}>
              <label>Amount Paid by Student (Rs) *</label>
              <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}><AlertCircle size={12} style={{ display: 'inline', marginBottom: '-2px' }} /> This will permanently mark the student as Paid and send a receipt to the President.</p>
          </div>
        )}
      </Modal>

      {/* REQUEST SUBMISSION MODAL */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Submit Departmental Request" footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}><Send size={14} style={{ marginRight: '6px' }} /> Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div className={styles.field}><label>Type</label>
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="Department">Department</option><option value="Event">Event</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Description</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
        </div>
      </Modal>

      {/* 🔴 RESTORED VIEW REQUEST & REPLIES MODAL */}
      <Modal open={!!viewRequestModal} onClose={() => setViewRequestModal(null)} title="Request Status & Replies" footer={<Button onClick={() => setViewRequestModal(null)}>Close</Button>}>
        {viewRequestModal && (
          <div className={styles.formFields}>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{viewRequestModal.title}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Status:</span>
                <Badge variant={viewRequestModal.status === 'Approved' ? 'success' : viewRequestModal.status === 'Rejected' ? 'destructive' : 'warning'}>
                  {viewRequestModal.status || 'Pending'}
                </Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#333' }}><strong>Your Description:</strong><br/>{viewRequestModal.description}</p>
            </div>

            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>
              Messages from President
            </h4>
            
            {viewRequestModal.replies?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {viewRequestModal.replies.map(reply => (
                  <div key={reply._id || reply.id} style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{reply.from}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reply.date} {reply.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{reply.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>No replies from the President yet.</p>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default CRDashboard;