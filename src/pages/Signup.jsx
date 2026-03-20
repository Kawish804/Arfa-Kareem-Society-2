import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, UserPlus, CheckCircle, ArrowLeft, KeyRound, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Signup.module.css';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Phases: 'form' -> 'verify' -> 'success' -> 'manual'
  const [phase, setPhase] = useState('form');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membershipId, setMembershipId] = useState('');

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', department: '',
    semester: '', rollNo: '', timing: '', role: '', reason: '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.department) e.department = 'Select your department';
    if (!form.semester) e.semester = 'Select your semester';
    if (!form.role) e.role = 'Select a requested role';

    if (form.role !== 'Visitor') {
      if (!form.rollNo.trim()) {
        e.rollNo = 'Roll number is required';
      } else if (!/^22\d{6}-\d{3}$/.test(form.rollNo)) {
        e.rollNo = 'Format must be 22XXXXXX-XXX';
      }
      if (!form.timing) e.timing = 'Select your batch timing';
    }
    return e;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    // ... validation logic ...

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.emailSent) {
          // SCENARIO A: Email worked! Show them the code input box.
          toast({ title: "Code Sent!", description: "Please check your inbox." });
          setPhase('verify');
        } else {
          // SCENARIO B: Email failed (fake email). Skip the code box!
          toast({
            title: "Email Undeliverable",
            description: "Your account is created, but needs manual activation.",
            variant: "warning"
          });
          setPhase('manual'); // Show the "Contact Admin" screen immediately
        }
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Server Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!membershipId.trim()) {
      toast({ title: 'Invalid Code', description: 'Please enter your Membership ID', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, membershipId: membershipId })
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Account Activated!' });
        setPhase('success');
      } else {
        toast({ title: 'Activation Failed', description: data.message || data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not connect to backend.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI: MANUAL ACTIVATION SCREEN (Email Failed)
  // ==========================================
  if (phase === 'manual') {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} style={{ color: 'var(--warning-dark)', background: 'var(--warning-light)' }}>
            <AlertCircle size={48} />
          </div>
          <h2 className={styles.successTitle}>Manual Activation Required</h2>
          <p className={styles.successText}>
            We could not deliver the verification code to <strong>{form.email}</strong>.
          </p>
          <div className={styles.successDetails} style={{ background: '#fff3cd', border: '1px solid #ffe69c' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#664d03', textAlign: 'center' }}>
              Your account has been registered, but it is currently <b>Inactive</b>. Please contact the Society Admin or your CR to manually activate your account.
            </p>
          </div>
          <div className={styles.successBtns}>
            <Button onClick={() => navigate('/')}>Back to Portal</Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: SUCCESS SCREEN (Email Verified)
  // ==========================================
  if (phase === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}><CheckCircle size={48} /></div>
          <h2 className={styles.successTitle}>Account Activated!</h2>
          <p className={styles.successText}>
            Your email has been verified. Your request to join as a <strong>{form.role}</strong> has been sent to the admin.
          </p>
          <div className={styles.successDetails}>
            <div className={styles.detailRow}><span>Name</span><span>{form.fullName}</span></div>
            <div className={styles.detailRow}><span>Role</span><span>{form.role}</span></div>
            {form.role !== 'Visitor' && (
              <div className={styles.detailRow}><span>Roll No</span><span>{form.rollNo}</span></div>
            )}
            <div className={styles.detailRow}><span>Status</span><span className={styles.pending}>Pending Admin Approval</span></div>
          </div>
          <div className={styles.successBtns}>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Back to Portal</Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: VERIFICATION SCREEN
  // ==========================================
  if (phase === 'verify') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logo}><KeyRound size={26} /></div>
            <h1 className={styles.title}>Activate Account</h1>
            <p className={styles.subtitle} style={{ marginTop: '12px', lineHeight: 1.5 }}>
              We have sent a <strong>Membership ID</strong> to <br /><b>{form.email}</b>.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleVerificationSubmit}>
            <div className={styles.field} style={{ marginTop: '20px' }}>
              <label className={styles.label}>Enter Membership ID *</label>
              <Input
                placeholder="e.g. 123456"
                value={membershipId}
                onChange={e => setMembershipId(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '2px' }}
              />
            </div>
            <Button type="submit" size="lg" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI: SIGNUP FORM
  // ==========================================
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}><GraduationCap size={26} /></div>
          <h1 className={styles.title}>Join the Society</h1>
          <p className={styles.subtitle}>Create your account to become a member</p>
        </div>

        <form className={styles.form} onSubmit={handleSignupSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name *</label>
              <Input placeholder="Muhammad Ahmed" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone Number *</label>
              <Input placeholder="+92-300-1234567" value={form.phone} onChange={e => set('phone', e.target.value)} />
              {errors.phone && <span className={styles.error}>{errors.phone}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email Address *</label>
            <Input type="email" placeholder="your.email@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} />

            {/* THE NEW WARNING TEXT */}
            <span style={{ fontSize: '0.75rem', color: 'var(--warning-dark)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> Please use an active Google/Gmail account. Unreachable emails will require manual Admin activation.
            </span>
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password *</label>
            <div className={styles.passwordWrap}>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Minimum 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Requested Role *</label>
            <Select value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="">Select your role</option>
              <option value="Student">Regular Student</option>
              <option value="Member">Society Member</option>
              <option value="CR">Class Representative (CR)</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Event Coordinator">Event Coordinator</option>
              <option value="Visitor">Visitor / Guest</option>
            </Select>
            {errors.role && <span className={styles.error}>{errors.role}</span>}
          </div>

          {form.role !== 'Visitor' && (
            <>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Department *</label>
                  <Select value={form.department} onChange={e => set('department', e.target.value)}>
                    <option value="">Select department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Other">Other</option>
                  </Select>
                  {errors.department && <span className={styles.error}>{errors.department}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Semester *</label>
                  <Select value={form.semester} onChange={e => set('semester', e.target.value)}>
                    <option value="">Select semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={`${s}th Semester`}>{s}th Semester</option>)}
                  </Select>
                  {errors.semester && <span className={styles.error}>{errors.semester}</span>}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Roll Number *</label>
                  <Input placeholder="e.g. 22034156-043" value={form.rollNo} onChange={e => set('rollNo', e.target.value)} />
                  {errors.rollNo && <span className={styles.error}>{errors.rollNo}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Timing / Batch *</label>
                  <Select value={form.timing} onChange={e => set('timing', e.target.value)}>
                    <option value="">Select timing</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </Select>
                  {errors.timing && <span className={styles.error}>{errors.timing}</span>}
                </div>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Why do you want to join? <span className={styles.optional}>(optional)</span></label>
            <Textarea placeholder="Tell us about your interest in the society..." value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} />
          </div>

          <Button type="submit" size="lg" className={styles.submitBtn} disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Processing...' : 'Submit Application'}
          </Button>
        </form>

        <div className={styles.footer}>
          <span>Already a member?</span>
          <span className={styles.link} onClick={() => navigate('/login')}>Login here</span>
        </div>
        <div className={styles.backRow}>
          <span className={styles.link} onClick={() => navigate('/')}><ArrowLeft size={14} /> Back to Home</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;