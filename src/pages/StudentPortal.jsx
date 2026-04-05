import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, CalendarDays, Megaphone, Image, Send, Users, LogOut,
  Heart, AlertTriangle, DollarSign, Clock, Trophy, BookOpen,
  Bell, Search, ChevronRight, Eye, UserPlus, User, FileText,
  CheckCircle, Menu, Home
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { galleryImages, funds } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './StudentPortal.module.css';

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'requests', label: 'My Requests', icon: FileText },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'gallery', label: 'Gallery', icon: Image },
];

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔴 LIVE DATABASE STATES
  const [dbEvents, setDbEvents] = useState([]);
  const [dbAnnouncements, setDbAnnouncements] = useState([]);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]); // Tracks statuses

  // Modals
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateEvent, setParticipateEvent] = useState(null);

  const [participateForm, setParticipateForm] = useState({ name: user?.fullName || '', role: 'Volunteer' });
  const [fundOpen, setFundOpen] = useState(false);
  const [fundForm, setFundForm] = useState({ name: user?.fullName || '', email: user?.email || '', amount: '', purpose: '', description: '' });
  const [form, setForm] = useState({ title: '', name: user?.fullName || '', type: '', eventId: '' });
  const [report, setReport] = useState({ name: user?.fullName || '', subject: '', message: '' });

  // --- 1. FETCH LIVE DATA ON LOAD ---
  useEffect(() => {
    const fetchPortalData = async () => {
      if (!user?.email) return;
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };

      try {
        const [evRes, annRes, reqRes, partRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/events', { headers }),
          fetch('http://localhost:5000/api/announcements', { headers }),
          fetch(`http://localhost:5000/api/requests/my-requests/${user.email}`, { headers }),
          fetch('http://localhost:5000/api/participants/all', { headers }),
          fetch('http://localhost:5000/api/notifications', { headers }) // Ensure this route exists!
        ]);

        if (evRes.ok) setDbEvents(await evRes.json());
        if (annRes.ok) setDbAnnouncements(await annRes.json());
        if (reqRes.ok) setMyRequests(await reqRes.json());

        if (partRes.ok) {
          const allParts = await partRes.json();
          setMyParticipations(allParts.filter(p => p.studentName === user.fullName));
        }

        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          // 🔴 Only show notifications meant for EVERYONE, or meant specifically for THIS user
          setDbNotifications(allNotifs.filter(n => !n.targetUser || n.targetUser === user.fullName));
        }

      } catch (error) {
        console.error("Failed to load portal data", error);
      }
    };
    fetchPortalData();
  }, [user]);

  const upcomingEvents = dbEvents.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing');
  const completedEvents = dbEvents.filter(e => e.status === 'Completed');
  const myFunds = funds.slice(0, 3);
  const unreadNotifs = dbNotifications.filter(n => !n.read).length;

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // --- 2. SUBMIT EVENT PARTICIPATION REQUEST ---
  // --- 2. SUBMIT EVENT PARTICIPATION REQUEST ---
  const handleParticipateSubmit = async () => {
    if (!participateForm.name) { toast({ title: 'Name is required', variant: 'destructive' }); return; }

    try {
      const payload = {
        studentName: participateForm.name,
        email: user?.email, // 🔴 THE FIX: This was missing! The DB needs this to save.
        rollNo: user?.rollNo || 'N/A',
        department: user?.department || 'N/A',
        contact: user?.phone || 'N/A',
        eventId: participateEvent._id || participateEvent.id,
        eventTitle: participateEvent.title,
        role: participateForm.role
      };

      const res = await fetch('http://localhost:5000/api/participants/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPart = await res.json();
        toast({ title: 'Request Sent!', description: `Your request to join ${participateEvent.title} has been submitted.` });
        setMyParticipations(prev => [...prev, newPart]);
        setRequestedEventIds(prev => [...prev, participateEvent._id]); // Disable button
        setParticipateOpen(false);
      } else {
        const errorData = await res.json();
        toast({ title: 'Submission Failed', description: errorData.error || 'Server rejected request', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // --- 3. SUBMIT GENERAL REQUEST ---
  const handleSubmitRequest = async () => {
    if (!form.name || !form.type) { toast({ title: 'Please fill all required fields', variant: 'destructive' }); return; }
    if (form.type !== 'Event Participation' && !form.title) { toast({ title: 'Please enter a request title', variant: 'destructive' }); return; }

    try {
      const payload = { title: form.title, type: form.type, submittedBy: form.name, email: user.email, role: user.role[0] || 'Student' };

      const res = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newReq = await res.json();
        setMyRequests(prev => [newReq, ...prev]);
        toast({ title: 'Request Submitted!', description: 'Your request has been sent to the admin for approval.' });
        setRequestOpen(false);
        setForm({ title: '', name: user?.fullName || '', type: '', eventId: '' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // 🔴 NEW: MARK NOTIFICATION AS READ
  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' });
      setDbNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Failed to mark notification as read");
    }
  };

  const statusVariant = (s) => {
    if (s === 'Approved' || s === 'Paid' || s === 'Upcoming') return 'success';
    if (s === 'Rejected') return 'destructive';
    return 'warning';
  };

  const renderSidebar = () => (
    <div className={styles.sidebarContent}>
      <div className={styles.sidebarBrand}>
        <div className={styles.brandIcon}><GraduationCap size={20} /></div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Arfa Kareem</span>
          <span className={styles.brandSub}>Student Portal</span>
        </div>
      </div>
      <nav className={styles.sidebarNav}>
        {sidebarItems.map(item => (
          <button
            key={item.id}
            className={`${styles.navItem} ${activeSection === item.id ? styles.navActive : ''}`}
            onClick={() => { setActiveSection(item.id); setMobileOpen(false); }}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.id === 'notifications' && unreadNotifs > 0 && (
              <span className={styles.navBadge}>{unreadNotifs}</span>
            )}
          </button>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          <LogOut size={18} /> <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>{renderSidebar()}</aside>
      {mobileOpen && <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />}
      {mobileOpen && <aside className={styles.mobileSidebar}>{renderSidebar()}</aside>}

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <h1 className={styles.pageTitle}>{sidebarItems.find(i => i.id === activeSection)?.label || 'Dashboard'}</h1>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.searchBox}>
              <Search size={16} />
              <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className={styles.userChip}>
              <div className={styles.avatar}>{user?.fullName?.charAt(0) || 'U'}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.fullName || 'Student'}</span>
                <span className={styles.userRole}>{user?.rollNo || 'Active Member'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {/* ======= OVERVIEW ======= */}
          {activeSection === 'overview' && (
            <div className={styles.overviewSection}>
              <div className={styles.welcomeCard}>
                <div className={styles.welcomeLeft}>
                  <h2 className={styles.welcomeGreeting}>Welcome back, {user?.fullName?.split(' ')[0] || 'Student'}! 👋</h2>
                  <p className={styles.welcomeSub}>Here's what's happening in the society today.</p>
                </div>
                <div className={styles.welcomeRight}>
                  <div className={styles.miniStat}><CalendarDays size={18} /><div><span className={styles.miniNum}>{upcomingEvents.length}</span><span className={styles.miniLabel}>Upcoming</span></div></div>
                  <div className={styles.miniStat}><FileText size={18} /><div><span className={styles.miniNum}>{myRequests.filter(r => r.status === 'Pending').length}</span><span className={styles.miniLabel}>Pending</span></div></div>
                  <div className={styles.miniStat}><Bell size={18} /><div><span className={styles.miniNum}>{unreadNotifs}</span><span className={styles.miniLabel}>Unread</span></div></div>
                  <div className={styles.miniStat}><Trophy size={18} /><div><span className={styles.miniNum}>{completedEvents.length}</span><span className={styles.miniLabel}>Attended</span></div></div>
                </div>
              </div>

              <div className={styles.quickGrid}>
                <button className={styles.quickCard} onClick={() => setRequestOpen(true)}><div className={styles.quickIcon} style={{ background: 'var(--secondary)' }}><Send size={20} /></div><span>Submit Request</span></button>
                <button className={styles.quickCard} onClick={() => setActiveSection('events')}><div className={styles.quickIcon} style={{ background: 'hsl(160, 84%, 39%)' }}><Users size={20} /></div><span>Join Event</span></button>
                <button className={styles.quickCard} onClick={() => setFundOpen(true)}><div className={styles.quickIcon} style={{ background: 'hsl(45, 93%, 47%)' }}><DollarSign size={20} /></div><span>Fund Appeal</span></button>
                <button className={styles.quickCard} onClick={() => setReportOpen(true)}><div className={styles.quickIcon} style={{ background: 'var(--destructive)' }}><AlertTriangle size={20} /></div><span>Report Issue</span></button>
              </div>

              <div className={styles.overviewGrid}>
                <div className={styles.overviewPanel}>
                  <div className={styles.panelHeader}>
                    <h3>Upcoming Events</h3>
                    <button className={styles.viewAll} onClick={() => setActiveSection('events')}>View All <ChevronRight size={14} /></button>
                  </div>
                  {upcomingEvents.slice(0, 3).map(e => (
                    <div key={e._id} className={styles.miniEventCard}>
                      <div className={styles.miniEventDate}><CalendarDays size={14} />{e.date}</div>
                      <span className={styles.miniEventName}>{e.title}</span>
                    </div>
                  ))}
                  {upcomingEvents.length === 0 && <p className={styles.emptyText}>No upcoming events</p>}
                </div>

                <div className={styles.overviewPanel}>
                  <div className={styles.panelHeader}>
                    <h3>Recent Requests</h3>
                    <button className={styles.viewAll} onClick={() => setActiveSection('requests')}>View All <ChevronRight size={14} /></button>
                  </div>
                  {myRequests.slice(0, 3).map(r => (
                    <div key={r._id} className={styles.miniRequestCard}>
                      <div>
                        <span className={styles.miniReqTitle}>{r.title}</span>
                        <span className={styles.miniReqDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                    </div>
                  ))}
                  {myRequests.length === 0 && <p className={styles.emptyText}>No recent requests</p>}
                </div>

                <div className={styles.overviewPanel}>
                  <div className={styles.panelHeader}>
                    <h3>Announcements</h3>
                    <button className={styles.viewAll} onClick={() => setActiveSection('announcements')}>View All <ChevronRight size={14} /></button>
                  </div>
                  {dbAnnouncements.slice(0, 3).map(a => (
                    <div key={a._id} className={styles.miniAnnCard}>
                      <span className={styles.miniAnnTitle}>{a.title}</span>
                      <span className={styles.miniAnnDate}>{a.postedDate}</span>
                    </div>
                  ))}
                  {dbAnnouncements.length === 0 && <p className={styles.emptyText}>No recent announcements</p>}
                </div>
              </div>
            </div>
          )}

          {/* ======= PROFILE ======= */}
          {activeSection === 'profile' && (
            <div className={styles.profileSection}>
              <div className={styles.profileCard}>
                <div className={styles.profileAvatar}>{user?.fullName?.charAt(0) || 'U'}</div>
                <h2 className={styles.profileName}>{user?.fullName}</h2>
                <span className={styles.profileRoll}>{user?.rollNo}</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className={styles.profileDetails}>
                <div className={styles.detailGrid}>
                  {[
                    { label: 'Full Name', value: user?.fullName },
                    { label: 'Roll Number', value: user?.rollNo || 'N/A' },
                    { label: 'Batch', value: user?.batch || 'N/A' },
                    { label: 'Timing', value: user?.timing || 'N/A' },
                    { label: 'Semester', value: user?.semester || 'N/A' },
                    { label: 'Email', value: user?.email },
                    { label: 'Department', value: user?.department || 'N/A' },
                  ].map((d, i) => (
                    <div key={i} className={styles.detailItem}>
                      <span className={styles.detailLabel}>{d.label}</span>
                      <span className={styles.detailValue}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======= EVENTS ======= */}
          {activeSection === 'events' && (
            <div className={styles.eventsSection}>
              <div className={styles.sectionHeader}><h2>Upcoming Events</h2></div>
              <div className={styles.eventGrid}>
                {upcomingEvents.map(e => {
                  // 🔴 THE BUTTON FIX: Find if the user has a request for this event
                  const userParticipation = myParticipations.find(p => p.eventId === e._id);

                  // If it's rejected, it's like they never applied (button resets!)
                  const isRejected = userParticipation?.status === 'Rejected';
                  const hasActiveRequest = userParticipation && !isRejected;

                  return (
                    <div key={e._id} className={styles.eventCard}>
                      <div className={styles.eventDateBadge}><CalendarDays size={14} />{e.date}</div>
                      <h3 className={styles.eventName}>{e.title}</h3>
                      <p className={styles.eventDesc}>{e.description}</p>
                      <div className={styles.eventMeta}>
                        <span className={styles.eventBudget}><DollarSign size={14} /> Rs {e.budget?.toLocaleString()}</span>
                        <Badge variant="success">{e.status}</Badge>
                      </div>
                      <Button
                        size="sm"
                        disabled={hasActiveRequest}
                        variant={hasActiveRequest ? 'outline' : 'primary'}
                        onClick={() => {
                          setParticipateEvent(e);
                          setParticipateForm({ name: user?.fullName || '', role: 'Volunteer' });
                          setParticipateOpen(true);
                        }}
                      >
                        {hasActiveRequest ? (
                          <><CheckCircle size={14} style={{ marginRight: '4px' }} /> {userParticipation.status === 'Approved' ? 'You are a Participant!' : 'Request Pending'}</>
                        ) : (
                          <><Users size={14} /> Participate</>
                        )}
                      </Button>
                    </div>
                  );
                })}
                {upcomingEvents.length === 0 && <div className={styles.emptyState}><CalendarDays size={48} /><p>No upcoming events</p></div>}
              </div>

              {completedEvents.length > 0 && (
                <>
                  <div className={styles.sectionHeader} style={{ marginTop: 32 }}><h2>Completed Events</h2></div>
                  <div className={styles.eventGrid}>
                    {completedEvents.map(e => (
                      <div key={e._id} className={`${styles.eventCard} ${styles.eventCompleted}`}>
                        <div className={styles.eventDateBadge}><CalendarDays size={14} />{e.date}</div>
                        <h3 className={styles.eventName}>{e.title}</h3>
                        <p className={styles.eventDesc}>{e.description}</p>
                        <Badge variant="outline">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ======= REQUESTS ======= */}
          {activeSection === 'requests' && (
            <div className={styles.requestsSection}>
              <div className={styles.sectionHeader}>
                <h2>My Requests</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="sm" onClick={() => setRequestOpen(true)}><Send size={14} /> New Request</Button>
                </div>
              </div>
              <div className={styles.requestsList}>
                {myRequests.map(r => (
                  <div key={r._id} className={styles.requestCard}>
                    <div className={styles.requestInfo}>
                      <h4 className={styles.requestTitle}>{r.title}</h4>
                      <div className={styles.requestMeta}>
                        <span><Clock size={12} /> {new Date(r.createdAt).toLocaleDateString()}</span>
                        <span className={styles.requestType}>{r.type}</span>
                      </div>
                    </div>
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </div>
                ))}
                {myRequests.length === 0 && <p className={styles.emptyText}>You haven't submitted any requests yet.</p>}
              </div>
            </div>
          )}

          {/* ======= ANNOUNCEMENTS ======= */}
          {activeSection === 'announcements' && (
            <div className={styles.announcementsSection}>
              <div className={styles.sectionHeader}><h2>Announcements</h2></div>
              <div className={styles.annGrid}>
                {dbAnnouncements.map(a => (
                  <div key={a._id} className={styles.annCard}>
                    <div className={styles.annHeader}>
                      <Bell size={16} className={styles.annIcon} />
                      <span className={styles.annDate}>{a.postedDate}</span>
                    </div>
                    <h3 className={styles.annTitle}>{a.title}</h3>
                    <p className={styles.annDesc}>{a.description}</p>
                    <div className={styles.annBy}>Posted by {a.postedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======= NOTIFICATIONS ======= */}
          {activeSection === 'notifications' && (
            <div className={styles.notifsSection}>
              <div className={styles.sectionHeader}><h2>Notifications</h2></div>
              <div className={styles.notifList}>
                {dbNotifications.map(n => (
                  <div
                    key={n._id}
                    className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                    onClick={() => !n.read && handleMarkAsRead(n._id)}
                    style={{ cursor: !n.read ? 'pointer' : 'default' }}
                  >
                    <div className={styles.notifDot} />
                    <div className={styles.notifContent}>
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <span className={styles.notifDate}>{n.date}</span>
                    </div>
                  </div>
                ))}
                {dbNotifications.length === 0 && <p className={styles.muted}>You have no notifications.</p>}
              </div>
            </div>
          )}

          {/* ======= GALLERY ======= */}
          {activeSection === 'gallery' && (
            <div className={styles.gallerySection}>
              <div className={styles.sectionHeader}><h2>Gallery</h2></div>
              <div className={styles.galleryGrid}>
                {galleryImages.map(img => (
                  <div key={img.id} className={styles.galleryItem}>
                    <img src={img.url} alt={img.caption} loading="lazy" />
                    <div className={styles.galleryOverlay}>
                      <Eye size={20} />
                      <span>{img.caption}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Submit a Request" footer={<><Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}>Submit</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={form.name} onChange={e => setField('name', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Type *</label>
            <Select value={form.type} onChange={e => setField('type', e.target.value)}>
              <option value="">Select type</option>
              <option value="Budget">Budget Approval</option>
              <option value="Event Idea">Event Idea</option>
              <option value="Department">Department Support</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Title *</label>
            <Input placeholder="What do you need?" value={form.title} onChange={e => setField('title', e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title={`Join: ${participateEvent?.title || ''}`} footer={<><Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button><Button onClick={handleParticipateSubmit}>Confirm</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={participateForm.name} onChange={e => setParticipateForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role</label>
            <Select value={participateForm.role} onChange={e => setParticipateForm(p => ({ ...p, role: e.target.value }))}>
              <option value="Volunteer">Volunteer</option>
              <option value="Attendee">Attendee</option>
              <option value="Organizer">Organizer</option>
              <option value="Speaker">Speaker</option>
            </Select>
          </div>
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue" footer={<><Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button><Button onClick={() => { setReportOpen(false); toast({ title: 'Report Sent' }); }}>Send</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.field}><label>Subject *</label><Input value={report.subject} onChange={e => setReport(p => ({ ...p, subject: e.target.value }))} /></div>
          <div className={styles.field}><label>Message *</label><Textarea rows={4} value={report.message} onChange={e => setReport(p => ({ ...p, message: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={fundOpen} onClose={() => setFundOpen(false)} title="Fund Appeal" footer={<><Button variant="outline" onClick={() => setFundOpen(false)}>Cancel</Button><Button onClick={() => { setFundOpen(false); toast({ title: 'Fund Appeal Sent' }); }}>Submit</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div className={styles.field}><label>Purpose *</label>
            <Select value={fundForm.purpose} onChange={e => setFundForm(p => ({ ...p, purpose: e.target.value }))}>
              <option value="">Select purpose</option><option value="Education">Education</option><option value="Medical">Medical</option><option value="Event">Event Sponsorship</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentPortal;