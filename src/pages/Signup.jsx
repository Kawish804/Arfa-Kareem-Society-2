import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, UserPlus, CheckCircle, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import styles from './Signup.module.css';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    semester: '',
    reason: '',
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
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}><CheckCircle size={48} /></div>
          <h2 className={styles.successTitle}>Request Submitted!</h2>
          <p className={styles.successText}>
            Your request to join the <strong>Arfa Kareem Society</strong> has been sent to the admin for approval.
          </p>
          <p className={styles.successNote}>
            You will receive a confirmation email at <strong>{form.email}</strong> once your membership is approved.
          </p>
          <div className={styles.successDetails}>
            <div className={styles.detailRow}><span>Name</span><span>{form.fullName}</span></div>
            <div className={styles.detailRow}><span>Department</span><span>{form.department}</span></div>
            <div className={styles.detailRow}><span>Semester</span><span>{form.semester}</span></div>
            <div className={styles.detailRow}><span>Status</span><span className={styles.pending}>Pending Approval</span></div>
          </div>
          <div className={styles.successBtns}>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
            <Button variant="outline" onClick={() => navigate('/login')}>Go to Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}><GraduationCap size={26} /></div>
          <h1 className={styles.title}>Join the Society</h1>
          <p className={styles.subtitle}>Create your account to become a member of Arfa Kareem Society</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
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
            <Input type="email" placeholder="your.email@university.edu" value={form.email} onChange={e => set('email', e.target.value)} />
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
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`${s}th Semester`}>{s}th Semester</option>)}
              </Select>
              {errors.semester && <span className={styles.error}>{errors.semester}</span>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Why do you want to join? <span className={styles.optional}>(optional)</span></label>
            <Textarea placeholder="Tell us about your interest in the society..." value={form.reason} onChange={e => set('reason', e.target.value)} rows={3} />
          </div>

          <Button type="submit" size="lg" className={styles.submitBtn}>
            <UserPlus size={18} /> Submit Application
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
