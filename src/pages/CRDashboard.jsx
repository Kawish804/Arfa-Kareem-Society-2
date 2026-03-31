import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileCheck, CalendarDays, Megaphone, Bell, LogOut, Plus, Send, Wallet, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './CRDashboard.module.css';

const currentUser = { id: '8', name: 'Zainab Shah', role: 'CR' };

const CRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('funds');
  
  const [requestList, setRequestList] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  // REAL CLASS LIST STATE
  const [myClassList, setMyClassList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [resetting, setResetting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Department' });

  // --- 1. FETCH ONLY THIS CR'S CLASS ---
  useEffect(() => {
    const fetchMyClass = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/students/my-class', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMyClassList(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        toast({ title: 'Failed to load class list', variant: 'destructive' });
      } finally {
        setLoadingList(false);
      }
    };
    fetchMyClass();
  }, []);

  const paidCount = myClassList.filter(f => f.fundStatus === 'Paid').length;
  const unpaidCount = myClassList.filter(f => f.fundStatus === 'Unpaid').length;
  const pendingCount = myClassList.filter(f => f.fundStatus === 'Pending').length; // Arrears

  // --- 2. TOGGLE STATUS DIRECTLY IN DB ---
  const toggleFundStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';

    try {
      const res = await fetch(`http://localhost:5000/api/students/${id}/fund`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setMyClassList(prev => prev.map(f => f._id === id ? { ...f, fundStatus: newStatus } : f));
        toast({ title: `Status changed to ${newStatus}` });
      } else {
        toast({ title: 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server connection failed', variant: 'destructive' });
    }
  };

  // --- 3. RESET FUNDS FOR NEW MONTH ---
  const handleResetMonth = async () => {
    if (!window.confirm("Are you sure you want to start a new month? \n\n- Students who are 'Paid' will reset to 'Unpaid'.\n- Students who are currently 'Unpaid' will be marked as 'Pending' (meaning they have arrears).")) return;

    setResetting(true);
    try {
      // Create a batch of updates
      const promises = myClassList.map(student => {
        let newStatus = student.fundStatus;
        if (student.fundStatus === 'Paid') newStatus = 'Unpaid';
        else if (student.fundStatus === 'Unpaid') newStatus = 'Pending'; // Marks them as having dues

        if (newStatus !== student.fundStatus) {
          return fetch(`http://localhost:5000/api/students/${student._id}/fund`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      // Update UI instantly
      setMyClassList(prev => prev.map(student => {
        if (student.fundStatus === 'Paid') return { ...student, fundStatus: 'Unpaid' };
        if (student.fundStatus === 'Unpaid') return { ...student, fundStatus: 'Pending' };
        return student;
      }));

      toast({ title: 'New month started! Dues have been calculated.' });
    } catch (error) {
      toast({ title: 'Error resetting funds', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  const handleSubmitRequest = () => {
    toast({ title: 'Info', description: 'Request submission is working.' });
    setDialogOpen(false);
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
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'funds' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>Class Fund Collection</h2>
                <Button size="sm" variant="outline" onClick={handleResetMonth} disabled={resetting || loadingList} style={{ color: 'var(--primary)' }}>
                  <RefreshCw size={14} style={{ marginRight: '6px' }} /> 
                  {resetting ? 'Resetting...' : 'Start New Month (Reset)'}
                </Button>
              </div>

              <div className={styles.fundStats}>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Total Students</span>
                  <span className={styles.fundStatValue}>{myClassList.length}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Paid This Month</span>
                  <span className={styles.fundStatValue}>{paidCount}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Unpaid</span>
                  <span className={styles.fundStatValue + ' ' + styles.fundPending}>{unpaidCount}</span>
                </div>
                <div className={styles.fundStatCard}>
                  <span className={styles.fundStatLabel}>Pending (Arrears)</span>
                  <span className={styles.fundStatValue} style={{ color: 'orange' }}>{pendingCount}</span>
                </div>
              </div>

              {loadingList ? (
                <p>Loading your class list...</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Department & Roll No</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myClassList.length > 0 ? myClassList.map(student => (
                        <tr key={student._id}>
                          <td className={styles.bold}>{student.fullName}</td>
                          <td className={styles.muted}>
                            <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                              {student.department} ({student.rollNumber})
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                              {student.semester} Sem • {student.shift} • {student.batch}
                            </div>
                          </td>
                          <td>
                            <Badge variant={student.fundStatus === 'Paid' ? 'default' : student.fundStatus === 'Pending' ? 'warning' : 'secondary'}>
                              {student.fundStatus === 'Pending' ? 'Has Arrears' : student.fundStatus}
                            </Badge>
                          </td>
                          <td>
                            <Button 
                              variant={student.fundStatus === 'Paid' ? 'outline' : 'primary'} 
                              size="sm" 
                              onClick={() => toggleFundStatus(student._id, student.fundStatus)}
                            >
                              {student.fundStatus === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                            </Button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className={styles.empty} style={{ textAlign: 'center', padding: '20px' }}>No students found in your class. Ask the President to upload the list!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Departmental Requests</h2>
                <Button size="sm" onClick={() => setDialogOpen(true)}><Plus size={14} /> Submit Request</Button>
              </div>
              <p className={styles.muted}>Your requests will appear here once connected to backend.</p>
            </div>
          )}
          
          {activeTab === 'events' && (
            <div>
              <h2 className={styles.sectionTitle}>Events</h2>
              <p className={styles.muted}>Upcoming events will appear here.</p>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <h2 className={styles.sectionTitle}>Announcements</h2>
              <p className={styles.muted}>Society announcements will appear here.</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Submit Departmental Request"
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}><Send size={14} /> Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
          <div className={styles.field}><label>Type</label>
            <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="Department">Department</option><option value="Event">Event</option>
            </Select>
          </div>
          <div className={styles.field}><label>Description</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default CRDashboard;