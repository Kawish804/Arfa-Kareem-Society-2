import { useState, useEffect } from 'react';
import { Wallet, Eye, FileText, X, Filter, CheckCircle, Clock, TrendingUp, Settings } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import styles from './Funds.module.css';

const emptyForm = { 
  memberName: '', rollNo: '', department: 'BS-IT', semester: '1st', 
  timing: 'Morning', amount: '', status: '', receipt: null, receiptPreview: null 
};

const Funds = () => {
  const [fundList, setFundList] = useState([]);
  const [expenseList, setExpenseList] = useState([]); 
  const [monthlyFee, setMonthlyFee] = useState(500); // 🔴 DYNAMIC FEE STATE

  const [dialogOpen, setDialogOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false); // 🔴 FEE MODAL STATE
  const [newFee, setNewFee] = useState('');
  
  const [form, setForm] = useState(emptyForm);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  
  const [timeFilter, setTimeFilter] = useState('All'); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Dynamic Fee
    fetch('http://localhost:5000/api/settings/fee')
      .then(res => res.json())
      .then(data => {
        setMonthlyFee(data.fee);
        setNewFee(data.fee);
      })
      .catch(err => console.error("Error fetching fee:", err));

    fetch('http://localhost:5000/api/fund-collections/records')
      .then(res => res.json())
      .then(data => setFundList(data))
      .catch(err => console.error("Error fetching funds:", err));

    fetch('http://localhost:5000/api/expenses/records')
      .then(res => res.json())
      .then(data => setExpenseList(data))
      .catch(err => console.error("Error fetching expenses:", err));
  }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // 🔴 UPDATE DYNAMIC FEE FUNCTION
  const handleUpdateFee = async () => {
    if (!newFee || newFee <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' }); return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/settings/fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: newFee })
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyFee(data.fee);
        toast({ title: 'Standard Fee Updated Successfully!' });
        setFeeModalOpen(false);
      }
    } catch (error) {
      toast({ title: 'Failed to update fee', variant: 'destructive' });
    }
  };

  const filterByTime = (list) => {
    if (timeFilter === 'All') return list;
    const today = new Date();
    return list.filter(record => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      if (timeFilter === 'This Year') return recordDate.getFullYear() === today.getFullYear();
      if (timeFilter === 'This Month') return recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth();
      if (timeFilter === 'This Week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      }
      return true;
    });
  };

  const timeFilteredFunds = filterByTime(fundList);
  const timeFilteredExpenses = filterByTime(expenseList); 
  
  const totalExpected = timeFilteredFunds.reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalCollected = timeFilteredFunds.filter(f => f.status === 'Paid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const totalPending = timeFilteredFunds.filter(f => f.status === 'Unpaid').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  
  const totalExpenses = timeFilteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const availableBalance = totalCollected - totalExpenses;

  const paidCount = timeFilteredFunds.filter(f => f.status === 'Paid').length;
  const unpaidCount = timeFilteredFunds.filter(f => f.status === 'Unpaid').length;
  const totalCount = timeFilteredFunds.length;

  const displayFunds = timeFilteredFunds.filter(f => {
    if (statusFilter === 'All') return true;
    return f.status === statusFilter;
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, receipt: file, receiptPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.memberName || !form.amount || !form.status) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }

    const newFund = {
      studentName: form.memberName,
      rollNo: form.rollNo, 
      department: form.department,
      semester: form.semester,
      timing: form.timing,
      amount: Number(form.amount),
      status: form.status,
      date: new Date().toISOString().split('T')[0],
      receiptName: form.receipt ? form.receipt.name : null,
      receiptData: form.receiptPreview || null,
      uploadedBy: 'Admin'
    };

    try {
      const res = await fetch('http://localhost:5000/api/fund-collections/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFund)
      });

      if (res.ok) {
        const savedFund = await res.json();
        setFundList(prev => [savedFund, ...prev]);
        toast({ title: 'Fund Record Added' });
        setDialogOpen(false);
        setForm(emptyForm);
      }
    } catch (error) {
      toast({ title: 'Failed to add record', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader 
        title="Fund Management" 
        description="Track and manage fund collection from CRs and Direct Entries" 
        actionLabel="Add Fund Record" 
        onAction={() => { setForm(emptyForm); setDialogOpen(true); }} 
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" style={{ marginRight: '4px' }} />
          {['All', 'This Week', 'This Month', 'This Year'].map(filterOption => (
            <Button key={filterOption} size="sm" variant={timeFilter === filterOption ? 'primary' : 'outline'} onClick={() => { setTimeFilter(filterOption); setStatusFilter('All'); }}>
              {filterOption}
            </Button>
          ))}
        </div>
        
        {/* 🔴 NEW FEE SETTINGS BUTTON */}
        <Button variant="outline" onClick={() => setFeeModalOpen(true)} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
          <Settings size={16} style={{ marginRight: '8px' }}/> Set Monthly Fee (Rs {monthlyFee})
        </Button>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Click on a card below to filter the table by status.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div onClick={() => setStatusFilter('All')} style={{ cursor: 'pointer', transition: '0.2s', opacity: statusFilter === 'All' ? 1 : 0.5 }}>
          <StatCard title={`Total Expected (${timeFilter})`} value={`Rs ${totalExpected.toLocaleString()}`} icon={Wallet} description={`From ${totalCount} total records`} />
        </div>
        <div onClick={() => setStatusFilter('Paid')} style={{ cursor: 'pointer', transition: '0.2s', opacity: statusFilter === 'Paid' ? 1 : 0.5 }}>
          <StatCard title={`Collected (${timeFilter})`} value={`Rs ${totalCollected.toLocaleString()}`} icon={CheckCircle} description={`${paidCount} students have paid`} />
        </div>
        <div onClick={() => setStatusFilter('Unpaid')} style={{ cursor: 'pointer', transition: '0.2s', opacity: statusFilter === 'Unpaid' ? 1 : 0.5 }}>
          <StatCard title={`Pending Collection (${timeFilter})`} value={`Rs ${totalPending.toLocaleString()}`} icon={Clock} description={`${unpaidCount} students still pending`} />
        </div>
        <div>
          <StatCard title={`Available Balance (${timeFilter})`} value={`Rs ${availableBalance.toLocaleString()}`} icon={TrendingUp} description={`Collected minus Rs ${totalExpenses.toLocaleString()} in expenses`} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-main)', fontWeight: 600 }}>
          {statusFilter === 'All' ? 'All Records' : `${statusFilter} Records`}
        </h3>
        {statusFilter !== 'All' && (
          <Button size="sm" variant="outline" onClick={() => setStatusFilter('All')}>
            <X size={14} style={{ marginRight: '6px' }} /> Clear Filter
          </Button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th className={styles.hideSmall}>Department & Roll No</th>
              <th>Amount</th>
              <th>Status</th>
              <th className={styles.hideMd}>Date</th>
              <th>Added By</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {displayFunds.length > 0 ? displayFunds.map(f => (
              <tr key={f._id}>
                <td className={styles.bold}>{f.studentName}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>
                  <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{f.department || '—'} {f.rollNo ? `(${f.rollNo})` : ''}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>{f.semester ? `${f.semester} Sem` : ''} {f.semester && f.timing ? '•' : ''} {f.timing || ''}</div>
                </td>
                <td className={styles.bold}>Rs {f.amount?.toLocaleString() || 0}</td>
                <td><Badge variant={f.status === 'Paid' ? 'default' : 'destructive'}>{f.status}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</td>
                <td><Badge variant="secondary">{f.uploadedBy || 'Unknown'}</Badge></td>
                <td>
                  {f.receiptData ? (
                    <button className={styles.viewReceiptBtn} onClick={() => setPreviewReceipt(f)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}>
                      <Eye size={14} /> View
                    </button>
                  ) : f.receiptName ? (
                    <span className={styles.receiptFile}><FileText size={14} /> {f.receiptName}</span>
                  ) : f.status === 'Paid' ? (
                    <button className={styles.viewReceiptBtn} onClick={() => setPreviewReceipt(f)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>
                      <CheckCircle size={14} /> E-Receipt
                    </button>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No {statusFilter.toLowerCase()} fund records found for {timeFilter.toLowerCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {previewReceipt && (
        <div className={styles.receiptOverlay} onClick={() => setPreviewReceipt(null)}>
          <div className={styles.receiptModal} onClick={e => e.stopPropagation()} style={{ overflow: 'hidden' }}>
            <div className={styles.receiptHeader}>
              <div>
                <h3 className={styles.receiptTitle}>Payment Receipt</h3>
                <p className={styles.receiptSub}>{previewReceipt.studentName} · Rs {previewReceipt.amount?.toLocaleString() || 0} · {previewReceipt.date}</p>
              </div>
              <button className={styles.receiptClose} onClick={() => setPreviewReceipt(null)}><X size={18} /></button>
            </div>
            <div className={styles.receiptBody} style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {previewReceipt.receiptData?.startsWith('data:image') ? (
                <img src={previewReceipt.receiptData} alt="Receipt" className={styles.receiptImg} style={{ width: '100%', borderRadius: '8px' }} />
              ) : previewReceipt.receiptData?.startsWith('data:application/pdf') ? (
                <iframe src={previewReceipt.receiptData} className={styles.receiptPdf} title="Receipt PDF" style={{ width: '100%', height: '400px', border: 'none' }} />
              ) : (
                <div style={{ backgroundColor: '#f8fafc', padding: '30px', borderRadius: '12px', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#d1fae5', marginBottom: '15px' }}>
                    <CheckCircle size={32} color="#10b981" />
                  </div>
                  <h2 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '1.5rem' }}>Official E-Receipt</h2>
                  <div style={{ textAlign: 'left', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Student Name</span><span style={{ fontWeight: 'bold', color: '#0f172a' }}>{previewReceipt.studentName}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Department</span><span style={{ fontWeight: '500', color: '#0f172a' }}>{previewReceipt.department}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Amount Paid</span><span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.1rem' }}>Rs {previewReceipt.amount?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Collected By</span><span style={{ fontWeight: '500', color: '#0f172a' }}>{previewReceipt.uploadedBy}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Date</span><span style={{ fontWeight: '500', color: '#0f172a' }}>{new Date(previewReceipt.date).toLocaleDateString()}</span></div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>This is a system-generated electronic receipt.<br/>No physical signature is required.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔴 FEE UPDATE MODAL */}
      <Modal open={feeModalOpen} onClose={() => setFeeModalOpen(false)} title="Set Standard Monthly Fee" footer={<><Button variant="outline" onClick={() => setFeeModalOpen(false)}>Cancel</Button><Button onClick={handleUpdateFee}>Save Fee</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}>
            <label>Amount (Rs) *</label>
            <Input type="number" value={newFee} onChange={e => setNewFee(e.target.value)} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This amount will be automatically applied to all Class Representatives' dashboards.</p>
        </div>
      </Modal>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Direct Fund Record" footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Student Name *</label><Input placeholder="Enter student name" value={form.memberName} onChange={e => setField('memberName', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.field} style={{ flex: 1 }}><label>Department *</label><Select value={form.department} onChange={e => setField('department', e.target.value)}><option value="BS-IT">BS-IT</option><option value="Chemistry">Chemistry</option><option value="Economics">Economics</option><option value="English">English</option><option value="Maths">Maths</option></Select></div>
            <div className={styles.field} style={{ flex: 1 }}><label>Roll Number</label><Input value={form.rollNo} onChange={e => setField('rollNo', e.target.value)} placeholder="Optional" /></div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.field} style={{ flex: 1 }}><label>Semester *</label><Select value={form.semester} onChange={e => setField('semester', e.target.value)}><option value="1st">1st Semester</option><option value="2nd">2nd Semester</option><option value="3rd">3rd Semester</option><option value="4th">4th Semester</option><option value="5th">5th Semester</option><option value="6th">6th Semester</option><option value="7th">7th Semester</option><option value="8th">8th Semester</option></Select></div>
            <div className={styles.field} style={{ flex: 1 }}><label>Timing *</label><Select value={form.timing} onChange={e => setField('timing', e.target.value)}><option value="Morning">Morning</option><option value="Evening">Evening</option></Select></div>
          </div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" placeholder="5000" value={form.amount} onChange={e => setField('amount', e.target.value)} /></div>
          <div className={styles.field}><label>Payment Status *</label><Select value={form.status} onChange={e => setField('status', e.target.value)}><option value="">Select</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></Select></div>
          <div className={styles.field}>
            <label>Upload Receipt</label>
            <div className={styles.uploadWrap}>
              <input type="file" accept="image/*,.pdf" id="receiptUpload" className={styles.fileInput} onChange={handleFileChange} />
              <label htmlFor="receiptUpload" className={styles.uploadBtn}>{form.receipt ? form.receipt.name : 'Choose file...'}</label>
              {form.receiptPreview && form.receiptPreview.startsWith('data:image') && <img src={form.receiptPreview} alt="Preview" className={styles.uploadPreview} />}
              {form.receipt && <span className={styles.fileName}>✓ {form.receipt.name}</span>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Funds;