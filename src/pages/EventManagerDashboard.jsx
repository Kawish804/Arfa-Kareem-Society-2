import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Users, Bell, LogOut, Plus, Send, MapPin, Clock, Trophy, Star, CheckCircle, XCircle, Eye } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { events as initialEvents, eventParticipants, eventFeedbacks, notifications as initialNotifications } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './EventManagerDashboard.module.css';

const currentUser = { name: 'Bilal Hassan', role: 'Event Manager' };

const EventManagerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('events');
  const [eventList, setEventList] = useState(initialEvents);
  const [notifs] = useState(initialNotifications);
  const [participants, setParticipants] = useState(eventParticipants);
  const [feedbacks] = useState(eventFeedbacks);

  // Event form
  const [eventDialog, setEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'Seminar', date: '', time: '', venue: '', description: '', budget: '', maxParticipants: '', status: 'Upcoming', organizer: '', eligibility: 'All Students' });

  // View details
  const [viewEvent, setViewEvent] = useState(null);

  // Participant registration
  const [regDialog, setRegDialog] = useState(false);
  const [regForm, setRegForm] = useState({ memberName: '', role: 'Participant' });
  const [regEvent, setRegEvent] = useState(null);

  const upcomingEvents = eventList.filter(e => e.status === 'Upcoming');
  const completedEvents = eventList.filter(e => e.status === 'Completed');
  const totalParticipants = participants.length;
  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0';

  const openCreate = () => {
    setEditingEvent(null);
    setForm({ title: '', type: 'Seminar', date: '', time: '', venue: '', description: '', budget: '', maxParticipants: '', status: 'Upcoming', organizer: '', eligibility: 'All Students' });
    setEventDialog(true);
  };

  const openEdit = (e) => {
    setEditingEvent(e);
    setForm({ title: e.title, type: e.type || 'Seminar', date: e.date, time: e.time || '', venue: e.venue || '', description: e.description, budget: String(e.budget), maxParticipants: String(e.maxParticipants || ''), status: e.status, organizer: e.organizer || '', eligibility: e.eligibility || 'All Students' });
    setEventDialog(true);
  };

  const handleSaveEvent = () => {
    if (!form.title || !form.date) { toast({ title: 'Title and date required', variant: 'destructive' }); return; }
    const eventData = { ...form, budget: Number(form.budget) || 0, maxParticipants: Number(form.maxParticipants) || 0 };
    if (editingEvent) {
      setEventList(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...eventData } : e));
      toast({ title: 'Event updated' });
    } else {
      setEventList(prev => [...prev, { id: String(Date.now()), ...eventData }]);
      toast({ title: 'Event created' });
    }
    setEventDialog(false);
  };

  const handleDelete = (e) => {
    setEventList(prev => prev.filter(ev => ev.id !== e.id));
    toast({ title: 'Event deleted' });
  };

  const openRegister = (e) => { setRegEvent(e); setRegForm({ memberName: '', role: 'Participant' }); setRegDialog(true); };

  const handleRegister = () => {
    if (!regForm.memberName) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setParticipants(prev => [...prev, { id: String(Date.now()), eventId: regEvent.id, memberId: String(Date.now()), memberName: regForm.memberName, role: regForm.role, teamwork: 0, communication: 0, responsibility: 0, totalScore: 0 }]);
    toast({ title: `${regForm.memberName} registered for ${regEvent.title}` });
    setRegDialog(false);
  };

  const getEventParticipants = (eventId) => participants.filter(p => p.eventId === eventId);
  const getEventFeedbacks = (eventId) => feedbacks.filter(f => f.eventId === eventId);

  const tabs = [
    { id: 'events', label: 'My Events', icon: CalendarDays },
    { id: 'participants', label: 'Participants', icon: Users },
    { id: 'feedback', label: 'Feedback', icon: Star },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><CalendarDays size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Event Manager</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Event Manager</Badge>
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
          {activeTab === 'events' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Events</h2>
                <Button size="sm" onClick={openCreate}><Plus size={14} /> Create Event</Button>
              </div>

              <div className={styles.eventStats}>
                <div className={styles.eStat}><span className={styles.eStatNum}>{eventList.length}</span><span className={styles.eStatLabel}>Total Events</span></div>
                <div className={styles.eStat}><span className={styles.eStatNum}>{upcomingEvents.length}</span><span className={styles.eStatLabel}>Upcoming</span></div>
                <div className={styles.eStat}><span className={styles.eStatNum}>{completedEvents.length}</span><span className={styles.eStatLabel}>Completed</span></div>
                <div className={styles.eStat}><span className={styles.eStatNum}>{totalParticipants}</span><span className={styles.eStatLabel}>Total Participants</span></div>
              </div>

              <div className={styles.eventGrid}>
                {eventList.map(e => (
                  <div key={e.id} className={styles.eventCard}>
                    <div className={styles.eventTop}>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                      {e.type && <Badge variant="outline">{e.type}</Badge>}
                    </div>
                    <h3 className={styles.eventTitle}>{e.title}</h3>
                    <div className={styles.eventMeta}>
                      <span><CalendarDays size={12} /> {e.date}</span>
                      {e.venue && <span><MapPin size={12} /> {e.venue}</span>}
                    </div>
                    <p className={styles.eventDesc}>{e.description}</p>
                    <div className={styles.eventFooter}>
                      <span className={styles.muted}>Budget: Rs {(e.budget || 0).toLocaleString()}</span>
                      <span className={styles.muted}>{getEventParticipants(e.id).length}{e.maxParticipants ? `/${e.maxParticipants}` : ''} joined</span>
                    </div>
                    <div className={styles.eventActions}>
                      <Button variant="outline" size="sm" onClick={() => setViewEvent(e)}><Eye size={13} /> View</Button>
                      <Button variant="outline" size="sm" onClick={() => openRegister(e)}><Users size={13} /> Register</Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(e)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(e)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div>
              <h2 className={styles.sectionTitle}>All Participants</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Name</th><th>Event</th><th>Role</th><th>Teamwork</th><th>Communication</th><th>Total Score</th></tr></thead>
                  <tbody>
                    {participants.map(p => {
                      const ev = eventList.find(e => e.id === p.eventId);
                      return (
                        <tr key={p.id}>
                          <td className={styles.bold}>{p.memberName}</td>
                          <td className={styles.muted}>{ev ? ev.title : 'Unknown'}</td>
                          <td><Badge variant="secondary">{p.role}</Badge></td>
                          <td>{p.teamwork}/10</td>
                          <td>{p.communication}/10</td>
                          <td className={styles.bold}>{p.totalScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Feedback</h2>
              <div className={styles.feedbackStats}>
                <div className={styles.eStat}><span className={styles.eStatNum}>{avgRating} ⭐</span><span className={styles.eStatLabel}>Avg Rating</span></div>
                <div className={styles.eStat}><span className={styles.eStatNum}>{feedbacks.length}</span><span className={styles.eStatLabel}>Total Reviews</span></div>
              </div>
              <div className={styles.feedbackGrid}>
                {feedbacks.map(f => (
                  <div key={f.id} className={styles.feedbackCard}>
                    <div className={styles.fbTop}>
                      <span className={styles.bold}>{f.memberName}</span>
                      <span className={styles.stars}>{'⭐'.repeat(f.rating)}</span>
                    </div>
                    <p className={styles.fbComment}>{f.comment}</p>
                    <span className={styles.muted}>{f.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Timeline</h2>
              <div className={styles.timeline}>
                {[...eventList].sort((a, b) => a.date.localeCompare(b.date)).map((e, i) => (
                  <div key={e.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot}>
                      {e.status === 'Completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <h4 className={styles.timelineTitle}>{e.title}</h4>
                        <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                      </div>
                      <p className={styles.muted}>{e.date} {e.venue ? `• ${e.venue}` : ''}</p>
                      <p className={styles.timelineDesc}>{e.description}</p>
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

      {/* Create/Edit Event Modal */}
      <Modal open={eventDialog} onClose={() => setEventDialog(false)} title={editingEvent ? 'Edit Event' : 'Create Event'}
        footer={<><Button variant="outline" onClick={() => setEventDialog(false)}>Cancel</Button><Button onClick={handleSaveEvent}><Send size={14} /> {editingEvent ? 'Update' : 'Create'}</Button></>}>
        <div className={styles.formScroll}>
          <div className={styles.formFields}>
            <div className={styles.fieldRow}>
              <div className={styles.field}><label>Event Title *</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Tech Summit" /></div>
              <div className={styles.field}><label>Event Type</label><Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="Seminar">Seminar</option><option value="Workshop">Workshop</option><option value="Hackathon">Hackathon</option><option value="Competition">Competition</option><option value="Sports">Sports</option><option value="Cultural">Cultural</option><option value="Social">Social</option><option value="Conference">Conference</option>
              </Select></div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}><label>Date *</label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className={styles.field}><label>Time</label><Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
            </div>
            <div className={styles.field}><label>Venue</label><Input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="e.g. Main Auditorium" /></div>
            <div className={styles.field}><label>Description</label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Event details..." rows={3} /></div>
            <div className={styles.fieldRow}>
              <div className={styles.field}><label>Budget (Rs)</label><Input type="number" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} /></div>
              <div className={styles.field}><label>Max Participants</label><Input type="number" value={form.maxParticipants} onChange={e => setForm(p => ({ ...p, maxParticipants: e.target.value }))} /></div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}><label>Organizer</label><Input value={form.organizer} onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))} placeholder="Organizer name" /></div>
              <div className={styles.field}><label>Eligibility</label><Select value={form.eligibility} onChange={e => setForm(p => ({ ...p, eligibility: e.target.value }))}>
                <option value="All Students">All Students</option><option value="Members Only">Members Only</option><option value="Department Specific">Department Specific</option><option value="Open for All">Open for All</option>
              </Select></div>
            </div>
            <div className={styles.field}><label>Status</label><Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
            </Select></div>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal open={!!viewEvent} onClose={() => setViewEvent(null)} title={viewEvent?.title || 'Event Details'}
        footer={<Button variant="outline" onClick={() => setViewEvent(null)}>Close</Button>}>
        {viewEvent && (
          <div className={styles.detailGrid}>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Type</span><span>{viewEvent.type || 'General'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Date</span><span>{viewEvent.date}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Venue</span><span>{viewEvent.venue || '—'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Budget</span><span>Rs {(viewEvent.budget || 0).toLocaleString()}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Max Participants</span><span>{viewEvent.maxParticipants || 'Unlimited'}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Participants</span><span>{getEventParticipants(viewEvent.id).length}</span></div>
            <div className={styles.detailRow}><span className={styles.detailLabel}>Status</span><Badge variant={viewEvent.status === 'Upcoming' ? 'default' : 'secondary'}>{viewEvent.status}</Badge></div>
            <div className={styles.detailFull}><span className={styles.detailLabel}>Description</span><p className={styles.muted}>{viewEvent.description}</p></div>
          </div>
        )}
      </Modal>

      {/* Register Participant Modal */}
      <Modal open={regDialog} onClose={() => setRegDialog(false)} title={`Register for ${regEvent?.title || ''}`}
        footer={<><Button variant="outline" onClick={() => setRegDialog(false)}>Cancel</Button><Button onClick={handleRegister}><Send size={14} /> Register</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Participant Name *</label><Input value={regForm.memberName} onChange={e => setRegForm(p => ({ ...p, memberName: e.target.value }))} placeholder="Full name" /></div>
          <div className={styles.field}><label>Role</label><Select value={regForm.role} onChange={e => setRegForm(p => ({ ...p, role: e.target.value }))}>
            <option value="Participant">Participant</option><option value="Volunteer">Volunteer</option><option value="Speaker">Speaker</option><option value="Judge">Judge</option><option value="Organizer">Organizer</option>
          </Select></div>
        </div>
      </Modal>
    </div>
  );
};

export default EventManagerDashboard;
