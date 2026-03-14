import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileCheck, CalendarDays, Megaphone, Bell, LogOut, Plus, Send } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Select from '../components/ui/Select.jsx';
import { requests as initialRequests, events, announcements, notifications as initialNotifications } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import styles from './CRDashboard.module.css';

const currentUser = { id: '8', name: 'Zainab Shah', email: 'zainab..society.edu', class: 'BSSE-6A', role: 'CR' };

const CRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [requestList, setRequestList] = useState(initialRequests);
  const [notifs] = useState(initialNotifications);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Department' });

  const myRequests = requestList.filter(r => r.submittedBy === currentUser.name);

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

  const statusVariant = (s) => {
    if (s === 'Approved') return 'default';
    if (s === 'Rejected') return 'destructive';
    return 'secondary';
  };

  const tabs = [
    { id: 'requests', label: 'Requests', icon: FileCheck },
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
              <p className={styles.headerSub}>Welcome, {currentUser.name} ({currentUser.class})</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Class Representative</Badge>
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

              <h3 className={styles.subTitle}>All Department Requests</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Submitted By</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {requestList.filter(r => r.type === 'Department').map(r => (
                      <tr key={r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td className={styles.muted}>{r.submittedBy}</td>
                        <td><Badge variant="secondary">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.date}</td>
                        <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                      </tr>
                    ))}
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
    </div>
  );
};

export default CRDashboard;