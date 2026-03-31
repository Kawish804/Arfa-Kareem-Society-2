import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Megaphone, Users, Bell, LogOut, Plus, Send, FileText, ClipboardList, MessageSquare, UserCheck, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { members, announcements as initialAnnouncements, requests as initialRequests, events, complaints as initialComplaints, notifications as initialNotifications } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './GeneralSecretaryDashboard.module.css';

const currentUser = { name: 'Fatima Ali', role: 'General Secretary' };

const GeneralSecretaryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [announcementList, setAnnouncementList] = useState(initialAnnouncements);
  const [requestList, setRequestList] = useState(initialRequests);
  const [complaintList, setComplaintList] = useState(initialComplaints);
  const [notifs] = useState(initialNotifications);

  // Announcement dialog
  const [annDialog, setAnnDialog] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', description: '', priority: 'Normal' });

  // Meeting minutes
  const [minutes, setMinutes] = useState([
    { id: '1', title: 'Weekly Sync - Week 12', date: '2024-03-15', attendees: 8, summary: 'Discussed upcoming tech summit planning and budget allocation.' },
    { id: '2', title: 'Emergency Meeting', date: '2024-03-10', attendees: 5, summary: 'Resolved venue conflict for annual day event.' },
  ]);
  const [minuteDialog, setMinuteDialog] = useState(false);
  const [minuteForm, setMinuteForm] = useState({ title: '', attendees: '', summary: '' });

  const activeMembers = members.filter(m => m.status === 'Active').length;
  const pendingRequests = requestList.filter(r => r.status === 'Pending').length;
  const pendingComplaints = complaintList.filter(c => c.status === 'Pending').length;
  const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;

  const handleAddAnnouncement = () => {
    if (!annForm.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setAnnouncementList(prev => [...prev, { id: String(Date.now()), title: annForm.title, description: annForm.description, postedDate: new Date().toISOString().split('T')[0], postedBy: currentUser.name, priority: annForm.priority }]);
    toast({ title: 'Announcement posted' });
    setAnnDialog(false);
    setAnnForm({ title: '', description: '', priority: 'Normal' });
  };

  const handleAddMinute = () => {
    if (!minuteForm.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setMinutes(prev => [...prev, { id: String(Date.now()), title: minuteForm.title, date: new Date().toISOString().split('T')[0], attendees: Number(minuteForm.attendees) || 0, summary: minuteForm.summary }]);
    toast({ title: 'Minutes recorded' });
    setMinuteDialog(false);
    setMinuteForm({ title: '', attendees: '', summary: '' });
  };

  const handleResolveComplaint = (c) => {
    setComplaintList(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Resolved' } : x));
    toast({ title: 'Complaint resolved' });
  };

  const handleApproveRequest = (r) => {
    setRequestList(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Approved' } : x));
    toast({ title: 'Request approved' });
  };

  const handleRejectRequest = (r) => {
    setRequestList(prev => prev.map(x => x.id === r.id ? { ...x, status: 'Rejected' } : x));
    toast({ title: 'Request rejected' });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'minutes', label: 'Meeting Minutes', icon: MessageSquare },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>General Secretary</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">General Secretary</Badge>
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
                  <div><span className={styles.oStatNum}>{announcementList.length}</span><span className={styles.oStatLabel}>Announcements</span></div>
                </div>
              </div>

              <h3 className={styles.subTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                {requestList.filter(r => r.status === 'Pending').slice(0, 3).map(r => (
                  <div key={r.id} className={styles.activityItem}>
                    <FileText size={16} className={styles.activityIcon} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{r.title}</span>
                      <span className={styles.muted}>by {r.submittedBy} • {r.date}</span>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
                {complaintList.filter(c => c.status === 'Pending').slice(0, 2).map(c => (
                  <div key={c.id} className={styles.activityItem}>
                    <AlertTriangle size={16} className={styles.activityIcon} />
                    <div className={styles.activityInfo}>
                      <span className={styles.bold}>{c.title}</span>
                      <span className={styles.muted}>by {c.submittedBy} • {c.date}</span>
                    </div>
                    <Badge variant="destructive">Complaint</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Announcements</h2>
                <Button size="sm" onClick={() => setAnnDialog(true)}><Plus size={14} /> Post Announcement</Button>
              </div>
              <div className={styles.annGrid}>
                {announcementList.map(a => (
                  <div key={a.id} className={styles.annCard}>
                    <div className={styles.annTop}>
                      <h3 className={styles.annTitle}>{a.title}</h3>
                      {a.priority === 'Urgent' && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    <p className={styles.annDesc}>{a.description}</p>
                    <div className={styles.annMeta}>
                      <span className={styles.muted}>{a.postedDate}</span>
                      <span className={styles.muted}>By {a.postedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className={styles.sectionTitle}>Member Requests</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Submitted By</th><th>Type</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {requestList.map(r => (
                      <tr key={r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td className={styles.muted}>{r.submittedBy}</td>
                        <td><Badge variant="secondary">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.date}</td>
                        <td><Badge variant={r.status === 'Approved' ? 'default' : r.status === 'Rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge></td>
                        <td>
                          {r.status === 'Pending' && (
                            <div className={styles.actionBtns}>
                              <Button size="sm" onClick={() => handleApproveRequest(r)}>Approve</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleRejectRequest(r)}>Reject</Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div>
              <h2 className={styles.sectionTitle}>Complaints</h2>
              <div className={styles.complaintGrid}>
                {complaintList.map(c => (
                  <div key={c.id} className={styles.complaintCard}>
                    <div className={styles.complaintTop}>
                      <h3 className={styles.complaintTitle}>{c.title}</h3>
                      <Badge variant={c.status === 'Resolved' ? 'default' : c.status === 'In Progress' ? 'secondary' : 'destructive'}>{c.status}</Badge>
                    </div>
                    <p className={styles.muted}>{c.description}</p>
                    <div className={styles.complaintMeta}>
                      <span className={styles.muted}>By {c.submittedBy} • {c.date}</span>
                      <Badge variant="outline">{c.category}</Badge>
                    </div>
                    {c.response && <div className={styles.complaintResponse}><strong>Response:</strong> {c.response}</div>}
                    {c.status === 'Pending' && <Button size="sm" onClick={() => handleResolveComplaint(c)} className={styles.resolveBtn}>Mark Resolved</Button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'minutes' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Meeting Minutes</h2>
                <Button size="sm" onClick={() => setMinuteDialog(true)}><Plus size={14} /> Add Minutes</Button>
              </div>
              <div className={styles.minutesList}>
                {minutes.map(m => (
                  <div key={m.id} className={styles.minuteCard}>
                    <div className={styles.minuteTop}>
                      <h3 className={styles.minuteTitle}>{m.title}</h3>
                      <span className={styles.muted}>{m.date}</span>
                    </div>
                    <p className={styles.muted}>{m.summary}</p>
                    <span className={styles.minuteAttendees}><UserCheck size={14} /> {m.attendees} attendees</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div>
              <h2 className={styles.sectionTitle}>Society Members</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Class</th><th>Status</th><th>Events</th></tr></thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td className={styles.bold}>{m.name}</td>
                        <td className={styles.muted}>{m.email}</td>
                        <td><Badge variant="secondary">{m.role}</Badge></td>
                        <td className={styles.muted}>{m.class}</td>
                        <td><Badge variant={m.status === 'Active' ? 'default' : 'secondary'}>{m.status}</Badge></td>
                        <td>{m.eventsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Announcement Modal */}
      <Modal open={annDialog} onClose={() => setAnnDialog(false)} title="Post Announcement"
        footer={<><Button variant="outline" onClick={() => setAnnDialog(false)}>Cancel</Button><Button onClick={handleAddAnnouncement}><Send size={14} /> Post</Button></>}>
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
        footer={<><Button variant="outline" onClick={() => setMinuteDialog(false)}>Cancel</Button><Button onClick={handleAddMinute}><Send size={14} /> Save</Button></>}>
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
