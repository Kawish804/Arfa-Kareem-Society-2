import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Mail, KeyRound, CheckCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Modal from '@/components/ui/Modal.jsx'; // ENTERPRISE FIX: Imported Modal
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './Login.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_ROUTES = {
  'President': '/dashboard',
  'General Secretary': '/gs-dashboard',
  'Joint General Secretary': '/joint-gs-dashboard',
  'Finance Head': '/finance-dashboard',
  'Assistant Finance Head': '/assistant-finance-dashboard',
  'Media Manager': '/media-pr-dashboard',
  'Co-Media Manager': '/co-media-dashboard',
  'Class Representative': '/cr-dashboard',
  'Student': '/student'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- FORGOT PASSWORD STATES ---
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'verify' | 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        const userRoles = Array.isArray(data.user.role) ? data.user.role : [data.user.role || 'Student'];

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userRole', JSON.stringify(userRoles)); 
        login(data.user);
        
        toast({ title: 'Login Successful', description: `Welcome back, ${data.user.fullName}!` });

        const primaryRole = userRoles[0];
        const targetRoute = ROLE_ROUTES[primaryRole] || '/student';
        navigate(targetRoute);
      } else {
        toast({ title: 'Login Failed', description: data.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not connect to server.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // --- FORGOT PASSWORD HANDLERS ---
  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      toast({ title: 'Missing Information', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }

    setIsResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Code Sent', description: 'Check your inbox for the verification code.' });
        setForgotStep('verify');
      } else {
        // ENTERPRISE FIX: Highly polite error handling as requested
        toast({ 
          title: 'Email Not Found', 
          description: 'We could not find an account associated with this email. Please ensure it is typed correctly, or kindly contact the Society President/Admin to help reset your password.', 
          variant: 'warning',
          duration: 6000 
        });
      }
    } catch (error) {
      toast({ title: 'Network Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!resetOtp.trim()) {
      toast({ title: 'Missing Code', description: 'Please enter the verification code.', variant: 'destructive' });
      return;
    }

    setIsResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), otp: resetOtp.trim() })
      });

      if (response.ok) {
        toast({ title: 'Verified', description: 'Code accepted. Please enter your new password.' });
        setForgotStep('reset');
      } else {
        const data = await response.json();
        toast({ title: 'Invalid Code', description: data.message || 'The code you entered is incorrect or expired.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Network Error', variant: 'destructive' });
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Weak Password', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    setIsResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), otp: resetOtp.trim(), newPassword })
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Your password has been successfully reset. You can now log in.' });
        closeForgotModal();
      } else {
        toast({ title: 'Error', description: 'Failed to reset password. Please try the process again.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Network Error', variant: 'destructive' });
    } finally {
      setIsResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    if (!isResetLoading) {
      setForgotModalOpen(false);
      setTimeout(() => {
        setForgotStep('email');
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      }, 300);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}><GraduationCap size={28} /></div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to Arfa Kareem Society Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input type="email" placeholder="your@email.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <Button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Verifying...</> : 'Sign In'}
          </Button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <span className={styles.forgotLink} style={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => setForgotModalOpen(true)}>
              Forgot password?
            </span>
          </div>
        </form>

        <div className={styles.footer} style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: '#64748b' }}>Don't have an account? </span>
          <Link to="/signup" className={styles.link} style={{ textDecoration: 'none', fontWeight: '500' }}>
            Sign up here
          </Link>
        </div>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      <Modal open={forgotModalOpen} onClose={closeForgotModal} title="Reset Password" footer={null}>
        <div style={{ padding: '10px 0' }}>
          
          {/* STEP 1: ENTER EMAIL */}
          {forgotStep === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '8px' }}>
                <Mail size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>Enter the email address associated with your account and we'll send you a secure verification code.</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Account Email Address</label>
                <Input type="email" placeholder="e.g. your@email.edu.pk" value={resetEmail} onChange={e => setResetEmail(e.target.value)} disabled={isResetLoading} autoFocus />
              </div>
              <Button onClick={handleRequestReset} disabled={isResetLoading} style={{ width: '100%', marginTop: '8px' }}>
                {isResetLoading ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Searching...</> : 'Send Verification Code'}
              </Button>
            </div>
          )}

          {/* STEP 2: ENTER OTP */}
          {forgotStep === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '8px' }}>
                <KeyRound size={40} style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>We sent a 6-digit code to <strong>{resetEmail}</strong>.<br/>Please enter it below.</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Verification Code</label>
                <Input type="text" placeholder="123456" value={resetOtp} onChange={e => setResetOtp(e.target.value)} disabled={isResetLoading} style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.25rem', fontWeight: 'bold' }} autoFocus />
              </div>
              <Button onClick={handleVerifyOtp} disabled={isResetLoading} style={{ width: '100%', marginTop: '8px' }}>
                {isResetLoading ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Verifying...</> : 'Verify Code'}
              </Button>
              <button onClick={() => setForgotStep('email')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px' }}>
                Wrong email address? Go back
              </button>
            </div>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {forgotStep === 'reset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', color: '#64748b', marginBottom: '8px' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 12px', color: '#10b981' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>Code verified! Please create a new password for your account.</p>
              </div>
              
              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <div className={styles.passwordWrap}>
                  <Input type={showNewPassword ? 'text' : 'password'} placeholder="Minimum 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={isResetLoading} />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm New Password</label>
                <div className={styles.passwordWrap}>
                  <Input type={showNewPassword ? 'text' : 'password'} placeholder="Confirm your new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isResetLoading} />
                </div>
              </div>

              <Button onClick={handleResetPassword} disabled={isResetLoading || !newPassword || !confirmPassword} style={{ width: '100%', marginTop: '8px', backgroundColor: '#10b981' }}>
                {isResetLoading ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Saving...</> : 'Set New Password'}
              </Button>
            </div>
          )}

        </div>
      </Modal>
    </div>
  );
};

export default Login;