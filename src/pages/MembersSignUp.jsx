import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/Toast/ToastProvider';
import styles from '../pages/MembersSignUp.module.css';

const MemberSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    membershipId: '',
    email: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.membershipId.trim()) e.membershipId = 'Membership ID is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true); 
      } else {
        toast({ title: 'Activation Failed', description: data.message || 'Invalid details.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not connect to server.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}><CheckCircle size={48} /></div>
          <h2 className={styles.successTitle}>Account Activated!</h2>
          <p className={styles.successText}>
            Your membership is now active. You can log in using your email and the password you created during your initial application.
          </p>
          <div className={styles.successDetails}>
            <div className={styles.detailRow}><span>Membership ID</span><span>{form.membershipId}</span></div>
            <div className={styles.detailRow}><span>Email</span><span>{form.email}</span></div>
            <div className={styles.detailRow}><span>Status</span><span className={styles.active}>Active</span></div>
          </div>
          <Button size="lg" onClick={() => navigate('/login')} className={styles.successBtn}>
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}><ShieldCheck size={28} /></div>
          <h1 className={styles.title}>Activate Membership</h1>
          <p className={styles.subtitle}>Verify your identity to unlock your society account</p>
        </div>

        <div className={styles.infoBox}>
          <strong>Approved by Admin?</strong> Enter the Membership ID sent to your email along with your registered email address to activate your account.
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Membership ID *</label>
            <Input placeholder="e.g. AKS-2026-1234" value={form.membershipId} onChange={e => set('membershipId', e.target.value)} />
            {errors.membershipId && <span className={styles.error}>{errors.membershipId}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Registered Email Address *</label>
            <Input type="email" placeholder="your.email@university.edu" value={form.email} onChange={e => set('email', e.target.value)} />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <Button type="submit" size="lg" className={styles.submitBtn} disabled={loading}>
            <ShieldCheck size={18} /> {loading ? 'Verifying...' : 'Activate Account'}
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Not yet a member?</span>
          <span className={styles.link} onClick={() => navigate('/signup')}>Apply to Join</span>
        </div>
        <div className={styles.footer} style={{ marginTop: 6 }}>
          <span>Already activated?</span>
          <span className={styles.link} onClick={() => navigate('/login')}>Sign In</span>
        </div>
        <div className={styles.backRow}>
          <span className={styles.link} onClick={() => navigate('/')}><ArrowLeft size={14} /> Back to Home</span>
        </div>
      </div>
    </div>
  );
};

export default MemberSignup;