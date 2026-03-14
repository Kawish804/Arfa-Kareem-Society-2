import { useState } from 'react';
import { Wallet, Eye, FileText, X } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { funds as initialFunds } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import styles from './Funds.module.css';

const emptyForm = { memberName: '', class: '', amount: '', status: '', receipt: null, receiptPreview: null };

const Funds = () => {
  const [fundList, setFundList] = useState(initialFunds);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const { toast } = useToast();
  const totalCollected = fundList.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, receipt: file, receiptPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!form.memberName || !form.amount || !form.status) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const newFund = {
      id: String(Date.now()),
      memberName: form.memberName,
      class: form.class,
      amount: Number(form.amount),
      status: form.status,
      date: new Date().toISOString().split('T')[0],
      receiptName: form.receipt ? form.receipt.name : null,
      receiptData: form.receiptPreview || null,
    };
    setFundList(prev => [...prev, newFund]);
    toast({ title: 'Fund Record Added' });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  return (
    <div>
      <PageHeader title="Fund Management" description="Track and manage fund collection" actionLabel="Add Fund Record" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div className={styles.summaryWrap}>
        <StatCard title="Total Funds Collected" value={`Rs ${totalCollected.toLocaleString()}`} icon={Wallet}
          description={`${fundList.filter(f => f.status === 'Paid').length} of ${fundList.length} members paid`} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Member Name</th>
              <th className={styles.hideSmall}>Class</th>
              <th>Amount</th>
              <th>Status</th>
              <th className={styles.hideMd}>Date</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {fundList.map(f => (
              <tr key={f.id}>
                <td className={styles.bold}>{f.memberName}</td>
                <td className={`${styles.hideSmall} ${styles.muted}`}>{f.class}</td>
                <td>Rs {f.amount.toLocaleString()}</td>
                <td><Badge variant={f.status === 'Paid' ? 'default' : 'destructive'}>{f.status}</Badge></td>
                <td className={`${styles.hideMd} ${styles.muted}`}>{f.date}</td>
                <td>
                  {f.receiptData ? (
                    <button className={styles.viewReceiptBtn} onClick={() => setPreviewReceipt(f)}>
                      <Eye size={14} /> View
                    </button>
                  ) : f.receiptName ? (
                    <span className={styles.receiptFile}><FileText size={14} /> {f.receiptName}</span>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <div className={styles.receiptOverlay} onClick={() => setPreviewReceipt(null)}>
          <div className={styles.receiptModal} onClick={e => e.stopPropagation()}>
            <div className={styles.receiptHeader}>
              <div>
                <h3 className={styles.receiptTitle}>Payment Receipt <span className={styles.receiptBadge}>Verified</span></h3>
                <p className={styles.receiptSub}>{previewReceipt.memberName} · Rs {previewReceipt.amount.toLocaleString()} · {previewReceipt.date}</p>
              </div>
              <button className={styles.receiptClose} onClick={() => setPreviewReceipt(null)}><X size={18} /></button>
            </div>
            <div className={styles.receiptBody}>
              {previewReceipt.receiptData?.startsWith('data:image') ? (
                <img src={previewReceipt.receiptData} alt="Receipt" className={styles.receiptImg} />
              ) : previewReceipt.receiptData?.startsWith('data:application/pdf') ? (
                <iframe src={previewReceipt.receiptData} className={styles.receiptPdf} title="Receipt PDF" />
              ) : (
                <p className={styles.muted}>Unable to preview this file type</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add Fund Record"
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Member Name *</label><Input placeholder="Enter member name" value={form.memberName} onChange={e => setField('memberName', e.target.value)} /></div>
          <div className={styles.field}><label>Class</label><Input placeholder="e.g. BSCS-6A" value={form.class} onChange={e => setField('class', e.target.value)} /></div>
          <div className={styles.field}><label>Amount (Rs) *</label><Input type="number" placeholder="5000" value={form.amount} onChange={e => setField('amount', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Payment Status *</label>
            <Select value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="">Select</option><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option>
            </Select>
          </div>
          <div className={styles.field}>
            <label>Upload Receipt</label>
            <div className={styles.uploadWrap}>
              <input type="file" accept="image/*,.pdf" id="receiptUpload" className={styles.fileInput} onChange={handleFileChange} />
              <label htmlFor="receiptUpload" className={styles.uploadBtn}>
                {form.receipt ? form.receipt.name : 'Choose file...'}
              </label>
              {form.receiptPreview && form.receiptPreview.startsWith('data:image') && (
                <img src={form.receiptPreview} alt="Preview" className={styles.uploadPreview} />
              )}
              {form.receipt && <span className={styles.fileName}>✓ {form.receipt.name}</span>}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Funds;