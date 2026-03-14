import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Megaphone, Image, Send, Users, ArrowRight, LogIn, Heart, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { events, announcements, galleryImages } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './StudentPortal.module.css';

const StudentPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({ title: '', name: '', type: '' });
  const [report, setReport] = useState({ name: '', subject: '', message: '' });

  const upcomingEvents = events.filter(e => e.status === 'Upcoming');
  const recentAnnouncements = announcements.slice(0, 3);
  const previewPhotos = galleryImages.slice(0, 4);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmitRequest = () => {
    if (!form.title || !form.name || !form.type) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    toast({ title: 'Request Submitted!', description: 'Your request has been sent to the admin for review.' });
    setRequestOpen(false);
    setForm({ title: '', name: '', type: '' });
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
            <Button size="lg" onClick={() => setRequestOpen(true)}><Send size={16} /> Submit Request</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contribute')}><Heart size={16} /> Contribute</Button>
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
              <div key={e.id} className={styles.eventCard}>
                <span className={styles.eventDate}><CalendarDays size={12} /> {e.date}</span>
                <h3 className={styles.eventName}>{e.title}</h3>
                <p className={styles.eventDesc}>{e.description}</p>
                <span className={styles.eventBudget}>Budget: Rs {e.budget.toLocaleString()}</span>
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
          <Button onClick={handleSubmitRequest}>Submit</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={form.name} onChange={e => setField('name', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Request Title *</label>
            <Input placeholder="What do you need?" value={form.title} onChange={e => setField('title', e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Type *</label>
            <Select value={form.type} onChange={e => setField('type', e.target.value)}>
              <option value="">Select type</option>
              <option value="Budget">Budget Approval</option>
              <option value="Event">Event Approval</option>
              <option value="Department">Department Support</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue"
        footer={<>
          <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!report.name || !report.subject || !report.message) {
              toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
            }
            toast({ title: 'Report Submitted', description: 'Your report has been sent to the Society President.' });
            setReportOpen(false);
            setReport({ name: '', subject: '', message: '' });
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
    </div>
  );
};

export default StudentPortal;
