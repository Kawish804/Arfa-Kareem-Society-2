import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './Login.module.css';

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
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Guarantee user roles is handled as an array
        const userRoles = Array.isArray(data.user.role) ? data.user.role : [data.user.role || 'Class Representative'];

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userRole', JSON.stringify(userRoles)); 
        login(data.user);
        
        toast({ title: 'Login Successful', description: `Welcome back, ${data.user.fullName}!` });

        // 🔴 STRICT ROUTING: ONLY checks against the 8 official roles
        if (userRoles.includes('President')) {
          navigate('/dashboard');
        } else if (userRoles.includes('General Secretary')) {
          navigate('/gs-dashboard');
        } else if (userRoles.includes('Joint General Secretary')) {
          navigate('/joint-gs-dashboard');
        } else if (userRoles.includes('Finance Head')) {
          navigate('/finance-dashboard');
        } else if (userRoles.includes('Assistant Finance Head')) {
          navigate('/assistant-finance-dashboard');
        } else if (userRoles.includes('Media Manager')) {
          navigate('/media-pr-dashboard');
        } else if (userRoles.includes('Co-Media Manager')) {
          navigate('/co-media-dashboard');
        } else if (userRoles.includes('Class Representative')) {
          navigate('/cr-dashboard');
        } else {
          navigate('/student'); // Ultimate fallback just in case
        }
        
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
          <p className={styles.forgot}><span className={styles.forgotLink}>Forgot password?</span></p>
        </form>
      </div>
    </div>
  );
};

export default Login;