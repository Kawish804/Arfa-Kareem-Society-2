import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Login Successful', description: `Welcome back! Logged in as ${role}.` });
    navigate('/dashboard');
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
            <Input type="email" placeholder="your@email.edu" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <Input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <Select value={role} onChange={e => setRole(e.target.value)}>
              <option value="">Select your role</option>
              <option value="Admin">Admin</option>
              <option value="Finance Head">Finance Head</option>
              <option value="Member">Member</option>
            </Select>
          </div>
          <Button type="submit" className={styles.submitBtn}>Sign In</Button>
          <p className={styles.forgot}>
            <span className={styles.forgotLink}>Forgot password?</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
