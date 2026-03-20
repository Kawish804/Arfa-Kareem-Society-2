import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // <--- IMPORTANT: For global login state
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth(); // <--- This function saves user to localStorage/State

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Save user data to Global Auth Context
        // data.user should contain { id, fullName, email, role } from your backend
        login(data.user); 

        toast({ title: 'Login Successful', description: `Welcome back, ${data.user.fullName}!` });

        // 2. Role-Based Redirection
        if (data.user.role === 'Admin') {
          navigate('/dashboard');
        } else if (data.user.role === 'CR') {
          navigate('/cr-dashboard');
        } else {
          navigate('/student'); // Default for Members/Students
        }
      } else {
        toast({ 
          title: 'Login Failed', 
          description: data.message || data.error || 'Invalid credentials', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not connect to the server.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <GraduationCap size={28} />
          </div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to Arfa Kareem Society Management System</p>
        </div>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <Input 
              type="email" 
              placeholder="your@email.edu" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <Input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <Select value={role} onChange={e => setRole(e.target.value)} required>
              <option value="">Select your role</option>
              <option value="Admin">Admin</option>
              <option value="CR">Class Representative (CR)</option>
              <option value="Finance Manager">Finance Manager</option>
              <option value="Event Coordinator">Event Coordinator</option>
              <option value="Student">Regular Student</option>
              <option value="Member">Society Member</option>
              <option value="Visitor">Visitor</option>
            </Select>
          </div>
          <Button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Verifying...' : 'Sign In'}
          </Button>
          <p className={styles.forgot}>
            <span className={styles.forgotLink}>Forgot password?</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;