import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Shield, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './Contribute.module.css';

const Contribute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [processing, setProcessing] = useState(false);

  // States for the success screen
  const [successAmount, setSuccessAmount] = useState('');
  const [successPurpose, setSuccessPurpose] = useState('');

  const presetAmounts = [500, 1000, 2000, 5000, 10000];
  const selectedAmount = amount === 'custom' ? Number(customAmount) : Number(amount);

  // 🔴 CHECK STRIPE REDIRECT RESULTS ON PAGE LOAD
  useEffect(() => {
    const query = new URLSearchParams(location.search);

    if (query.get('status') === 'success') {
      const amt = query.get('amount');
      const purp = query.get('purpose');

      setSuccessAmount(amt);
      setSuccessPurpose(purp);
      setStep('success');

      // Save to database secretly in the background
      recordPaymentToDatabase(amt, purp);

      // Clean up the URL so if they refresh, it doesn't trigger again
      window.history.replaceState(null, '', '/dashboard/contribute');
    }

    if (query.get('status') === 'cancelled') {
      toast({ title: 'Payment Cancelled', description: 'You cancelled the checkout process.', variant: 'destructive' });
      window.history.replaceState(null, '', '/dashboard/contribute');
    }
  }, [location]);

  const recordPaymentToDatabase = async (paidAmount, paidPurpose) => {
    try {
      const generatedTxnId = `TXN-${Date.now().toString().slice(-8).toUpperCase()}`;

      const payload = {
        studentName: currentUser?.fullName || 'Anonymous Contributor',
        email: currentUser?.email || 'N/A',
        department: currentUser?.department || 'N/A',
        rollNo: currentUser?.rollNo || 'N/A',
        amount: Number(paidAmount),
        purpose: paidPurpose,
        transactionId: generatedTxnId
      };

      // 🔴 Send data to the new dedicated Contributions endpoint
      await fetch('http://localhost:5000/api/contributions/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      console.error('Failed to log payment to DB', err);
    }
  };

  // 🔴 REDIRECT TO STRIPE
  const handleProceedToStripe = async () => {
    if (!selectedAmount || selectedAmount <= 0) {
      toast({ title: 'Please select an amount', variant: 'destructive' }); return;
    }
    if (!purpose) {
      toast({ title: 'Please select a purpose', variant: 'destructive' }); return;
    }

    setProcessing(true);
    try {
      const res = await fetch('http://localhost:5000/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({
          amount: selectedAmount,
          purpose: purpose,
          studentName: currentUser?.fullName || 'Anonymous',
          department: currentUser?.department || 'N/A',
          rollNo: currentUser?.rollNo || 'N/A'
        })
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect the user to Stripe's secure page!
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      toast({ title: 'Gateway Error', description: error.message, variant: 'destructive' });
      setProcessing(false);
    }
  };

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.secureBadge}><Lock size={14} /> Stripe Secure Checkout</div>
      </nav>

      <div className={styles.container}>
        {step === 'amount' && (
          <div className={styles.card}>
            <h1 className={styles.cardTitle}>Contribute to the Society</h1>
            <p className={styles.cardSubtitle}>Your contribution helps fund events, workshops, and society activities.</p>

            <div className={styles.field}>
              <label>Select Amount (Rs)</label>
              <div className={styles.amountGrid}>
                {presetAmounts.map(a => (
                  <button key={a} className={`${styles.amountBtn} ${amount === String(a) ? styles.amountActive : ''}`} onClick={() => { setAmount(String(a)); setCustomAmount(''); }}>
                    Rs {a.toLocaleString()}
                  </button>
                ))}
                <button className={`${styles.amountBtn} ${amount === 'custom' ? styles.amountActive : ''}`} onClick={() => setAmount('custom')}>
                  Custom
                </button>
              </div>
            </div>

            {amount === 'custom' && (
              <div className={styles.field}>
                <label>Enter Custom Amount (Rs)</label>
                <Input type="number" placeholder="Enter amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
              </div>
            )}

            <div className={styles.field}>
              <label>Contribution Purpose *</label>
              <Select value={purpose} onChange={e => setPurpose(e.target.value)}>
                <option value="">Select purpose</option>
                <option value="General Fund">General Fund</option>
                <option value="Event Sponsorship">Event Sponsorship</option>
                <option value="Tech Equipment">Tech Equipment</option>
                <option value="Scholarship Fund">Scholarship Fund</option>
                <option value="Community Outreach">Community Outreach</option>
              </Select>
            </div>

            <Button size="lg" onClick={handleProceedToStripe} disabled={processing} className={styles.fullBtn}>
              {processing ? 'Connecting to Secure Gateway...' : `Proceed to Pay Rs ${selectedAmount.toLocaleString()}`} <CreditCard size={16} />
            </Button>

            <div className={styles.trustBadges} style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', color: '#64748b', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Lock size={14} /> SSL Encrypted</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={14} /> Stripe Secure</span>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <div className={styles.successIcon} style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircle size={64} />
            </div>
            <h1 className={styles.cardTitle}>Payment Successful!</h1>
            <p className={styles.cardSubtitle}>Thank you for your generous contribution of <strong>Rs {Number(successAmount).toLocaleString()}</strong> towards {successPurpose}.</p>

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#64748b' }}>Amount</span><strong style={{ color: '#0f172a' }}>Rs {Number(successAmount).toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ color: '#64748b' }}>Purpose</span><strong style={{ color: '#0f172a' }}>{successPurpose}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Status</span><strong style={{ color: '#10b981' }}>Completed & Logged</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Button onClick={() => navigate('/')}>Back to Portal</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contribute;