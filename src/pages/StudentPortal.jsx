import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Megaphone, Image, Send, Users, ArrowRight, LogIn, Heart, AlertTriangle, DollarSign, Info } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { galleryImages } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './StudentPortal.module.css';

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundForm, setFundForm] = useState({ name: '', email: '', amount: '', purpose: '', description: '' });
  const [form, setForm] = useState({ title: '', name: '', type: '', eventId: '' });
  const [report, setReport] = useState({ name: '', subject: '', message: '' });

  // Dynamic state for upcoming events
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateEvent, setParticipateEvent] = useState(null);

  // UPDATED: Full participation form state
  const [participateForm, setParticipateForm] = useState({
    name: '', rollNo: '', department: '', contact: '', role: 'Attendee'
  });

  const recentAnnouncements = announcements.slice(0, 3);
  const previewPhotos = galleryImages.slice(0, 4);

  // FETCH DYNAMIC EVENTS WITH DATE CHECK
  // FETCH DYNAMIC EVENTS & ANNOUNCEMENTS
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/events/records'),
      fetch('http://localhost:5000/api/announcements/all') // <-- New fetch call
    ])
      .then(async ([evRes, annRes]) => {
        const evData = await evRes.json();
        const annData = await annRes.json();

        // Handle Events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = evData
          .filter(e => {
            if (e.status !== 'Upcoming') return false;
            const dateToCheck = e.endDate || e.date;
            if (dateToCheck) {
              const eventDate = new Date(dateToCheck);
              if (eventDate < today) return false;
            }
            return true;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setUpcomingEvents(upcoming);

        // Handle Announcements (Just grab the 3 newest ones)
        setAnnouncements(annData.slice(0, 3));
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmitRequest = () => {
    if (!form.name || !form.type) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    if (form.type === 'Event Participation' && !form.eventId) {
      toast({ title: 'Please select an event', variant: 'destructive' }); return;
    }
    if (form.type !== 'Event Participation' && !form.title) {
      toast({ title: 'Please enter a request title', variant: 'destructive' }); return;
    }

    const selectedEvent = form.type === 'Event Participation' ? upcomingEvents.find(e => e._id === form.eventId) : null;
    const requestTitle = form.type === 'Event Participation' ? `Participation Request: ${selectedEvent?.title}` : form.title;

    toast({ title: 'Request Submitted!', description: `"${requestTitle}" has been sent to the admin for approval.` });
    setRequestOpen(false);
    setForm({ title: '', name: '', type: '', eventId: '' });
  };

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <div className={styles.navLogo}><GraduationCap size={20} /></div>
            <span className={styles.navName}>Arfa Kareem Society</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#events">Events</a>
            <a href="#announcements">Announcements</a>
            <a href="#gallery">Gallery</a>
          </div>
          <div className={styles.navBtns}>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogIn size={14} /> Login</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Join Society</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}><Users size={16} /> Student Portal</div>
          <h1 className={styles.heroTitle}>Welcome to<br /><span className={styles.heroHighlight}>Arfa Kareem Society</span></h1>
          <p className={styles.heroSubtitle}>Stay connected with society activities, events, and announcements. Submit requests and explore our gallery.</p>
          <div className={styles.heroBtns}>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Join Society <ArrowRight size={16} />
            </Button>
            <Button size="lg" onClick={() => setRequestOpen(true)}><Send size={16} /> Submit Request</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contribute')}><Heart size={16} /> Contribute</Button>
            <Button size="lg" variant="outline" onClick={() => setFundOpen(true)}><DollarSign size={16} /> Fund Appeal</Button>
            <Button size="lg" variant="outline" onClick={() => setReportOpen(true)}><AlertTriangle size={16} /> Report Issue</Button>
          </div>
        </div>
      </section>

      {/* Activities Overview */}
      <section className={styles.overview}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Society Activities</h2>
          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <CalendarDays size={28} className={styles.statIcon} />
              <div className={styles.statValue}>{upcomingEvents.length}</div>
              <div className={styles.statLabel}>Upcoming Events</div>
            </div>
            <div className={styles.statCard}>
              <Megaphone size={28} className={styles.statIcon} />
              <div className={styles.statValue}>{announcements.length}</div>
              <div className={styles.statLabel}>Announcements</div>
            </div>
            <div className={styles.statCard}>
              <Image size={28} className={styles.statIcon} />
              <div className={styles.statValue}>{galleryImages.length}</div>
              <div className={styles.statLabel}>Gallery Photos</div>
            </div>
            <div className={styles.statCard}>
              <Users size={28} className={styles.statIcon} />
              <div className={styles.statValue}>45+</div>
              <div className={styles.statLabel}>Active Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Upcoming Events</h2>
          <div className={styles.eventGrid}>
            {upcomingEvents.map(e => (
              <div key={e._id} className={styles.eventCard}>
                <span className={styles.eventDate}>
                  <CalendarDays size={12} />
                  {e.date ? new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                </span>
                <h3 className={styles.eventName}>{e.title}</h3>
                <p className={styles.eventDesc}>{e.description || 'Join us for this exciting event!'}</p>
                <div className={styles.eventFooter}>
                  <span className={styles.eventBudget}>Fee: {e.entryFee ? `Rs ${e.entryFee}` : 'Free'}</span>
                  <Button size="sm" onClick={() => {
                    setParticipateEvent(e);
                    setParticipateForm({ name: '', rollNo: '', department: '', contact: '', role: 'Attendee' });
                    setParticipateOpen(true);
                  }}>
                    <Users size={14} /> Participate
                  </Button>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && <p className={styles.empty}>No upcoming events at the moment.</p>}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section id="announcements" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Latest Announcements</h2>
          <div className={styles.annGrid}>
            {recentAnnouncements.map(a => (
              <div key={a.id} className={styles.annCard}>
                <h3 className={styles.annTitle}>{a.title}</h3>
                <p className={styles.annDesc}>{a.description}</p>
                <div className={styles.annFooter}>
                  <span>By {a.postedBy}</span>
                  <span>{a.postedDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section id="gallery" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Photo Gallery</h2>
          <div className={styles.galleryGrid}>
            {previewPhotos.map(img => (
              <div key={img.id} className={styles.galleryItem}>
                <img src={img.url} alt={img.caption} loading="lazy" />
                <div className={styles.galleryCaption}>{img.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Need Support?</h2>
          <p className={styles.ctaText}>Submit a request for event approval, budget support, or department assistance.</p>
          <div className={styles.ctaBtns}>
            <Button size="lg" onClick={() => setRequestOpen(true)}><Send size={16} /> Submit Request</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/signup')}><ArrowRight size={16} /> Join the Society</Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}><GraduationCap size={22} /> Arfa Kareem Society</div>
            <p className={styles.footerText}>Empowering students through technology and community.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <p onClick={() => navigate('/login')}>Login</p>
            <p onClick={() => navigate('/')}>Home</p>
            <p onClick={() => navigate('/login')}>Join Society</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            <p>Email: info@arfakareem.edu</p>
            <p>Phone: +92-300-1234567</p>
            <p>University Campus, Lahore</p>
          </div>
        </div>
        <div className={styles.footerBottom}>© 2024 Arfa Kareem Society Management System. All rights reserved.</div>
      </footer>

      {/* Submit Request Modal */}
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Submit a Request"
        footer={<>
          <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitRequest}>Submit Request</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={form.name} onChange={e => setField('name', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Type *</label>
            <Select value={form.type} onChange={e => setField('type', e.target.value)}>
              <option value="">Select type</option>
              <option value="Event Participation">Event Participation</option>
              <option value="Budget">Budget Approval</option>
              <option value="Event">Event Approval</option>
              <option value="Department">Department Support</option>
            </Select>
          </div>
          {form.type === 'Event Participation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Select Event *</label>
              <Select value={form.eventId} onChange={e => setField('eventId', e.target.value)}>
                <option value="">Choose an event</option>
                {upcomingEvents.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.title} — {new Date(ev.date).toLocaleDateString()} ({ev.status})</option>
                ))}
              </Select>
              {form.eventId && (() => {
                const ev = upcomingEvents.find(e => e._id === form.eventId);
                return ev ? (
                  <div style={{ background: 'var(--bg-card, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 8, padding: 12, marginTop: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748b)', marginTop: 4 }}>{ev.description}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                      <span>📅 {new Date(ev.date).toLocaleDateString()}</span>
                      <span>💰 Rs {ev.budget?.toLocaleString() || 0}</span>
                      <span>📌 {ev.status}</span>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
          {form.type !== 'Event Participation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Title *</label>
              <Input placeholder="What do you need?" value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>
          )}
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue"
        footer={<>
          <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!report.name || !report.subject || !report.message) {
              toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
            }

            try {
              const res = await fetch('http://localhost:5000/api/reports/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report)
              });

              if (res.ok) {
                toast({ title: 'Report Submitted', description: 'Your report has been sent to the Society President.' });
                setReportOpen(false);
                setReport({ name: '', subject: '', message: '' });
              } else {
                toast({ title: 'Failed to submit report', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Server error', description: 'Could not connect to the server.', variant: 'destructive' });
            }
          }}>Send Report</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Report any ongoing issues. Your message will be sent directly to the Society President.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={report.name} onChange={e => setReport(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Subject *</label>
            <Input placeholder="Brief description of the issue" value={report.subject} onChange={e => setReport(p => ({ ...p, subject: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Message *</label>
            <Textarea placeholder="Describe the issue in detail..." rows={4} value={report.message} onChange={e => setReport(p => ({ ...p, message: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* UPGRADED PARTICIPATE MODAL */}
      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title={`Join: ${participateEvent?.title || ''}`}
        footer={<>
          <Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!participateForm.name || !participateForm.department) {
              toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
            }

            try {
              // ALL NEW FIELDS INCLUDED HERE!
              const res = await fetch('http://localhost:5000/api/participants/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentName: participateForm.name,
                  rollNo: participateForm.rollNo,
                  department: participateForm.department,
                  contact: participateForm.contact,
                  eventId: participateEvent._id,
                  eventTitle: participateEvent.title,
                  role: participateForm.role
                })
              });

              if (res.ok) {
                toast({ title: 'Request Sent!', description: `Your request to join as ${participateForm.role} is pending approval.` });
                setParticipateOpen(false);
              } else {
                toast({ title: 'Request Failed', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Server Error', variant: 'destructive' });
            }
          }}>Confirm Participation</Button>
        </>}>

        {participateEvent && (
          <div style={{ background: 'var(--primary-light)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--primary)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <Info size={20} color="var(--primary)" style={{ marginTop: '2px' }} />
            <div style={{ fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '4px' }}>Event Requirements</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-main)' }}>
                <span><strong>Eligibility:</strong> {participateEvent.eligibility || 'All Students'}</span>
                <span><strong>Entry Fee:</strong> {participateEvent.entryFee ? `Rs ${participateEvent.entryFee}` : 'Free'}</span>
                <span><strong>Deadline:</strong> {participateEvent.registrationDeadline ? new Date(participateEvent.registrationDeadline).toLocaleDateString() : 'N/A'}</span>
                <span><strong>Max Capacity:</strong> {participateEvent.maxParticipants || 'Unlimited'}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Full Name *</label>
              <Input placeholder="Ali Hassan" value={participateForm.name} onChange={e => setParticipateForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Roll Number</label>
              <Input placeholder="e.g. FA21-BSE-123" value={participateForm.rollNo} onChange={e => setParticipateForm(p => ({ ...p, rollNo: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department *</label>
              <Input placeholder="e.g. Software Engineering" value={participateForm.department} onChange={e => setParticipateForm(p => ({ ...p, department: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Contact Info</label>
              <Input placeholder="Phone or Email" value={participateForm.contact} onChange={e => setParticipateForm(p => ({ ...p, contact: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role Requested</label>
            <Select value={participateForm.role} onChange={e => setParticipateForm(p => ({ ...p, role: e.target.value }))}>
              <option value="Attendee">Attendee</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Organizer">Organizer</option>
              <option value="Speaker">Speaker</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Fund Appeal Modal */}
      <Modal open={fundOpen} onClose={() => setFundOpen(false)} title="Fund Appeal"
        footer={<>
          <Button variant="outline" onClick={() => setFundOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!fundForm.name || !fundForm.email || !fundForm.amount || !fundForm.purpose) {
              toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
            }

            try {
              const response = await fetch('http://localhost:5000/api/funds/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: fundForm.name,
                  email: fundForm.email,
                  amount: Number(fundForm.amount),
                  purpose: fundForm.purpose,
                  description: fundForm.description
                })
              });

              if (response.ok) {
                toast({
                  title: 'Fund Appeal Submitted!',
                  description: `Your request for Rs ${Number(fundForm.amount).toLocaleString()} has been sent to the Society President.`
                });
                setFundOpen(false);
                setFundForm({ name: '', email: '', amount: '', purpose: '', description: '' });
              } else {
                toast({ title: 'Submission Failed', description: 'Could not submit your appeal.', variant: 'destructive' });
              }
            } catch (error) {
              toast({ title: 'Server Error', description: 'Failed to connect to the server.', variant: 'destructive' });
            }
          }}>Submit Appeal</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Request financial support from the society. Your appeal will be reviewed by the Society President.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={fundForm.name} onChange={e => setFundForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Email *</label>
            <Input placeholder="your@email.edu" type="email" value={fundForm.email} onChange={e => setFundForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Amount (Rs) *</label>
            <Input placeholder="e.g. 5000" type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Purpose *</label>
            <Select value={fundForm.purpose} onChange={e => setFundForm(p => ({ ...p, purpose: e.target.value }))}>
              <option value="">Select purpose</option>
              <option value="Event Sponsorship">Event Sponsorship</option>
              <option value="Project Materials">Project Materials</option>
              <option value="Competition Fee">Competition Fee</option>
              <option value="Study Resources">Study Resources</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Description</label>
            <Textarea placeholder="Explain why you need this fund..." rows={3} value={fundForm.description} onChange={e => setFundForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentPortal;