import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Shield } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Contribute.module.css';

const Contribute = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState('amount'); // amount | payment | success
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);

  const presetAmounts = [500, 1000, 2000, 5000, 10000];
  const selectedAmount = amount === 'custom' ? Number(customAmount) : Number(amount);

  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleProceed = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      toast({ title: 'Please select or enter an amount', variant: 'destructive' }); return;
    }
    if (!purpose) {
      toast({ title: 'Please select a purpose', variant: 'destructive' }); return;
    }
    setStep('payment');
  };

  const handlePay = () => {
    if (!card.name || !card.number || !card.expiry || !card.cvv) {
      toast({ title: 'Please fill all card details', variant: 'destructive' }); return;
    }
    if (card.number.replace(/\s/g, '').length < 16) {
      toast({ title: 'Please enter a valid card number', variant: 'destructive' }); return;
    }
    if (card.cvv.length < 3) {
      toast({ title: 'Please enter a valid CVV', variant: 'destructive' }); return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className={styles.page}>
      <nav className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => step === 'payment' ? setStep('amount') : navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.secureBadge}><Lock size={14} /> Secure Payment</div>
      </nav>

      <div className={styles.container}>
        {/* Progress Steps */}
        <div className={styles.progress}>
          <div className={`${styles.progressStep} ${step === 'amount' || step === 'payment' || step === 'success' ? styles.active : ''}`}>
            <div className={styles.stepCircle}>1</div>
            <span>Amount</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${step === 'payment' || step === 'success' ? styles.active : ''}`}>
            <div className={styles.stepCircle}>2</div>
            <span>Payment</span>
          </div>
          <div className={styles.progressLine} />
          <div className={`${styles.progressStep} ${step === 'success' ? styles.active : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span>Done</span>
          </div>
        </div>

        {/* Step 1: Amount Selection */}
        {step === 'amount' && (
          <div className={styles.card}>
            <h1 className={styles.cardTitle}>Contribute to the Society</h1>
            <p className={styles.cardSubtitle}>Your contribution helps fund events, workshops, and society activities.</p>

            <div className={styles.field}>
              <label>Select Amount (Rs)</label>
              <div className={styles.amountGrid}>
                {presetAmounts.map(a => (
                  <button key={a} className={`${styles.amountBtn} ${amount === String(a) ? styles.amountActive : ''}`}
                    onClick={() => { setAmount(String(a)); setCustomAmount(''); }}>
                    Rs {a.toLocaleString()}
                  </button>
                ))}
                <button className={`${styles.amountBtn} ${amount === 'custom' ? styles.amountActive : ''}`}
                  onClick={() => setAmount('custom')}>
                  Custom
                </button>
              </div>
            </div>

            {amount === 'custom' && (
              <div className={styles.field}>
                <label>Enter Custom Amount (Rs)</label>
                <Input type="number" placeholder="Enter amount" value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)} />
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

            {selectedAmount > 0 && (
              <div className={styles.summary}>
                <div className={styles.summaryRow}><span>Contribution</span><span>Rs {selectedAmount.toLocaleString()}</span></div>
                <div className={styles.summaryRow}><span>Purpose</span><span>{purpose || '—'}</span></div>
                <div className={styles.summaryTotal}><span>Total</span><span>Rs {selectedAmount.toLocaleString()}</span></div>
              </div>
            )}

            <Button size="lg" onClick={handleProceed} className={styles.fullBtn}>
              Proceed to Payment <CreditCard size={16} />
            </Button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className={styles.card}>
            <h1 className={styles.cardTitle}>Payment Details</h1>
            <p className={styles.cardSubtitle}>Amount: <strong>Rs {selectedAmount.toLocaleString()}</strong> — {purpose}</p>

            <div className={styles.cardPreview}>
              <div className={styles.cardChip} />
              <div className={styles.cardNumber}>{card.number || '•••• •••• •••• ••••'}</div>
              <div className={styles.cardBottom}>
                <div><span className={styles.cardLabel}>Card Holder</span><div>{card.name || 'YOUR NAME'}</div></div>
                <div><span className={styles.cardLabel}>Expires</span><div>{card.expiry || 'MM/YY'}</div></div>
              </div>
            </div>

            <div className={styles.field}>
              <label>Cardholder Name *</label>
              <Input placeholder="Name on card" value={card.name}
                onChange={e => setCard(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Card Number *</label>
              <Input placeholder="1234 5678 9012 3456" value={card.number}
                onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))} />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Expiry Date *</label>
                <Input placeholder="MM/YY" value={card.expiry}
                  onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))} />
              </div>
              <div className={styles.field}>
                <label>CVV *</label>
                <Input type="password" placeholder="•••" maxLength={4} value={card.cvv}
                  onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
              </div>
            </div>

            <div className={styles.secureNote}>
              <Shield size={14} /> Your payment information is encrypted and secure
            </div>

            <Button size="lg" onClick={handlePay} disabled={processing} className={styles.fullBtn}>
              {processing ? 'Processing...' : `Pay Rs ${selectedAmount.toLocaleString()}`}
            </Button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className={styles.card} style={{ textAlign: 'center' }}>
            <div className={styles.successIcon}><CheckCircle size={56} /></div>
            <h1 className={styles.cardTitle}>Payment Successful!</h1>
            <p className={styles.cardSubtitle}>Thank you for your generous contribution of <strong>Rs {selectedAmount.toLocaleString()}</strong> towards {purpose}.</p>
            <div className={styles.receiptBox}>
              <div className={styles.receiptRow}><span>Transaction ID</span><span>TXN-{Date.now().toString().slice(-8)}</span></div>
              <div className={styles.receiptRow}><span>Amount</span><span>Rs {selectedAmount.toLocaleString()}</span></div>
              <div className={styles.receiptRow}><span>Purpose</span><span>{purpose}</span></div>
              <div className={styles.receiptRow}><span>Date</span><span>{new Date().toLocaleDateString()}</span></div>
              <div className={styles.receiptRow}><span>Status</span><span className={styles.successText}>Completed</span></div>
            </div>
            <div className={styles.successBtns}>
              <Button onClick={() => navigate('/student')}>Back to Portal</Button>
              <Button variant="outline" onClick={() => { setStep('amount'); setAmount(''); setCard({ name: '', number: '', expiry: '', cvv: '' }); }}>
                Make Another Contribution
              </Button>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className={styles.trustBadges}>
          <div className={styles.trustItem}><Lock size={16} /> SSL Encrypted</div>
          <div className={styles.trustItem}><Shield size={16} /> Secure Checkout</div>
          <div className={styles.trustItem}><CreditCard size={16} /> Visa / Mastercard</div>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
