import { useNavigate } from 'react-router-dom';
import { GraduationCap, CalendarDays, Users, Wallet, BarChart3, Shield, ArrowRight, ChevronRight } from 'lucide-react';
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

const upcomingEvents = [
  { title: "Annual Tech Fest 2024", date: "Nov 15, 2024", desc: "Grand technology festival with competitions and talks." },
  { title: "Coding Competition", date: "Dec 1, 2024", desc: "Competitive programming contest with exciting prizes." },
  { title: "Sports Gala", date: "Nov 25, 2024", desc: "Annual sports event with multiple tournaments." },
];

const Home = () => {
  const navigate = useNavigate();

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
          <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
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
            <Button size="lg" variant="outline" onClick={() => navigate('/dashboard/events')}>
              View Events <CalendarDays size={16} />
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
            {upcomingEvents.map(e => (
              <div key={e.title} className={styles.eventCard}>
                <span className={styles.eventDate}>{e.date}</span>
                <h3 className={styles.eventTitle}>{e.title}</h3>
                <p className={styles.eventDesc}>{e.desc}</p>
              </div>
            ))}
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
