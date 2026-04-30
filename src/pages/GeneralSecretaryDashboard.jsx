import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Megaphone, Users, Bell, LogOut, Plus, Send,
  FileText, ClipboardList, MessageSquare, UserCheck, AlertTriangle, Loader2
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
import styles from './GeneralSecretaryDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GeneralSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LIVE DATABASE STATES
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [minutes, setMinutes] = useState([]);

  const [notifs, setNotifs] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Modals
  const [annDialog, setAnnDialog] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', description: '', priority: 'Normal' });
  const [minuteDialog, setMinuteDialog] = useState(false);
  const [minuteForm, setMinuteForm] = useState({ title: '', attendees: '', summary: '' });

  useEffect(() => {
    const fetchGSData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [memRes, annRes, reqRes, compRes, evRes, minRes, notifRes, chatRes] = await Promise.all([
          // 🔴 THE FIX: Now using the secure /auth/users route
          fetch(`${API_URL}/auth/users`, { headers }).catch(() => null),
          fetch(`${API_URL}/announcements`, { headers }).catch(() => null),
          fetch(`${API_URL}/requests`, { headers }).catch(() => null),
          fetch(`${API_URL}/complaints`, { headers }).catch(() => null),
          fetch(`${API_URL}/events`, { headers }).catch(() => null),
          fetch(`${API_URL}/minutes`, { headers }).catch(() => null),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => null),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => null)
        ]);

        if (memRes?.ok) setMembers(await memRes.json());
        if (annRes?.ok) setAnnouncements(await annRes.json());
        if (reqRes?.ok) setRequests(await reqRes.json());
        if (compRes?.ok) setComplaints(await compRes.json());
        if (evRes?.ok) setEvents(await evRes.json());
        if (minRes?.ok) setMinutes(await minRes.json());

        if (notifRes?.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }

        if (chatRes?.ok) {
          const msgs = await chatRes.json();
          const myId = currentUser?._id || currentUser?.id;
          setUnreadChatCount(msgs.filter(m => !m.read && m.receiver === myId).length);
        }
      } catch (error) {
        toast({ title: 'Sync Error', description: 'Failed to sync society data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchGSData();
  }, [currentUser, toast]);

  // DYNAMIC CALCULATIONS
  const activeMembers = members.filter(m => m.status === 'Active' || m.isActive).length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const unreadNotifs = notifs.filter(n => !n.read).length;

  // API ACTIONS
  const handleAddAnnouncement = async () => {
    if (!annForm.title.trim()) { toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' }); return; }

    setIsSubmitting(true);
    try {
      const payload = { ...annForm, postedBy: currentUser?.fullName, date: new Date().toISOString() };
      const res = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newAnn = await res.json();
        setAnnouncements(prev => [newAnn, ...prev]);
        toast({ title: 'Success', description: 'Announcement posted successfully.' });
        setAnnDialog(false);
        setAnnForm({ title: '', description: '', priority: 'Normal' });
      } else throw new Error();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to post announcement.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMinute = async () => {
    if (!minuteForm.title.trim()) { toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' }); return; }

    setIsSubmitting(true);
    try {
      const payload = { ...minuteForm, recordedBy: currentUser?.fullName, date: new Date().toISOString() };
      const res = await fetch(`${API_URL}/minutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newMin = await res.json();
        setMinutes(prev => [newMin, ...prev]);
        toast({ title: 'Success', description: 'Meeting minutes recorded.' });
        setMinuteDialog(false);
        setMinuteForm({ title: '', attendees: '', summary: '' });
      } else throw new Error();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to record minutes.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComplaint = async (c) => {
    try {
      const res = await fetch(`${API_URL}/complaints/${c._id || c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        setComplaints(prev => prev.map(x => (x._id === c._id || x.id === c.id) ? { ...x, status: 'Resolved' } : x));
        toast({ title: 'Success', description: 'Complaint marked as resolved.' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Error', description: 'Failed to update complaint.', variant: 'destructive' }); }
  };

  const handleRequestStatus = async (r, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/requests/${r._id || r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setRequestList(prev => prev.map(x => (x._id === r._id || x.id === r.id) ? { ...x, status: newStatus } : x));
        toast({ title: 'Success', description: `Request marked as ${newStatus}.` });
      } else throw new Error();
    } catch (err) { toast({ title: 'Error', description: 'Failed to update request.', variant: 'destructive' }); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'minutes', label: 'Meeting Minutes', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
  ];

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Workspace...</h2>
        <p>Gathering society data for General Secretary.</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>General Secretary</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>GS Access</Badge>
            <TransferRoleWidget />

            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
              {unreadChatCount > 0 && <span className={styles.badgeAlert}>{unreadChatCount}</span>}
            </button>

            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {unreadNotifs > 0 && <span className={styles.badgeAlert}>{unreadNotifs}</span>}
            </button>

            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.hideMobile} style={{ marginLeft: '6px' }}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} style={{ marginRight: '6px' }} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Society Overview</h2>
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}><Users size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Active Members</span>
                    <span className={styles.statValue}>{activeMembers}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}><FileText size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Pending Requests</span>
                    <span className={styles.statValue}>{pendingRequests}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                  <div className={styles.statIcon}><AlertTriangle size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Open Complaints</span>
                    <span className={styles.statValue}>{pendingComplaints}</span>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}><Megaphone size={24} /></div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Announcements</span>
                    <span className={styles.statValue}>{announcements.length}</span>
                  </div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Recent Activity Requires Attention</h3>
              <div className={styles.activityList}>
                {requests.filter(r => r.status === 'Pending').slice(0, 3).map(r => (
                  <div key={r._id || r.id} className={styles.activityItem}>
                    <FileText size={18} className={styles.activityIconBlue} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{r.title}</span>
                      <span className={styles.mutedInfo}>by {r.submittedBy || r.studentName} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</span>
                    </div>
                    <Badge variant="warning">Pending Request</Badge>
                  </div>
                ))}
                {complaints.filter(c => c.status === 'Pending').slice(0, 2).map(c => (
                  <div key={c._id || c.id} className={styles.activityItem}>
                    <AlertTriangle size={18} className={styles.activityIconRed} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{c.title}</span>
                      <span className={styles.mutedInfo}>by {c.submittedBy} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}</span>
                    </div>
                    <Badge variant="destructive">Complaint</Badge>
                  </div>
                ))}
                {requests.filter(r => r.status === 'Pending').length === 0 && complaints.filter(c => c.status === 'Pending').length === 0 && (
                  <p className={styles.emptyTable}>No pending activities or complaints.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Announcements</h2>
                <Button onClick={() => setAnnDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> Post Announcement</Button>
              </div>
              <div className={styles.gridContainer}>
                {announcements.map(a => (
                  <div key={a._id || a.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{a.title}</h3>
                      {a.priority === 'Urgent' && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    <p className={styles.cardDesc}>{a.description}</p>
                    <div className={styles.cardMeta}>
                      <span>{a.postedDate || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '')}</span>
                      <span>• By {a.postedBy}</span>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && <p className={styles.emptyTable}>No announcements posted.</p>}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Member Requests</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Submitted By</th><th>Type</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r._id || r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td className={styles.mutedInfo}>{r.submittedBy || r.studentName}</td>
                        <td><Badge variant="outline">{r.type}</Badge></td>
                        <td className={styles.mutedInfo}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</td>
                        <td><Badge variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'destructive' : 'warning'}>{r.status}</Badge></td>
                        <td style={{ textAlign: 'right' }}>
                          {r.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <Button size="sm" onClick={() => handleRequestStatus(r, 'Approved')} style={{ backgroundColor: '#52a447' }}>Approve</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRequestStatus(r, 'Rejected')}>Reject</Button>
                            </div>
                          ) : <span className={styles.mutedInfo}>Reviewed</span>}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan={6} className={styles.emptyTable}>No requests found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Complaints</h2>
              <div className={styles.gridContainer}>
                {complaints.map(c => (
                  <div key={c._id || c.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{c.title}</h3>
                      <Badge variant={c.status === 'Resolved' ? 'success' : c.status === 'In Progress' ? 'warning' : 'destructive'}>{c.status}</Badge>
                    </div>
                    <p className={styles.cardDesc}>{c.description}</p>
                    <div className={styles.cardMeta} style={{ marginBottom: '12px' }}>
                      <span>By {c.submittedBy} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}</span>
                      <Badge variant="outline">{c.category}</Badge>
                    </div>
                    {c.response && <div className={styles.responseBox}><strong>Response:</strong> {c.response}</div>}
                    {c.status === 'Pending' && <Button size="sm" onClick={() => handleResolveComplaint(c)} style={{ marginTop: '12px', width: '100%' }}>Mark Resolved</Button>}
                  </div>
                ))}
                {complaints.length === 0 && <p className={styles.emptyTable}>No complaints submitted.</p>}
              </div>
            </div>
          )}

          {activeTab === 'minutes' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Meeting Minutes</h2>
                <Button onClick={() => setMinuteDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> Record Minutes</Button>
              </div>
              <div className={styles.listContainer}>
                {minutes.map(m => (
                  <div key={m._id || m.id} className={styles.minuteCard}>
                    <div className={styles.minuteHeader}>
                      <h3 className={styles.minuteTitle}>{m.title}</h3>
                      <span className={styles.minuteDate}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : m.date}</span>
                    </div>
                    <p className={styles.minuteDesc}>{m.summary}</p>
                    <div className={styles.minuteFooter}><UserCheck size={14} style={{ marginRight: '6px' }} /> {m.attendees} attendees</div>
                  </div>
                ))}
                {minutes.length === 0 && <p className={styles.emptyTable}>No meeting minutes recorded yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Society Members</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept/Class</th><th>Status</th></tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m._id || m.id}>
                        <td className={styles.bold}>{m.fullName || m.name}</td>
                        <td className={styles.mutedInfo}>{m.email}</td>
                        <td><Badge variant="outline">{m.role}</Badge></td>
                        <td className={styles.mutedInfo}>{m.department || m.class || 'N/A'}</td>
                        <td><Badge variant={m.isActive ? 'success' : 'secondary'}>{m.isActive ? 'Active' : 'Pending'}</Badge></td>
                      </tr>
                    ))}
                    {members.length === 0 && <tr><td colSpan={5} className={styles.emptyTable}>No members found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      <Modal open={annDialog} onClose={() => !isSubmitting && setAnnDialog(false)} title="Post Announcement"
        footer={<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}><Button variant="outline" onClick={() => setAnnDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddAnnouncement} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Posting...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Post</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title <span style={{ color: 'red' }}>*</span></label><Input value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Priority</label><Select value={annForm.priority} onChange={e => setAnnForm(p => ({ ...p, priority: e.target.value }))} disabled={isSubmitting}><option value="Normal">Normal</option><option value="Important">Important</option><option value="Urgent">Urgent</option></Select></div>
          <div className={styles.field}><label>Description</label><Textarea value={annForm.description} onChange={e => setAnnForm(p => ({ ...p, description: e.target.value }))} placeholder="Details..." rows={4} disabled={isSubmitting} /></div>
        </div>
      </Modal>

      {/* Meeting Minutes Modal */}
      <Modal open={minuteDialog} onClose={() => !isSubmitting && setMinuteDialog(false)} title="Record Meeting Minutes"
        footer={<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}><Button variant="outline" onClick={() => setMinuteDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddMinute} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Save</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Meeting Title <span style={{ color: 'red' }}>*</span></label><Input value={minuteForm.title} onChange={e => setMinuteForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Weekly Sync" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Attendees Count</label><Input type="number" value={minuteForm.attendees} onChange={e => setMinuteForm(p => ({ ...p, attendees: e.target.value }))} placeholder="Number of attendees" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Summary</label><Textarea value={minuteForm.summary} onChange={e => setMinuteForm(p => ({ ...p, summary: e.target.value }))} placeholder="Meeting summary..." rows={4} disabled={isSubmitting} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default GeneralSecretaryDashboard;