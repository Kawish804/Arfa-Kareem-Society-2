import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, FileCheck, CalendarDays, Megaphone, Bell, LogOut, 
  Plus, Send, Wallet, RefreshCw, CheckCircle, AlertCircle, Clock, 
  Search, Loader2, User, MessageSquare 
} from 'lucide-react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('funds');
  const [requestList, setRequestList] = useState([]);
  
  // DYNAMIC & SEARCH STATES
  const [monthlyFee, setMonthlyFee] = useState(500); 
  const [searchStudent, setSearchStudent] = useState('');
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifs, setNotifs] = useState([]); 
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [myClassList, setMyClassList] = useState([]);
  
  // ENTERPRISE LOADING STATES
  const [loadingList, setLoadingList] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // MODAL STATES
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(''); 
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Department' });
  const [viewRequestModal, setViewRequestModal] = useState(null); 

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const feeRes = await fetch(`${API_URL}/settings/fee`);
        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setMonthlyFee(feeData.fee);
        }

        const classRes = await fetch(`${API_URL}/students/my-class`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (classRes.ok) {
          const data = await classRes.json();
          setMyClassList(data.map(s => ({ ...s, arrears: s.arrears || 0 })));
        }
      } catch (error) {
        toast({ title: 'Connection Error', description: 'Failed to load class list.', variant: 'destructive' });
      } finally {
        setLoadingList(false);
      }
    };
    fetchClassData();
  }, [toast]);

  useEffect(() => {
    const fetchSocietyData = async () => {
      if (!currentUser?.email) return;
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [reqRes, eventRes, annRes, notifRes] = await Promise.all([
          fetch(`${API_URL}/requests/my-requests/${currentUser.email}`, { headers }),
          fetch(`${API_URL}/events`, { headers }),
          fetch(`${API_URL}/announcements`, { headers }),
          fetch(`${API_URL}/notifications/all`, { headers })
        ]);

        if (reqRes.ok) setRequestList(await reqRes.json());
        if (eventRes.ok) setEvents(await eventRes.json());
        if (annRes.ok) setAnnouncements(await annRes.json());
        if (notifRes.ok) {
          const fetchedNotifs = await notifRes.json();
          const validNotifs = fetchedNotifs.filter(n => {
            const isPresident = currentUser?.role === 'President' || currentUser?.role === 'Admin';
            const isBroadcast = n.type?.toLowerCase() === 'announcement' || n.type?.toLowerCase() === 'event';
            return !(isPresident && isBroadcast);
          });
          setNotifs(validNotifs); 
          setUnreadCount(validNotifs.filter(n => !n.read).length); 
        }
      } catch (error) {
        console.error("Failed to load society data", error);
      }
    };
    fetchSocietyData();
  }, [currentUser]);

  // --- DYNAMIC FILTERING & CALCULATIONS ---
  const filteredStudents = myClassList.filter(s => 
    s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) || 
    (s.rollNumber && s.rollNumber.toLowerCase().includes(searchStudent.toLowerCase()))
  );

  const paidCount = myClassList.filter(f => f.fundStatus === 'Paid').length;
  const unpaidCount = myClassList.filter(f => f.fundStatus === 'Unpaid').length;
  const pendingCount = myClassList.filter(f => f.fundStatus === 'Pending').length;

  const getTabBadgeCount = (tabId) => {
    const typeMap = { funds: 'fund', requests: 'request', events: 'event', announcements: 'announcement' };
    const mappedType = typeMap[tabId];
    return notifs.filter(n => !n.read && n.type?.toLowerCase() === mappedType).length;
  };

  const openPaymentModal = (student) => {
    setSelectedStudent(student);
    const totalOwed = monthlyFee + (student.arrears || 0);
    setPaymentAmount(totalOwed); 
    setPaymentModalOpen(true);
  };

  // ENTERPRISE LOGIC: ARREARS CALCULATION
  const handleCollectPayment = async () => {
    const enteredAmount = Number(paymentAmount);
    if (!enteredAmount || enteredAmount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid payment amount.', variant: 'destructive' }); 
      return;
    }

    setIsSubmitting(true);
    try {
      const totalOwed = monthlyFee + (selectedStudent.arrears || 0);
      const newArrears = Math.max(0, totalOwed - enteredAmount); 
      const newStatus = newArrears > 0 ? 'Pending' : 'Paid';

      const res1 = await fetch(`${API_URL}/students/${selectedStudent._id}/fund`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus, arrears: newArrears })
      });

      if (!res1.ok) throw new Error('Failed to update student status');

      const newTransaction = {
        studentName: selectedStudent.fullName, rollNo: selectedStudent.rollNumber,
        department: selectedStudent.department, semester: selectedStudent.semester,
        timing: selectedStudent.shift, amount: enteredAmount, 
        status: 'Paid', date: new Date().toISOString().split('T')[0],
        uploadedBy: currentUser.fullName
      };

      const res2 = await fetch(`${API_URL}/fund-collections/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(newTransaction)
      });

      if (!res2.ok) throw new Error('Failed to log transaction');

      setMyClassList(prev => prev.map(f => f._id === selectedStudent._id ? { ...f, fundStatus: newStatus, arrears: newArrears } : f));
      
      if (newArrears > 0) {
        toast({ title: 'Partial Payment Logged', description: `Rs ${newArrears} added to student's arrears.`, variant: 'warning' });
      } else {
        toast({ title: 'Success', description: 'Full Payment Collected & Sent to Treasury!' });
      }
      
      setPaymentModalOpen(false);
    } catch (error) {
      toast({ title: 'Transaction failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetMonth = async () => {
    if (!window.confirm(`⚠️ START NEW MONTH\n\nAre you sure?\n- "Paid" students will reset to "Unpaid".\n- Unpaid students will have Rs ${monthlyFee} added to their Arrears.`)) return;

    setResetting(true);
    try {
      const promises = myClassList.map(student => {
        let newStatus = student.fundStatus;
        let newArrears = student.arrears || 0;

        if (student.fundStatus === 'Paid') {
          newStatus = 'Unpaid';
        } else {
          newStatus = 'Pending';
          newArrears += monthlyFee;
        }

        if (newStatus !== student.fundStatus || newArrears !== student.arrears) {
          return fetch(`${API_URL}/students/${student._id}/fund`, {
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
        return { ...student, fundStatus: 'Pending', arrears: (student.arrears || 0) + monthlyFee };
      }));
      toast({ title: 'Success', description: 'New month started. Arrears successfully calculated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reset monthly funds.', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!form.title.trim() || !form.description.trim()) { 
      toast({ title: 'Validation Error', description: 'Please fill all fields.', variant: 'destructive' }); 
      return; 
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ ...form, submittedBy: currentUser.fullName, email: currentUser.email, role: currentUser.role || 'Class Representative' })
      });
      if (res.ok) {
        const newReq = await res.json();
        setRequestList(prev => [newReq, ...prev]);
        toast({ title: 'Success', description: 'Request Submitted Successfully!' });
        setDialogOpen(false);
        setForm({ title: '', description: '', type: 'Department' });
      } else throw new Error('Failed');
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not submit request.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs = [
    { id: 'funds', label: 'Fund Collection', icon: Wallet },
    { id: 'requests', label: 'My Requests', icon: FileCheck },
    { id: 'events', label: 'Society Events', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ];

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>Class Representative</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>CR Access</Badge>
            <TransferRoleWidget />
            
            {/* ENTERPRISE FIX: Added Chat Icon Button */}
            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
            </button>
            
            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
            </button>

            <Button variant="outline" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.hideMobile} style={{marginLeft: '6px'}}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => {
            const badgeCount = getTabBadgeCount(t.id);
            return (
              <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <t.icon size={16} style={{ marginRight: '8px' }} />
                  <span>{t.label}</span>
                  {badgeCount > 0 && <span className={styles.tabBadge}>{badgeCount}</span>}
                </div>
              </button>
            );
          })}
        </nav>

        <div className={styles.content}>
          {/* FUNDS TAB */}
          {activeTab === 'funds' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Class Fund Management</h2>
                  <p className={styles.sectionDesc}>Standard Monthly Fee: <strong>Rs {monthlyFee}</strong></p>
                </div>
                <Button onClick={handleResetMonth} disabled={resetting || loadingList} className={styles.resetBtn}>
                  {resetting ? <Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> : <RefreshCw size={16} style={{ marginRight: '6px' }} />}
                  Start New Month
                </Button>
              </div>

              <div className={styles.fundStats}>
                <div className={styles.fundStatCard}>
                  <UsersIcon className={styles.statIcon} />
                  <div>
                    <span className={styles.fundStatLabel}>Total Students</span>
                    <span className={styles.fundStatValue}>{myClassList.length}</span>
                  </div>
                </div>
                <div className={styles.fundStatCard}>
                  <CheckCircle className={styles.statIcon} style={{color: '#10b981', background: '#d1fae5'}} />
                  <div>
                    <span className={styles.fundStatLabel}>Paid This Month</span>
                    <span className={styles.fundStatValue} style={{color: '#10b981'}}>{paidCount}</span>
                  </div>
                </div>
                <div className={styles.fundStatCard}>
                  <Clock className={styles.statIcon} style={{color: '#ef4444', background: '#fee2e2'}} />
                  <div>
                    <span className={styles.fundStatLabel}>Unpaid</span>
                    <span className={styles.fundStatValue} style={{color: '#ef4444'}}>{unpaidCount}</span>
                  </div>
                </div>
                <div className={styles.fundStatCard}>
                  <AlertCircle className={styles.statIcon} style={{color: '#d97706', background: '#fef3c7'}} />
                  <div>
                    <span className={styles.fundStatLabel}>Pending (Arrears)</span>
                    <span className={styles.fundStatValue} style={{color: '#d97706'}}>{pendingCount}</span>
                  </div>
                </div>
              </div>

              {loadingList ? (
                <div className={styles.loadingState}>
                  <Loader2 size={32} className={styles.spin} />
                  <p>Loading your class registry...</p>
                </div>
              ) : (
                <>
                  <div className={styles.controlsRow}>
                    <div className={styles.searchWrap}>
                      <Search size={16} className={styles.searchIcon} />
                      <Input 
                        placeholder="Search by student name or roll number..." 
                        value={searchStudent} 
                        onChange={(e) => setSearchStudent(e.target.value)} 
                        className={styles.searchInput}
                      />
                    </div>
                  </div>

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th className={styles.hideSmall}>Current Month</th>
                          <th>Arrears Owed</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length > 0 ? filteredStudents.map(student => {
                          const totalOwed = monthlyFee + (student.arrears || 0);
                          return (
                            <tr key={student._id}>
                              <td>
                                <div className={styles.bold}>{student.fullName}</div>
                                <div className={styles.mutedInfo}>{student.rollNumber || 'N/A'} • {student.shift}</div>
                              </td>
                              <td className={styles.hideSmall}>Rs {monthlyFee}</td>
                              <td>
                                <span className={student.arrears > 0 ? styles.arrearsText : ''}>
                                  Rs {student.arrears || 0}
                                </span>
                              </td>
                              <td>
                                <Badge variant={student.fundStatus === 'Paid' ? 'success' : student.fundStatus === 'Pending' ? 'warning' : 'destructive'}>
                                  {student.fundStatus === 'Pending' ? 'Has Arrears' : student.fundStatus}
                                </Badge>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {student.fundStatus === 'Paid' ? (
                                  <span className={styles.paidText}><CheckCircle size={14} /> Paid</span>
                                ) : (
                                  <Button size="sm" onClick={() => openPaymentModal(student)} className={styles.collectBtn}>
                                    Collect Rs {totalOwed}
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        }) : <tr><td colSpan={5} className={styles.emptyTable}>No students found matching your search.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>My Requests</h2>
                  <p className={styles.sectionDesc}>Submit budgets, departmental issues, or event ideas to the President.</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} className={styles.actionBtn}>
                  <Plus size={16} style={{marginRight: '6px'}} /> Submit Request
                </Button>
              </div>
              
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title & Details</th><th>Category</th><th>Date Submitted</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {requestList.length > 0 ? requestList.map(req => (
                      <tr key={req._id}>
                        <td className={styles.bold}>{req.title}</td>
                        <td><Badge variant="outline">{req.type}</Badge></td>
                        <td className={styles.mutedInfo}>{new Date(req.createdAt || req.date).toLocaleDateString()}</td>
                        <td><Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'destructive' : 'warning'}>{req.status || 'Pending'}</Badge></td>
                        <td style={{ textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" onClick={() => setViewRequestModal(req)} className={styles.viewBtn}>
                            View {req.replies?.length > 0 && <span className={styles.replyCounter}>{req.replies.length}</span>}
                          </Button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="5" className={styles.emptyTable}>You haven't submitted any requests yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Society Events</h2>
              <div className={styles.gridContainer}>
                {events.length > 0 ? events.map(event => (
                  <div key={event._id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{event.title}</h3>
                      <Badge variant={event.status === 'Upcoming' ? 'default' : event.status === 'Completed' ? 'success' : 'secondary'}>{event.status}</Badge>
                    </div>
                    <Badge variant="outline" style={{marginBottom: '12px'}}>{event.type}</Badge>
                    <p className={styles.cardDesc}>{event.description}</p>
                    <div className={styles.cardMeta}><CalendarDays size={14} /> {event.date} {event.time && `• ${event.time}`}</div>
                    {event.venue && <div className={styles.cardMeta}><Clock size={14} /> {event.venue}</div>}
                  </div>
                )) : <div className={styles.emptyTable}>No upcoming events.</div>}
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Announcements</h2>
              <div className={styles.listContainer}>
                {announcements.length > 0 ? announcements.map(ann => (
                  <div key={ann._id} className={styles.announcementCard}>
                    <div className={styles.annHeader}>
                      <h3 className={styles.annTitle}>{ann.title}</h3>
                      <span className={styles.annDate}>{ann.postedDate}</span>
                    </div>
                    <p className={styles.annDesc}>{ann.description}</p>
                    <div className={styles.annFooter}>Posted by: {ann.postedBy}</div>
                  </div>
                )) : <div className={styles.emptyTable}>No recent announcements.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔴 DYNAMIC PAYMENT MODAL WITH REAL-TIME CALCULATION */}
      <Modal open={paymentModalOpen} onClose={() => !isSubmitting && setPaymentModalOpen(false)} title="Record Payment" 
        footer={
          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%'}}>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleCollectPayment} disabled={isSubmitting || !paymentAmount} style={{backgroundColor: '#52a447'}}>
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Processing...</> : 'Confirm Payment'}
            </Button>
          </div>
        }>
        {selectedStudent && (() => {
          const totalOwed = monthlyFee + (selectedStudent.arrears || 0);
          const enteredAmount = Number(paymentAmount) || 0;
          const remainingArrears = Math.max(0, totalOwed - enteredAmount);
          
          return (
            <div className={styles.formFields}>
              <div className={styles.receiptBox}>
                <h4 className={styles.receiptName}>{selectedStudent.fullName}</h4>
                <div className={styles.receiptRow}><span>Current Month Dues:</span><span>Rs {monthlyFee}</span></div>
                <div className={styles.receiptRow} style={{color: '#d97706'}}><span>Total Arrears:</span><span>Rs {selectedStudent.arrears || 0}</span></div>
                <hr className={styles.receiptDivider} />
                <div className={styles.receiptTotal}><span>Total Payable:</span><span>Rs {totalOwed}</span></div>
              </div>
              
              <div className={styles.field}>
                <label>Amount Paid by Student (Rs) <span style={{color: 'red'}}>*</span></label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} disabled={isSubmitting} autoFocus />
              </div>

              {/* DYNAMIC LOGIC DISPLAY */}
              <div className={styles.calcBox}>
                <AlertCircle size={14} className={remainingArrears > 0 ? styles.iconWarning : styles.iconSuccess} />
                <span style={{flex: 1, fontSize: '0.85rem'}}>
                  {remainingArrears > 0 
                    ? `Student will still owe Rs ${remainingArrears} in arrears.` 
                    : `Full payment cleared. Status will change to Paid.`}
                </span>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* REQUEST SUBMISSION MODAL */}
      <Modal open={dialogOpen} onClose={() => !isSubmitting && setDialogOpen(false)} title="Submit Request" 
        footer={
          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%'}}>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting} style={{backgroundColor: '#52a447'}}>
              {isSubmitting ? <><Loader2 size={14} className={styles.spin} style={{marginRight: '6px'}}/> Submitting...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Submit Request</>}
            </Button>
          </div>
        }>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title <span style={{color: 'red'}}>*</span></label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Category</label>
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} disabled={isSubmitting}>
              <option value="Department">Department Support</option><option value="Event">Event Idea</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Details <span style={{color: 'red'}}>*</span></label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} disabled={isSubmitting} /></div>
        </div>
      </Modal>

      {/* VIEW REQUEST MODAL */}
      <Modal open={!!viewRequestModal} onClose={() => setViewRequestModal(null)} title="Request Status & Replies" footer={<Button onClick={() => setViewRequestModal(null)} variant="outline">Close</Button>}>
        {viewRequestModal && (
          <div className={styles.formFields}>
            <div className={styles.receiptBox}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#0f172a' }}>{viewRequestModal.title}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Current Status:</span>
                <Badge variant={viewRequestModal.status === 'Approved' ? 'success' : viewRequestModal.status === 'Rejected' ? 'destructive' : 'warning'}>{viewRequestModal.status || 'Pending'}</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}><strong>Description:</strong><br/>{viewRequestModal.description}</p>
            </div>

            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', color: '#0f172a' }}>Official Replies</h4>
            {viewRequestModal.replies?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {viewRequestModal.replies.map((reply, idx) => (
                  <div key={idx} style={{ backgroundColor: '#f1f5f9', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #52a447' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{reply.from}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{reply.date} {reply.time}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.4' }}>{reply.text}</p>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Your request is currently under review.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

const UsersIcon = ({className}) => <User className={className} style={{color: '#3b82f6', background: '#eff6ff'}}/>;

export default CRDashboard;