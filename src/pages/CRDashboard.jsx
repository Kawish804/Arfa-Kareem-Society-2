import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileCheck, CalendarDays, Megaphone, Bell, LogOut, Plus, Send, Wallet, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { requests as initialRequests, events, announcements, notifications as initialNotifications } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './CRDashboard.module.css';

const currentUser = { id: '8', name: 'Zainab Shah', email: 'zainab@society.edu', class: 'BSSE-6A', role: 'CR' };

const CRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [requestList, setRequestList] = useState(initialRequests);
  const [notifs] = useState(initialNotifications);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Department' });

  const [fundRecords, setFundRecords] = useState([]);
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [fundForm, setFundForm] = useState({ 
    studentName: '', 
    rollNo: '',
    department: 'BS-IT', 
    semester: '1st', 
    timing: 'Morning', 
    amount: '', 
    status: 'Paid', 
    method: 'Cash' 
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/fund-collections/records')
      .then(res => res.json())
      .then(data => setFundRecords(data))
      .catch(err => console.error("Error fetching funds:", err));
  }, []);

  const myRequests = requestList.filter(r => r.submittedBy === currentUser.name);

  const totalCollected = fundRecords.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = fundRecords.filter(f => f.status === 'Unpaid').reduce((sum, f) => sum + f.amount, 0);
  const paidCount = fundRecords.filter(f => f.status === 'Paid').length;
  const unpaidCount = fundRecords.filter(f => f.status === 'Unpaid').length;

  const handleSubmitRequest = () => {
    if (!form.title) { toast({ title: 'Please enter a title', variant: 'destructive' }); return; }
    const newReq = {
      id: String(Date.now()),
      title: form.title,
      submittedBy: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      type: form.type,
      description: form.description,
    };
    setRequestList(prev => [...prev, newReq]);
    toast({ title: 'Request submitted successfully' });
    setDialogOpen(false);
    setForm({ title: '', description: '', type: 'Department' });
  };

  const handleAddFundRecord = async () => {
    if (!fundForm.studentName || !fundForm.rollNo || !fundForm.amount) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }

    const rollNoRegex = /^22034156-\d{3}$/; 
    if (!rollNoRegex.test(fundForm.rollNo)) {
      toast({ 
        title: 'Invalid Roll Number', 
        description: 'Format must be exactly 22034156-xxx (e.g., 22034156-043)', 
        variant: 'destructive' 
      }); 
      return;
    }
    
    const newRecord = {
      studentName: fundForm.studentName,
      rollNo: fundForm.rollNo,
      department: fundForm.department,
      semester: fundForm.semester,
      timing: fundForm.timing,
      amount: Number(fundForm.amount),
      date: fundForm.status === 'Paid' ? new Date().toISOString().split('T')[0] : '',
      status: fundForm.status,
      method: fundForm.status === 'Paid' ? fundForm.method : '',
      uploadedBy: `CR ${currentUser.name}`
    };

    try {
      const res = await fetch('http://localhost:5000/api/fund-collections/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        const savedRecord = await res.json();
        setFundRecords(prev => [savedRecord, ...prev]);
        toast({ title: 'Fund record added successfully' });
        setFundDialogOpen(false);
        setFundForm({ studentName: '', rollNo: '', department: 'BS-IT', semester: '1st', timing: 'Morning', amount: '', status: 'Paid', method: 'Cash' });
      } else {
        toast({ title: 'Failed to save record', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server connection failed', variant: 'destructive' });
    }
  };

  const toggleFundStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    const updates = {
      status: newStatus,
      date: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : '',
      method: newStatus === 'Paid' ? 'Cash' : '',
    };

    try {
      const res = await fetch(`http://localhost:5000/api/fund-collections/record/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setFundRecords(prev => prev.map(f => f._id === id ? { ...f, ...updates } : f));
        toast({ title: 'Status updated' });
      }
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const deleteFundRecord = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/fund-collections/record/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFundRecords(prev => prev.filter(f => f._id !== id));
        toast({ title: 'Record removed' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const statusVariant = (s) => {
    if (s === 'Approved' || s === 'Paid') return 'default';
    if (s === 'Rejected') return 'destructive';
    return 'secondary';
  };

  const tabs = [
    { id: 'requests', label: 'Requests', icon: FileCheck },
    { id: 'funds', label: 'Fund Collection', icon: Wallet },
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>CR Dashboard</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Class Representative</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><Bell size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogOut size={14} /> Logout</Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} /><span>{t.label}</span>
              {t.id === 'notifications' && notifs.filter(n => !n.read).length > 0 && (
                <span className={styles.badge}>{notifs.filter(n => !n.read).length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'requests' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Departmental Requests</h2>
                <Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} /> Submit Request</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {myRequests.length > 0 ? myRequests.map(r => (
                      <tr key={r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td><Badge variant="secondary">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.date}</td>
                        <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className={styles.empty}>No requests submitted yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Class Fund Collection</h2>
                <Button size="sm" onClick={() => setFundDialogOpen(true)}><Plus size={14} /> Add Record</Button>
              </div>

              <div className={styles.fundStats}>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Total Collected</span>
                  <span className={styles.fundStatValue + ' ' + styles.fundCollected}>Rs {totalCollected.toLocaleString()}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Pending Amount</span>
                  <span className={styles.fundStatValue + ' ' + styles.fundPending}>Rs {totalPending.toLocaleString()}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Paid Students</span>
                  <span className={styles.fundStatValue}>{paidCount}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Unpaid Students</span>
                  <span className={styles.fundStatValue + ' ' + styles.fundPending}>{unpaidCount}</span>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Department & Roll No</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundRecords.length > 0 ? fundRecords.map(f => (
                      <tr key={f._id}>
                        <td className={styles.bold}>{f.studentName}</td>
                        <td className={styles.muted}>
                          <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {f.department || '—'} {f.rollNo ? `(${f.rollNo})` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                            {f.semester ? `${f.semester} Sem` : ''} {f.semester && f.timing ? '•' : ''} {f.timing || ''}
                          </div>
                        </td>
                        <td>Rs {f.amount?.toLocaleString() || 0}</td>
                        <td className={styles.muted}>{f.date || '—'}</td>
                        <td className={styles.muted}>{f.method || '—'}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'default' : 'secondary'}>{f.status}</Badge></td>
                        <td>
                          <div className={styles.actionBtns}>
                            <Button variant={f.status === 'Paid' ? 'outline' : 'primary'} size="sm" onClick={() => toggleFundStatus(f._id, f.status)}>
                              {f.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteFundRecord(f._id)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className={styles.empty}>No fund records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h2 className={styles.sectionTitle}>Events</h2>
              <div className={styles.eventGrid}>
                {events.map(e => (
                  <div key={e.id} className={styles.eventCard}>
                    <div className={styles.eventTop}>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                      <span className={styles.eventDate}><CalendarDays size={12} /> {e.date}</span>
                    </div>
                    <h3 className={styles.eventTitle}>{e.title}</h3>
                    <p className={styles.eventDesc}>{e.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <h2 className={styles.sectionTitle}>Announcements</h2>
              <div className={styles.eventGrid}>
                {announcements.map(a => (
                  <div key={a.id} className={styles.eventCard}>
                    <h3 className={styles.eventTitle}>{a.title}</h3>
                    <p className={styles.eventDesc}>{a.description}</p>
                    <div className={styles.annMeta}>
                      <span className={styles.muted}>{a.postedDate}</span>
                      <span className={styles.muted}>By {a.postedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <div className={styles.notifList}>
                {notifs.map(n => (
                  <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}>
                    <div className={styles.notifDot} />
                    <div className={styles.notifContent}>
                      <h4 className={styles.notifTitle}>{n.title}</h4>
                      <p className={styles.muted}>{n.message}</p>
                      <span className={styles.notifDate}>{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Submit Departmental Request"
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}><Send size={14} /> Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Request title" /></div>
          <div className={styles.field}><label>Type</label>
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="Department">Department</option><option value="Budget">Budget</option><option value="Event">Event</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Description</label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your request..." rows={4} />
          </div>
        </div>
      </Modal>

      <Modal open={fundDialogOpen} onClose={() => setFundDialogOpen(false)} title="Add Fund Record"
        footer={<><Button variant="outline" onClick={() => setFundDialogOpen(false)}>Cancel</Button><Button onClick={handleAddFundRecord}><Send size={14} /> Add Record</Button></>}>
        <div className={styles.formFields}>
          
          <div className={styles.field}>
            <label>Student Name *</label>
            <Input value={fundForm.studentName} onChange={e => setFundForm(p => ({ ...p, studentName: e.target.value }))} placeholder="e.g. Ali Ahmed" />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Department *</label>
              <Select value={fundForm.department} onChange={e => setFundForm(p => ({ ...p, department: e.target.value }))}>
                <option value="BS-IT">BS-IT</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Economics">Economics</option>
                <option value="English">English</option>
                <option value="Maths">Maths</option>
              </Select>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Roll Number *</label>
              <Input value={fundForm.rollNo} onChange={e => setFundForm(p => ({ ...p, rollNo: e.target.value }))} placeholder="22034156-xxx" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Semester *</label>
              <Select value={fundForm.semester} onChange={e => setFundForm(p => ({ ...p, semester: e.target.value }))}>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="3rd">3rd Semester</option>
                <option value="4th">4th Semester</option>
                <option value="5th">5th Semester</option>
                <option value="6th">6th Semester</option>
                <option value="7th">7th Semester</option>
                <option value="8th">8th Semester</option>
              </Select>
            </div>
            <div className={styles.field} style={{ flex: 1 }}>
              <label>Timing *</label>
              <Select value={fundForm.timing} onChange={e => setFundForm(p => ({ ...p, timing: e.target.value }))}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </Select>
            </div>
          </div>
          
          <div className={styles.field}>
            <label>Amount (Rs) *</label>
            <Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 500" />
          </div>
          <div className={styles.field}><label>Status</label>
            <Select value={fundForm.status} onChange={e => setFundForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
            </Select>
          </div>
          {fundForm.status === 'Paid' && (
            <div className={styles.field}><label>Payment Method</label>
              <Select value={fundForm.method} onChange={e => setFundForm(p => ({ ...p, method: e.target.value }))}>
                <option value="Cash">Cash</option><option value="Online">Online Transfer</option><option value="JazzCash">JazzCash</option><option value="EasyPaisa">EasyPaisa</option>
              </Select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CRDashboard;