import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Megaphone, Image as ImageIcon, Send, Users, ArrowRight, LogIn, Heart, AlertTriangle, DollarSign, Info, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useSettings } from '@/context/SettingsContext.jsx'; // <-- IMPORT CONTEXT
import styles from './StudentPortal.module.css';

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // USE THE GLOBAL SETTINGS INSTANTLY!
  const { settings, loading } = useSettings();

  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const [fundForm, setFundForm] = useState({ name: '', email: '', amount: '', purpose: '', description: '' });
  const [form, setForm] = useState({ title: '', name: '', type: '', eventId: '' });
  const [report, setReport] = useState({ name: '', subject: '', message: '' });

  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateEvent, setParticipateEvent] = useState(null);
  const [participateForm, setParticipateForm] = useState({ name: '', rollNo: '', department: '', contact: '', role: 'Attendee' });

  const [viewAlbum, setViewAlbum] = useState(null);
  const [fullScreenIndex, setFullScreenIndex] = useState(null);

  // FETCH ONLY EVENTS, ANNOUNCEMENTS, & GALLERY
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/events/records'),
      fetch('http://localhost:5000/api/announcements/all'),
      fetch('http://localhost:5000/api/gallery/all')
    ])
      .then(async ([evRes, annRes, galRes]) => {
        const evData = await evRes.json();
        const annData = await annRes.json();
        const galData = await galRes.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = Array.isArray(evData) ? evData
          .filter(e => {
            if (e.status !== 'Upcoming') return false;
            const dateToCheck = e.endDate || e.date;
            if (dateToCheck) {
              const eventDate = new Date(dateToCheck);
              if (eventDate < today) return false;
            }
            return true;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date)) : [];

        setUpcomingEvents(upcoming);
        setAnnouncements(Array.isArray(annData) ? annData.slice(0, 3) : []);
        setGalleryImages(Array.isArray(galData) ? galData : []);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (fullScreenIndex === null || !viewAlbum) return;
      if (e.key === 'ArrowRight') setFullScreenIndex((prev) => (prev + 1) % viewAlbum.images.length);
      else if (e.key === 'ArrowLeft') setFullScreenIndex((prev) => (prev === 0 ? viewAlbum.images.length - 1 : prev - 1));
      else if (e.key === 'Escape') setFullScreenIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullScreenIndex, viewAlbum]);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmitRequest = () => {
    if (!form.name || !form.type) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const selectedEvent = form.type === 'Event Participation' ? upcomingEvents.find(e => e._id === form.eventId) : null;
    const requestTitle = form.type === 'Event Participation' ? `Participation Request: ${selectedEvent?.title}` : form.title;
    toast({ title: 'Request Submitted!', description: `"${requestTitle}" has been sent to the admin for approval.` });
    setRequestOpen(false);
    setForm({ title: '', name: '', type: '', eventId: '' });
  };

  const galleryAlbums = Object.values(galleryImages.reduce((acc, img) => {
    const key = img.eventTitle || 'General';
    if (!acc[key]) acc[key] = { eventTitle: key, coverImage: img.url, images: [] };
    acc[key].images.push(img);
    return acc;
  }, {}));

  const previewAlbums = galleryAlbums.slice(0, 4);

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Portal...</div>;

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <div className={styles.navLogo}><GraduationCap size={20} /></div>
            <span className={styles.navName}>{settings.societyName}</span> {/* DYNAMIC CONTEXT */}
          </div>
          <div className={styles.navLinks}>
            <a href="#events">Events</a><a href="#announcements">Announcements</a><a href="#gallery">Gallery</a>
          </div>
          <div className={styles.navBtns}>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogIn size={14} /> Login</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>Join Society</Button>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}><Users size={16} /> Student Portal</div>
          <h1 className={styles.heroTitle}>Welcome to<br /><span className={styles.heroHighlight}>{settings.societyName}</span></h1> {/* DYNAMIC CONTEXT */}
          <p className={styles.heroSubtitle}>Stay connected with society activities, events, and announcements. Submit requests and explore our gallery.</p>
          <div className={styles.heroBtns}>
            <Button size="lg" onClick={() => navigate('/signup')}>Join Society <ArrowRight size={16} /></Button>
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
            <div className={styles.statCard}><CalendarDays size={28} className={styles.statIcon} /><div className={styles.statValue}>{upcomingEvents.length}</div><div className={styles.statLabel}>Upcoming Events</div></div>
            <div className={styles.statCard}><Megaphone size={28} className={styles.statIcon} /><div className={styles.statValue}>{announcements.length}</div><div className={styles.statLabel}>Announcements</div></div>
            <div className={styles.statCard}><ImageIcon size={28} className={styles.statIcon} /><div className={styles.statValue}>{galleryImages.length}</div><div className={styles.statLabel}>Gallery Photos</div></div>
            <div className={styles.statCard}><Users size={28} className={styles.statIcon} /><div className={styles.statValue}>45+</div><div className={styles.statLabel}>Active Members</div></div>
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
                <span className={styles.eventDate}><CalendarDays size={12} />{e.date ? new Date(e.date).toLocaleDateString() : 'TBD'}</span>
                <h3 className={styles.eventName}>{e.title}</h3>
                <p className={styles.eventDesc}>{e.description}</p>
                <div className={styles.eventFooter}>
                  <span className={styles.eventBudget}>Fee: {e.entryFee ? `Rs ${e.entryFee}` : 'Free'}</span>
                  <Button size="sm" onClick={() => {
                    setParticipateEvent(e); setParticipateForm({ name: '', rollNo: '', department: '', contact: '', role: 'Attendee' }); setParticipateOpen(true);
                  }}><Users size={14} /> Participate</Button>
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
            {announcements.map(a => (
              <div key={a._id || a.id} className={styles.annCard}>
                <h3 className={styles.annTitle}>{a.title}</h3>
                <p className={styles.annDesc}>{a.description}</p>
                <div className={styles.annFooter}><span>By {a.postedBy}</span><span>{a.postedDate}</span></div>
              </div>
            ))}
            {announcements.length === 0 && <p className={styles.empty} style={{gridColumn: '1/-1'}}>No announcements currently.</p>}
          </div>
        </div>
      </section>

      {/* Grouped Gallery Preview */}
      <section id="gallery" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Photo Gallery</h2>
          <div className={styles.galleryGrid}>
            {previewAlbums.map((album, idx) => (
              <div key={idx} className={styles.galleryItem} onClick={() => setViewAlbum(album)} style={{ cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)', aspectRatio: '4/3' }}>
                  <img src={album.coverImage} alt={album.eventTitle} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ImageIcon size={12} /> {album.images.length}
                  </div>
                </div>
                <div className={styles.galleryCaption} style={{ marginTop: '8px', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center' }}>{album.eventTitle}</div>
              </div>
            ))}
            {previewAlbums.length === 0 && <p className={styles.empty} style={{gridColumn: '1/-1', color: 'var(--text-muted)'}}>No photos uploaded yet.</p>}
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
            <div className={styles.footerBrand}><GraduationCap size={22} /> {settings.societyName}</div> {/* DYNAMIC CONTEXT */}
            <p className={styles.footerText}>Empowering students through technology and community.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <p onClick={() => navigate('/login')}>Login</p><p onClick={() => navigate('/')}>Home</p><p onClick={() => navigate('/login')}>Join Society</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            <p>Email: {settings.email}</p> {/* DYNAMIC CONTEXT */}
            <p>Phone: {settings.phone}</p> {/* DYNAMIC CONTEXT */}
            <p>{settings.university}</p> {/* DYNAMIC CONTEXT */}
          </div>
        </div>
        <div className={styles.footerBottom}>© {new Date().getFullYear()} {settings.societyName} Management System. All rights reserved.</div>
      </footer>

      {/* MODALS */}
      <Modal open={!!viewAlbum && fullScreenIndex === null} onClose={() => setViewAlbum(null)} title={viewAlbum?.eventTitle || 'Photo Album'} footer={<Button onClick={() => setViewAlbum(null)}>Close Album</Button>}>
        {viewAlbum && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px', maxHeight: '60vh', overflowY: 'auto', padding: '4px' }}>
            {viewAlbum.images.map((img, idx) => (
              <div key={img._id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setFullScreenIndex(idx)} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1', background: '#f1f5f9' }}><img src={img.url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></div>
                {img.caption && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{img.caption}</span>}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* FULL-SCREEN LIGHTBOX OVERLAY */}
      {fullScreenIndex !== null && viewAlbum && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setFullScreenIndex(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><X size={28} /></button>
          <button onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => prev === 0 ? viewAlbum.images.length - 1 : prev - 1); }} style={{ position: 'absolute', left: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><ChevronLeft size={36} /></button>
          <img src={viewAlbum.images[fullScreenIndex].url} alt={viewAlbum.images[fullScreenIndex].caption} style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
          <button onClick={(e) => { e.stopPropagation(); setFullScreenIndex(prev => (prev + 1) % viewAlbum.images.length); }} style={{ position: 'absolute', right: '24px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><ChevronRight size={36} /></button>
          <div style={{ position: 'absolute', bottom: '32px', color: 'white', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '1.25rem', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{viewAlbum.images[fullScreenIndex].caption}</span><span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{fullScreenIndex + 1} of {viewAlbum.images.length}</span></div>
        </div>
      )}

      {/* Standard Modals... */}
      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Submit a Request" footer={<><Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button><Button onClick={handleSubmitRequest}>Submit Request</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label><Input placeholder="Full name" value={form.name} onChange={e => setField('name', e.target.value)} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Type *</label><Select value={form.type} onChange={e => setField('type', e.target.value)}><option value="">Select type</option><option value="Event Participation">Event Participation</option><option value="Budget">Budget Approval</option><option value="Event">Event Approval</option><option value="Department">Department Support</option></Select></div>
          {form.type === 'Event Participation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Select Event *</label>
              <Select value={form.eventId} onChange={e => setField('eventId', e.target.value)}><option value="">Choose an event</option>{upcomingEvents.map(ev => (<option key={ev._id} value={ev._id}>{ev.title} — {new Date(ev.date).toLocaleDateString()} ({ev.status})</option>))}</Select>
            </div>
          )}
          {form.type !== 'Event Participation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Title *</label><Input placeholder="What do you need?" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          )}
        </div>
      </Modal>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue" footer={<><Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button><Button onClick={async () => {
        try {
          const res = await fetch('http://localhost:5000/api/reports/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) });
          if (res.ok) { toast({ title: 'Report Submitted', description: 'Your report has been sent to the Society President.' }); setReportOpen(false); setReport({ name: '', subject: '', message: '' }); } 
        } catch (error) {}
      }}>Send Report</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label><Input placeholder="Full name" value={report.name} onChange={e => setReport(p => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Subject *</label><Input placeholder="Brief description" value={report.subject} onChange={e => setReport(p => ({ ...p, subject: e.target.value }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Message *</label><Textarea rows={4} value={report.message} onChange={e => setReport(p => ({ ...p, message: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title={`Join: ${participateEvent?.title || ''}`} footer={<><Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button><Button onClick={async () => {
        try {
          const res = await fetch('http://localhost:5000/api/participants/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentName: participateForm.name, rollNo: participateForm.rollNo, department: participateForm.department, contact: participateForm.contact, eventId: participateEvent._id, eventTitle: participateEvent.title, role: participateForm.role }) });
          if (res.ok) { toast({ title: 'Request Sent!' }); setParticipateOpen(false); }
        } catch (error) {}
      }}>Confirm Participation</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Full Name *</label><Input value={participateForm.name} onChange={e => setParticipateForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Roll Number</label><Input value={participateForm.rollNo} onChange={e => setParticipateForm(p => ({ ...p, rollNo: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Department *</label><Input value={participateForm.department} onChange={e => setParticipateForm(p => ({ ...p, department: e.target.value }))} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Contact Info</label><Input value={participateForm.contact} onChange={e => setParticipateForm(p => ({ ...p, contact: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Role Requested</label><Select value={participateForm.role} onChange={e => setParticipateForm(p => ({ ...p, role: e.target.value }))}><option value="Attendee">Attendee</option><option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option></Select></div>
        </div>
      </Modal>

      <Modal open={fundOpen} onClose={() => setFundOpen(false)} title="Fund Appeal" footer={<><Button variant="outline" onClick={() => setFundOpen(false)}>Cancel</Button><Button onClick={async () => {
        try {
          const res = await fetch('http://localhost:5000/api/funds/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fundForm.name, email: fundForm.email, amount: Number(fundForm.amount), purpose: fundForm.purpose, description: fundForm.description }) });
          if (res.ok) { toast({ title: 'Fund Appeal Submitted!' }); setFundOpen(false); }
        } catch (error) {}
      }}>Submit Appeal</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label><Input value={fundForm.name} onChange={e => setFundForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Email *</label><Input value={fundForm.email} onChange={e => setFundForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Amount (Rs) *</label><Input type="number" value={fundForm.amount} onChange={e => setFundForm(p => ({ ...p, amount: e.target.value }))} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Purpose *</label><Select value={fundForm.purpose} onChange={e => setFundForm(p => ({ ...p, purpose: e.target.value }))}><option value="Event Sponsorship">Event Sponsorship</option></Select></div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentPortal;