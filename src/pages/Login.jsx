import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // ENTERPRISE FIX: Imported Link
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './Login.module.css';

// ENTERPRISE FIX: Dynamic API URL resolution
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ENTERPRISE FIX: Clean routing map for O(1) lookups
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
        // Guarantee user roles is handled as an array
        const userRoles = Array.isArray(data.user.role) ? data.user.role : [data.user.role || 'Student'];

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userRole', JSON.stringify(userRoles)); 
        login(data.user);
        
        toast({ title: 'Login Successful', description: `Welcome back, ${data.user.fullName}!` });

        // STRICT ROUTING
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
            {loading ? 'Verifying...' : 'Sign In'}
          </Button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <span className={styles.forgotLink} style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
              Forgot password?
            </span>
          </div>
        </form>

        {/* ENTERPRISE FIX: Accessible navigation link back to Signup */}
        <div className={styles.footer} style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: '#64748b' }}>Don't have an account? </span>
          <Link to="/signup" className={styles.link} style={{ textDecoration: 'none', fontWeight: '500' }}>
            Sign up here
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default Login;