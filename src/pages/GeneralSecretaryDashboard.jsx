import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Megaphone, Users, Bell, LogOut, Plus, Send, FileText, ClipboardList, MessageSquare, UserCheck, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // 🔴 LIVE USER
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './GeneralSecretaryDashboard.module.css';

const GeneralSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // 🔴 LIVE DATABASE STATES
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [notifs, setNotifs] = useState([]);

  // Modals
  const [annDialog, setAnnDialog] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', description: '', priority: 'Normal' });
  const [minuteDialog, setMinuteDialog] = useState(false);
  const [minuteForm, setMinuteForm] = useState({ title: '', attendees: '', summary: '' });

  // 🔴 FETCH ALL DATA ON LOAD
  useEffect(() => {
    const fetchGSData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [memRes, annRes, reqRes, compRes, evRes, minRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/users', { headers }),
          fetch('http://localhost:5000/api/announcements', { headers }),
          fetch('http://localhost:5000/api/requests', { headers }),
          fetch('http://localhost:5000/api/complaints', { headers }).catch(() => ({ ok: false })), // New endpoint
          fetch('http://localhost:5000/api/events', { headers }),
          fetch('http://localhost:5000/api/minutes', { headers }).catch(() => ({ ok: false })), // New endpoint
          fetch('http://localhost:5000/api/notifications/all', { headers })
        ]);

        if (memRes.ok) setMembers(await memRes.json());
        if (annRes.ok) setAnnouncements(await annRes.json());
        if (reqRes.ok) setRequests(await reqRes.json());
        if (compRes.ok) setComplaints(await compRes.json());
        if (evRes.ok) setEvents(await evRes.json());
        if (minRes.ok) setMinutes(await minRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        toast({ title: 'Failed to sync society data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchGSData();
  }, [currentUser, toast]);

  // 🔴 DYNAMIC CALCULATIONS
  const activeMembers = members.filter(m => m.status === 'Active' || m.isActive).length;
  const pendingRequests = requests.filter(r => r.status === 'Pending').length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
  const unreadNotifs = notifs.filter(n => !n.read).length;

  // 🔴 API ACTIONS
  const handleAddAnnouncement = async () => {
    if (!annForm.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    try {
      const payload = { ...annForm, postedBy: currentUser?.fullName, date: new Date().toISOString() };
      const res = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newAnn = await res.json();
        setAnnouncements(prev => [newAnn, ...prev]);
        toast({ title: 'Announcement posted successfully' });
        setAnnDialog(false);
        setAnnForm({ title: '', description: '', priority: 'Normal' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to post announcement', variant: 'destructive' }); }
  };

  const handleAddMinute = async () => {
    if (!minuteForm.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    try {
      const payload = { ...minuteForm, recordedBy: currentUser?.fullName, date: new Date().toISOString() };
      const res = await fetch('http://localhost:5000/api/minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newMin = await res.json();
        setMinutes(prev => [newMin, ...prev]);
        toast({ title: 'Minutes recorded' });
        setMinuteDialog(false);
        setMinuteForm({ title: '', attendees: '', summary: '' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to record minutes', variant: 'destructive' }); }
  };

  const handleResolveComplaint = async (c) => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${c._id || c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        setComplaints(prev => prev.map(x => (x._id === c._id || x.id === c.id) ? { ...x, status: 'Resolved' } : x));
        toast({ title: 'Complaint marked as resolved' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to update complaint', variant: 'destructive' }); }
  };

  const handleRequestStatus = async (r, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/requests/${r._id || r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setRequestList(prev => prev.map(x => (x._id === r._id || x.id === r.id) ? { ...x, status: newStatus } : x));
        toast({ title: `Request ${newStatus}` });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to update request', variant: 'destructive' }); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'minutes', label: 'Meeting Minutes', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
  ];

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Syncing General Secretary Workspace...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>General Secretary</h1>
              <p className={styles.headerSub}>Welcome, {currentUser?.fullName || 'General Secretary'}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">General Secretary</Badge>
            <TransferRoleWidget />
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={14} />
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{unreadNotifs}</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}><LogOut size={14} /> Logout</Button>
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
          {activeTab === 'overview' && (
            <div>
              <h2 className={styles.sectionTitle}>Society Overview</h2>
              <div className={styles.overviewStats}>
                <div className={styles.oStatCard}>
                  <Users size={24} className={styles.oStatIcon} />
                  <div><span className={styles.oStatNum}>{activeMembers}</span><span className={styles.oStatLabel}>Active Members</span></div>
                </div>
                <div className={styles.oStatCard}>
                  <FileText size={24} className={styles.oStatIcon} />
                  <div><span className={styles.oStatNum}>{pendingRequests}</span><span className={styles.oStatLabel}>Pending Requests</span></div>
                </div>
                <div className={styles.oStatCard}>
                  <AlertTriangle size={24} className={styles.oStatIcon} />
                  <div><span className={styles.oStatNum}>{pendingComplaints}</span><span className={styles.oStatLabel}>Open Complaints</span></div>
                </div>
                <div className={styles.oStatCard}>
                  <Megaphone size={24} className={styles.oStatIcon} />
                  <div><span className={styles.oStatNum}>{announcements.length}</span><span className={styles.oStatLabel}>Announcements</span></div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                {requests.filter(r => r.status === 'Pending').slice(0, 3).map(r => (
                  <div key={r._id || r.id} className={styles.activityItem}>
                    <FileText size={16} className={styles.activityIcon} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{r.title}</span>
                      <span className={styles.muted}>by {r.submittedBy || r.studentName} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</span>
                    </div>
                    <Badge variant="secondary">Pending Request</Badge>
                  </div>
                ))}
                {complaints.filter(c => c.status === 'Pending').slice(0, 2).map(c => (
                  <div key={c._id || c.id} className={styles.activityItem}>
                    <AlertTriangle size={16} className={styles.activityIcon} style={{ color: '#ef4444' }} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{c.title}</span>
                      <span className={styles.muted}>by {c.submittedBy} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}</span>
                    </div>
                    <Badge variant="destructive">Complaint</Badge>
                  </div>
                ))}
                {requests.length === 0 && complaints.length === 0 && <p className={styles.muted}>No recent pending activities.</p>}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 className={styles.sectionTitle}>Announcements</h2>
                <Button size="sm" onClick={() => setAnnDialog(true)}><Plus size={14} style={{ marginRight: '6px' }}/> Post Announcement</Button>
              </div>
              <div className={styles.annGrid} style={{ display: 'grid', gap: '15px' }}>
                {announcements.map(a => (
                  <div key={a._id || a.id} className={styles.annCard} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <div className={styles.annTop} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 className={styles.annTitle} style={{ margin: 0, fontWeight: 'bold' }}>{a.title}</h3>
                      {a.priority === 'Urgent' && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    <p className={styles.annDesc} style={{ color: '#475569', marginTop: '10px' }}>{a.description}</p>
                    <div className={styles.annMeta} style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
                      <span style={{ marginRight: '15px' }}>{a.postedDate || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '')}</span>
                      <span>By {a.postedBy}</span>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && <p className={styles.muted}>No announcements posted.</p>}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className={styles.sectionTitle}>Member Requests</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Submitted By</th><th>Type</th><th>Date</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r._id || r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td className={styles.muted}>{r.submittedBy || r.studentName}</td>
                        <td><Badge variant="outline">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date}</td>
                        <td><Badge variant={r.status === 'Approved' ? 'default' : r.status === 'Rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge></td>
                        <td style={{textAlign:'right'}}>
                          {r.status === 'Pending' && (
                            <div className={styles.actionBtns} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <Button size="sm" onClick={() => handleRequestStatus(r, 'Approved')}>Approve</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRequestStatus(r, 'Rejected')}>Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No requests found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div>
              <h2 className={styles.sectionTitle}>Complaints</h2>
              <div className={styles.complaintGrid} style={{ display: 'grid', gap: '15px' }}>
                {complaints.map(c => (
                  <div key={c._id || c.id} className={styles.complaintCard} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <div className={styles.complaintTop} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h3 className={styles.complaintTitle} style={{ margin: 0, fontWeight: 'bold' }}>{c.title}</h3>
                      <Badge variant={c.status === 'Resolved' ? 'default' : c.status === 'In Progress' ? 'secondary' : 'destructive'}>{c.status}</Badge>
                    </div>
                    <p className={styles.muted} style={{ margin: '0 0 10px 0' }}>{c.description}</p>
                    <div className={styles.complaintMeta} style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <span>By {c.submittedBy} • {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : c.date}</span>
                      <Badge variant="outline">{c.category}</Badge>
                    </div>
                    {c.response && <div className={styles.complaintResponse} style={{ marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '4px' }}><strong>Response:</strong> {c.response}</div>}
                    {c.status === 'Pending' && <Button size="sm" onClick={() => handleResolveComplaint(c)} style={{ marginTop: '10px' }}>Mark Resolved</Button>}
                  </div>
                ))}
                {complaints.length === 0 && <p className={styles.muted}>No complaints submitted.</p>}
              </div>
            </div>
          )}

          {activeTab === 'minutes' && (
            <div>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2 className={styles.sectionTitle}>Meeting Minutes</h2>
                <Button size="sm" onClick={() => setMinuteDialog(true)}><Plus size={14} style={{ marginRight: '6px' }} /> Add Minutes</Button>
              </div>
              <div className={styles.minutesList} style={{ display: 'grid', gap: '15px' }}>
                {minutes.map(m => (
                  <div key={m._id || m.id} className={styles.minuteCard} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                    <div className={styles.minuteTop} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 className={styles.minuteTitle} style={{ margin: 0, fontWeight: 'bold' }}>{m.title}</h3>
                      <span className={styles.muted}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : m.date}</span>
                    </div>
                    <p className={styles.muted} style={{ margin: '10px 0' }}>{m.summary}</p>
                    <span className={styles.minuteAttendees} style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}><UserCheck size={14} /> {m.attendees} attendees</span>
                  </div>
                ))}
                {minutes.length === 0 && <p className={styles.muted}>No meeting minutes recorded yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h2 className={styles.sectionTitle}>Society Members</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept/Class</th><th>Status</th></tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m._id || m.id}>
                        <td className={styles.bold}>{m.fullName || m.name}</td>
                        <td className={styles.muted}>{m.email}</td>
                        <td><Badge variant="secondary">{m.role}</Badge></td>
                        <td className={styles.muted}>{m.department || m.class || 'N/A'}</td>
                        <td><Badge variant={m.isActive ? 'default' : 'secondary'}>{m.isActive ? 'Active' : 'Pending'}</Badge></td>
                      </tr>
                    ))}
                    {members.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No members found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Modal */}
      <Modal open={annDialog} onClose={() => setAnnDialog(false)} title="Post Announcement"
        footer={<><Button variant="outline" onClick={() => setAnnDialog(false)}>Cancel</Button><Button onClick={handleAddAnnouncement}><Send size={14} style={{ marginRight: '6px' }} /> Post</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" /></div>
          <div className={styles.field}><label>Priority</label><Select value={annForm.priority} onChange={e => setAnnForm(p => ({ ...p, priority: e.target.value }))}>
            <option value="Normal">Normal</option><option value="Important">Important</option><option value="Urgent">Urgent</option>
          </Select></div>
          <div className={styles.field}><label>Description</label><Textarea value={annForm.description} onChange={e => setAnnForm(p => ({ ...p, description: e.target.value }))} placeholder="Announcement details..." rows={4} /></div>
        </div>
      </Modal>

      {/* Meeting Minutes Modal */}
      <Modal open={minuteDialog} onClose={() => setMinuteDialog(false)} title="Record Meeting Minutes"
        footer={<><Button variant="outline" onClick={() => setMinuteDialog(false)}>Cancel</Button><Button onClick={handleAddMinute}><Send size={14} style={{ marginRight: '6px' }} /> Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Meeting Title *</label><Input value={minuteForm.title} onChange={e => setMinuteForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Weekly Sync" /></div>
          <div className={styles.field}><label>Attendees Count</label><Input type="number" value={minuteForm.attendees} onChange={e => setMinuteForm(p => ({ ...p, attendees: e.target.value }))} placeholder="Number of attendees" /></div>
          <div className={styles.field}><label>Summary</label><Textarea value={minuteForm.summary} onChange={e => setMinuteForm(p => ({ ...p, summary: e.target.value }))} placeholder="Meeting summary..." rows={4} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default GeneralSecretaryDashboard;