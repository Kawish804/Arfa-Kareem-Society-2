import { useState } from 'react';
import { UserCheck, Plus, Clock, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { visitors as initialVisitors } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import styles from './Visitors.module.css';

const emptyForm = { name: '', type: 'Guest', purpose: '', contactNo: '', hostMember: '' };

const Visitors = () => {
  const { toast } = useToast();
  const [visitorList, setVisitorList] = useState(initialVisitors);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState('');

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.purpose) { toast({ title: 'Please fill required fields', variant: 'destructive' }); return; }
    const now = new Date();
    const entry = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
    setVisitorList(prev => [...prev, { id: String(Date.now()), ...form, entryTime: entry, exitTime: '' }]);
    toast({ title: 'Visitor entry recorded' });
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleExit = (visitor) => {
    const now = new Date();
    const exit = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
    setVisitorList(prev => prev.map(v => v.id === visitor.id ? { ...v, exitTime: exit } : v));
    toast({ title: `Exit recorded for ${visitor.name}` });
  };

  const handleDelete = (visitor) => {
    setVisitorList(prev => prev.filter(v => v.id !== visitor.id));
    toast({ title: 'Visitor record deleted' });
  };

  const filtered = filterType ? visitorList.filter(v => v.type === filterType) : visitorList;
  const typeVariant = (t) => t === 'Guest' ? 'default' : t === 'Staff' ? 'secondary' : 'destructive';

  return (
    <div className={styles.page}>
      <PageHeader title="Visitor Management" subtitle="Track all non-member entries" actionLabel="Record Entry" onAction={() => { setForm(emptyForm); setDialogOpen(true); }} />

      <div className={styles.filterBar}>
        <Select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Guest">Guest</option>
          <option value="Staff">Staff</option>
          <option value="Delivery">Delivery</option>
        </Select>
        <span className={styles.count}>{filtered.length} records</span>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>Name</th><th>Type</th><th>Purpose</th><th>Contact</th><th>Host</th><th>Entry</th><th>Exit</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td className={styles.bold}>{v.name}</td>
                <td><Badge variant={typeVariant(v.type)}>{v.type}</Badge></td>
                <td className={styles.muted}>{v.purpose}</td>
                <td className={styles.muted}>{v.contactNo}</td>
                <td className={styles.muted}>{v.hostMember}</td>
                <td className={styles.muted}>{v.entryTime}</td>
                <td>{v.exitTime ? <span className={styles.muted}>{v.exitTime}</span> : <Badge variant="secondary">Still Inside</Badge>}</td>
                <td className={styles.actions}>
                  {!v.exitTime && <Button size="sm" variant="outline" onClick={() => handleExit(v)}><Clock size={14} /> Exit</Button>}
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(v)}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className={styles.empty}>No visitor records found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Record Visitor Entry"
        footer={<><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSave}><UserCheck size={14} /> Record Entry</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Visitor Name *</label><Input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Full name" /></div>
          <div className={styles.field}><label>Type</label>
            <Select value={form.type} onChange={e => setField('type', e.target.value)}>
              <option value="Guest">Guest / Visitor</option><option value="Staff">Staff Member</option><option value="Delivery">Delivery Personnel</option>
            </Select>
          </div>
          <div className={styles.field}><label>Purpose *</label><Input value={form.purpose} onChange={e => setField('purpose', e.target.value)} placeholder="Purpose of visit" /></div>
          <div className={styles.field}><label>Contact Number</label><Input value={form.contactNo} onChange={e => setField('contactNo', e.target.value)} placeholder="0300-XXXXXXX" /></div>
          <div className={styles.field}><label>Host Member</label><Input value={form.hostMember} onChange={e => setField('hostMember', e.target.value)} placeholder="Who are they visiting?" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Visitors;