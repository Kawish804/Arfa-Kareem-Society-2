import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Users, Wallet, BarChart3, Shield, ArrowRight, ChevronRight, AlertTriangle, Heart } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import Button from '@/components/ui/Button.jsx';
import styles from './Home.module.css';

const features = [
  { icon: Users, title: "Member Management", desc: "Track and manage all society members efficiently." },
  { icon: Wallet, title: "Fund Tracking", desc: "Monitor fund collection and payment statuses." },
  { icon: CalendarDays, title: "Event Planning", desc: "Organize and manage society events seamlessly." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Generate detailed reports and visual analytics." },
  { icon: Shield, title: "Role-Based Access", desc: "Secure access with admin, finance, and member roles." },
  { icon: GraduationCap, title: "Announcements", desc: "Keep members informed with real-time updates." },
];

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ name: '', email: '', subject: '', message: '' });
  
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // FETCH DYNAMIC EVENTS WITH DATE CHECK
  useEffect(() => {
    fetch('http://localhost:5000/api/events/records')
      .then(res => res.json())
      .then(data => {
        // Get today's date and set it to midnight for accurate comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = data
          .filter(e => {
            // 1. Must be marked as Upcoming
            if (e.status !== 'Upcoming') return false;
            
            // 2. The event date must be today or in the future
            // (If the event spans multiple days, we check the endDate if it exists)
            const dateToCheck = e.endDate || e.date;
            if (dateToCheck) {
              const eventDate = new Date(dateToCheck);
              if (eventDate < today) return false; // Hide it if the date has passed!
            }
            
            return true;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort to show the soonest events first
          .slice(0, 3); // Grab the top 3
          
        setUpcomingEvents(upcoming);
      })
      .catch(err => console.error("Error fetching upcoming events:", err));
  }, []);

  const handleSubmitReport = async () => {
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
        toast({ title: 'Report Submitted', description: 'Your report has been sent to the Society President for review.' });
        setReportOpen(false);
        setReport({ name: '', email: '', subject: '', message: '' });
      } else {
        toast({ title: 'Failed to submit report', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server error', description: 'Could not connect to the server.', variant: 'destructive' });
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <div className={styles.navLogo}><GraduationCap size={20} /></div>
            <span className={styles.navName}>Arfa Kareem Society</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <a href="#events">Events</a>
          </div>
          <div className={styles.navActions}>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button className={styles.navBtn} size="sm" onClick={() => navigate('/signup')}>Signup</Button>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <GraduationCap size={16} /> University Society Platform
          </div>
          <h1 className={styles.heroTitle}>
            Arfa Kareem Society<br />
            <span className={styles.heroHighlight}>Management System</span>
          </h1>
          <p className={styles.heroSubtitle}>
            A digital platform for managing society events, funds, members, and activities with transparency and efficiency.
          </p>
          <div className={styles.heroBtns}>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Join Society <ArrowRight size={16} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contribute')}>
              <Heart size={16} /> Contribute
            </Button>
            <Button size="lg" variant="outline" onClick={() => setReportOpen(true)}>
              <AlertTriangle size={16} /> Report Issue
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className={styles.about}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>About the Society</h2>
          <p className={styles.aboutText}>
            Named after Arfa Kareem, Pakistan's youngest Microsoft Certified Professional, our society promotes
            technology education, leadership, and community building among university students. We organize tech events,
            workshops, and collaborative projects to nurture the next generation of tech leaders.
          </p>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Platform Features</h2>
          <div className={styles.featureGrid}>
            {features.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}><f.icon size={24} /></div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className={styles.eventsSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Upcoming Events</h2>
          <div className={styles.eventGrid}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(e => (
                <div key={e._id} className={styles.eventCard}>
                  <span className={styles.eventDate}>
                    {e.date ? new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </span>
                  <h3 className={styles.eventTitle}>{e.title}</h3>
                  <p className={styles.eventDesc}>{e.description || 'Join us for this exciting upcoming event!'}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: '2rem 0' }}>
                No upcoming events at the moment. Stay tuned!
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Ready to Get Started?</h2>
          <p className={styles.ctaText}>Join the Arfa Kareem Society and be part of a vibrant community of tech enthusiasts.</p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Get Started <ChevronRight size={16} />
          </Button>
        </div>
      </section>

      {/* Report Issue Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue"
        footer={<>
          <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReport}>Send Report</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            Report any ongoing issues in the university. Your message will be sent directly to the Society President.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Your Name *</label>
            <Input placeholder="Full name" value={report.name} onChange={e => setReport(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Email (optional)</label>
            <Input type="email" placeholder="your@email.com" value={report.email} onChange={e => setReport(p => ({ ...p, email: e.target.value }))} />
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

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>
              <GraduationCap size={22} />
              <span>Arfa Kareem Society</span>
            </div>
            <p className={styles.footerText}>Empowering students through technology and community.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <p onClick={() => navigate('/login')}>Login</p>
            <p onClick={() => navigate('/dashboard')}>Dashboard</p>
            <p onClick={() => navigate('/dashboard/events')}>Events</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Contact</h4>
            <p>Email: info@arfakareem.edu</p>
            <p>Phone: +92-300-1234567</p>
            <p>University Campus, Lahore</p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2024 Arfa Kareem Society Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;