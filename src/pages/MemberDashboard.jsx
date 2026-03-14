import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, CalendarDays, Star, Image, MessageSquare, Award, History, LogOut, Users, FileCheck, AlertTriangle, Bell, MessageCircle, Plus, Send } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Textarea from '../components/ui/Textarea.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { events, galleryImages, eventParticipants, eventFeedbacks, complaints as initialComplaints, requests as initialRequests, announcements, notifications as initialNotifications, funds } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import styles from './MemberDashboard.module.css';

const currentMember = { id: '6', name: 'Ayesha Malik', email: 'ayesha..society.edu', class: 'BSIT-4A' };

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('events');
  const [participateOpen, setParticipateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participateRole, setParticipateRole] = useState('Volunteer');
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [participations, setParticipations] = useState(
    eventParticipants.filter(p => p.memberId === currentMember.id)
  );
  const [feedbacks, setFeedbacks] = useState(eventFeedbacks);

  // Complaints & Requests state
  const [complaintList, setComplaintList] = useState(initialComplaints.filter(c => c.memberId === currentMember.id));
  const [requestList, setRequestList] = useState(initialRequests.filter(r => r.submittedBy === currentMember.name));
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '', category: 'General' });
  const [requestForm, setRequestForm] = useState({ title: '', type: 'Department' });

  // Notifications
  const [notifs] = useState(initialNotifications);

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');
  const completedEvents = events.filter(e => e.status === 'Completed');

  const myPerformance = participations.map(p => {
    const event = events.find(e => e.id === p.eventId);
    return { ...p, eventTitle: event?.title || 'Unknown', eventDate: event?.date || '' };
  });

  // My fund status
  const myFunds = funds.filter(f => f.memberName === currentMember.name);

  const handleParticipate = (event) => {
    const alreadyJoined = participations.find(p => p.eventId === event.id);
    if (alreadyJoined) {
      toast({ title: 'Already registered', description: `You are already a ${alreadyJoined.role} for this event.`, variant: 'destructive' });
      return;
    }
    setSelectedEvent(event);
    setParticipateRole('Volunteer');
    setParticipateOpen(true);
  };

  const confirmParticipate = () => {
    const newP = {
      id: String(Date.now()), eventId: selectedEvent.id, memberId: currentMember.id,
      memberName: currentMember.name, role: participateRole,
      teamwork: 0, communication: 0, responsibility: 0, totalScore: 0
    };
    setParticipations(prev => [...prev, newP]);
    toast({ title: 'Registered!', description: `You joined "${selectedEvent.title}" as ${participateRole}` });
    setParticipateOpen(false);
  };

  const openFeedback = (event) => {
    setSelectedEvent(event);
    setFeedbackForm({ rating: 5, comment: '' });
    setFeedbackOpen(true);
  };

  const submitFeedback = () => {
    if (!feedbackForm.comment) { toast({ title: 'Please write your feedback', variant: 'destructive' }); return; }
    setFeedbacks(prev => [...prev, { id: String(Date.now()), eventId: selectedEvent.id, memberName: currentMember.name, rating: feedbackForm.rating, comment: feedbackForm.comment, date: new Date().toISOString().split('T')[0] }]);
    toast({ title: 'Feedback Submitted' });
    setFeedbackOpen(false);
  };

  const handleSubmitComplaint = () => {
    if (!complaintForm.title || !complaintForm.description) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    setComplaintList(prev => [...prev, { id: String(Date.now()), ...complaintForm, submittedBy: currentMember.name, memberId: currentMember.id, date: new Date().toISOString().split('T')[0], status: 'Pending', response: '' }]);
    toast({ title: 'Complaint submitted' });
    setComplaintDialogOpen(false);
    setComplaintForm({ title: '', description: '', category: 'General' });
  };

  const handleSubmitRequest = () => {
    if (!requestForm.title) { toast({ title: 'Please enter a title', variant: 'destructive' }); return; }
    setRequestList(prev => [...prev, { id: String(Date.now()), title: requestForm.title, submittedBy: currentMember.name, date: new Date().toISOString().split('T')[0], status: 'Pending', type: requestForm.type }]);
    toast({ title: 'Request submitted' });
    setRequestDialogOpen(false);
    setRequestForm({ title: '', type: 'Department' });
  };

  const statusVariant = (s) => {
    if (s === 'Approved' || s === 'Resolved') return 'default';
    if (s === 'Rejected') return 'destructive';
    return 'secondary';
  };

  const tabs = [
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'history', label: 'My Participation', icon: History },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'announcements', label: 'Announcements', icon: MessageSquare },
    { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
    { id: 'requests', label: 'Requests', icon: FileCheck },
    { id: 'funds', label: 'Fund Status', icon: Users },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'feedback', label: 'Feedback', icon: Star },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Member Dashboard</h1>
              <p className={styles.headerSub}>Welcome, {currentMember.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.memberInfo}>{currentMember.class}</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><Bell size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/chat')}><MessageCircle size={14} /> Chat</Button>
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
                <span className={styles.notifBadge}>{notifs.filter(n => !n.read).length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'events' && (
            <div>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              <div className={styles.eventGrid}>
                {upcomingEvents.map(e => {
                  const joined = participations.find(p => p.eventId === e.id);
                  return (
                    <div key={e.id} className={styles.eventCard}>
                      <div className={styles.eventTop}>
                        <Badge variant="default">{e.status}</Badge>
                        <span className={styles.eventDate}><CalendarDays size={12} /> {e.date}</span>
                      </div>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <p className={styles.eventBudget}>Budget: Rs {e.budget.toLocaleString()}</p>
                      {joined ? <Badge variant="secondary">Joined as {joined.role}</Badge> : (
                        <Button size="sm" onClick={() => handleParticipate(e)}><Users size={14} /> Participate</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h2 className={styles.sectionTitle}>My Participation History</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Event</th><th>Date</th><th>Role</th><th>Status</th></tr></thead>
                  <tbody>
                    {myPerformance.map(p => (
                      <tr key={p.id}>
                        <td className={styles.bold}>{p.eventTitle}</td>
                        <td className={styles.muted}>{p.eventDate}</td>
                        <td><Badge variant="secondary">{p.role}</Badge></td>
                        <td><Badge variant="default">Participated</Badge></td>
                      </tr>
                    ))}
                    {myPerformance.length === 0 && <tr><td colSpan={4} className={styles.empty}>No participation history yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div>
              <h2 className={styles.sectionTitle}>Performance Record</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Event</th><th>Role</th><th>Teamwork</th><th>Communication</th><th>Responsibility</th><th>Total</th></tr></thead>
                  <tbody>
                    {myPerformance.map(p => (
                      <tr key={p.id}>
                        <td className={styles.bold}>{p.eventTitle}</td>
                        <td><Badge variant="secondary">{p.role}</Badge></td>
                        <td>{p.teamwork}/5</td><td>{p.communication}/5</td><td>{p.responsibility}/5</td>
                        <td className={styles.bold}>{p.totalScore}/15</td>
                      </tr>
                    ))}
                    {myPerformance.length === 0 && <tr><td colSpan={6} className={styles.empty}>No performance records yet</td></tr>}
                  </tbody>
                </table>
              </div>
              {myPerformance.length > 0 && (
                <div className={styles.perfSummary}>
                  <div className={styles.perfCard}><span className={styles.perfLabel}>Average Score</span><span className={styles.perfValue}>{(myPerformance.reduce((s, p) => s + p.totalScore, 0) / myPerformance.length).toFixed(1)}/15</span></div>
                  <div className={styles.perfCard}><span className={styles.perfLabel}>Events Participated</span><span className={styles.perfValue}>{myPerformance.length}</span></div>
                </div>
              )}
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

          {activeTab === 'complaints' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>My Complaints</h2>
                <Button size="sm" onClick={() => setComplaintDialogOpen(true)}><Plus size={14} /> Submit Complaint</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Response</th></tr></thead>
                  <tbody>
                    {complaintList.map(c => (
                      <tr key={c.id}>
                        <td className={styles.bold}>{c.title}</td>
                        <td><Badge variant="secondary">{c.category}</Badge></td>
                        <td className={styles.muted}>{c.date}</td>
                        <td><Badge variant={statusVariant(c.status)}>{c.status}</Badge></td>
                        <td className={styles.muted}>{c.response || '—'}</td>
                      </tr>
                    ))}
                    {complaintList.length === 0 && <tr><td colSpan={5} className={styles.empty}>No complaints submitted</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>My Requests</h2>
                <Button size="sm" onClick={() => setRequestDialogOpen(true)}><Plus size={14} /> Submit Request</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {requestList.map(r => (
                      <tr key={r.id}>
                        <td className={styles.bold}>{r.title}</td>
                        <td><Badge variant="secondary">{r.type}</Badge></td>
                        <td className={styles.muted}>{r.date}</td>
                        <td><Badge variant={statusVariant(r.status)}>{r.status}</Badge></td>
                      </tr>
                    ))}
                    {requestList.length === 0 && <tr><td colSpan={4} className={styles.empty}>No requests submitted</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'funds' && (
            <div>
              <h2 className={styles.sectionTitle}>My Fund Status</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {myFunds.map(f => (
                      <tr key={f.id}>
                        <td className={styles.bold}>Rs {f.amount.toLocaleString()}</td>
                        <td className={styles.muted}>{f.date}</td>
                        <td><Badge variant={f.status === 'Paid' ? 'default' : 'destructive'}>{f.status}</Badge></td>
                      </tr>
                    ))}
                    {myFunds.length === 0 && <tr><td colSpan={3} className={styles.empty}>No fund records</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Gallery</h2>
              <div className={styles.galleryGrid}>
                {galleryImages.map(img => (
                  <div key={img.id} className={styles.galleryItem}>
                    <img src={img.url} alt={img.caption} className={styles.galleryImg} />
                    <div className={styles.galleryOverlay}>
                      <span className={styles.galleryEvent}>{img.event}</span>
                      <span className={styles.galleryCaption}>{img.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Feedback</h2>
              <p className={styles.feedbackInfo}>Share your feedback for completed events.</p>
              <div className={styles.eventGrid}>
                {completedEvents.map(e => {
                  const myFb = feedbacks.find(f => f.eventId === e.id && f.memberName === currentMember.name);
                  return (
                    <div key={e.id} className={styles.eventCard}>
                      <h3 className={styles.eventTitle}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <p className={styles.eventDate}>{e.date}</p>
                      {myFb ? (
                        <div className={styles.fbGiven}>
                          <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= myFb.rating ? 'var(--warning)' : 'none'} color={s <= myFb.rating ? 'var(--warning)' : 'var(--text-light)'} />)}</div>
                          <p className={styles.muted}>{myFb.comment}</p>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openFeedback(e)}><MessageSquare size={14} /> Give Feedback</Button>
                      )}
                    </div>
                  );
                })}
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

      {/* Participate Modal */}
      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title="Join Event"
        footer={<><Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button><Button onClick={confirmParticipate}>Confirm</Button></>}>
        {selectedEvent && (
          <div className={styles.formFields}>
            <p className={styles.muted}>You're joining: <strong>{selectedEvent.title}</strong></p>
            <div className={styles.field}><label>Select Your Role</label>
              <Select value={participateRole} onChange={e => setParticipateRole(e.target.value)}>
                <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Coordinator">Coordinator</option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} title="Event Feedback"
        footer={<><Button variant="outline" onClick={() => setFeedbackOpen(false)}>Cancel</Button><Button onClick={submitFeedback}>Submit</Button></>}>
        {selectedEvent && (
          <div className={styles.formFields}>
            <p className={styles.muted}>Feedback for: <strong>{selectedEvent.title}</strong></p>
            <div className={styles.field}><label>Rating</label>
              <div className={styles.stars}>{[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setFeedbackForm(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
                  <Star size={28} fill={s <= feedbackForm.rating ? 'var(--warning)' : 'none'} color={s <= feedbackForm.rating ? 'var(--warning)' : 'var(--text-light)'} />
                </button>
              ))}</div>
            </div>
            <div className={styles.field}><label>Your Feedback *</label>
              <Textarea placeholder="Share your experience..." rows={4} value={feedbackForm.comment} onChange={e => setFeedbackForm(p => ({ ...p, comment: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>

      {/* Complaint Modal */}
      <Modal open={complaintDialogOpen} onClose={() => setComplaintDialogOpen(false)} title="Submit Complaint"
        footer={<><Button variant="outline" onClick={() => setComplaintDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmitComplaint}><Send size={14} /> Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={complaintForm.title} onChange={e => setComplaintForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief title" /></div>
          <div className={styles.field}><label>Category</label>
            <Select value={complaintForm.category} onChange={e => setComplaintForm(p => ({ ...p, category: e.target.value }))}>
              <option value="General">General</option><option value="Infrastructure">Infrastructure</option><option value="Events">Events</option><option value="Finance">Finance</option><option value="Other">Other</option>
            </Select>
          </div>
          <div className={styles.field}><label>Description *</label>
            <Textarea value={complaintForm.description} onChange={e => setComplaintForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your complaint..." rows={4} />
          </div>
        </div>
      </Modal>

      {/* Request Modal */}
      <Modal open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} title="Submit Request"
        footer={<><Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}><Send size={14} /> Submit</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={requestForm.title} onChange={e => setRequestForm(p => ({ ...p, title: e.target.value }))} placeholder="Request title" /></div>
          <div className={styles.field}><label>Type</label>
            <Select value={requestForm.type} onChange={e => setRequestForm(p => ({ ...p, type: e.target.value }))}>
              <option value="Department">Department</option><option value="Budget">Budget</option><option value="Event">Event</option><option value="Other">Other</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemberDashboard;