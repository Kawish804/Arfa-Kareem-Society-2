import { useState } from 'react';
import { Search, Edit, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { members as initialMembers } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Members.module.css';

const emptyForm = { name: '', email: '', role: '', class: '' };

const Members = () => {
  const [memberList, setMemberList] = useState(initialMembers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const roles = [...new Set(initialMembers.map(m => m.role))];
  const filtered = memberList.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const openAdd = () => { setEditMember(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ name: m.name, email: m.email, role: m.role, class: m.class }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.email || !form.role) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    if (editMember) {
      setMemberList(prev => prev.map(m => m.id === editMember.id ? { ...m, ...form } : m));
      toast({ title: 'Member Updated', description: form.name });
    } else {
      const newMember = { id: String(Date.now()), ...form, status: 'Active', joinDate: new Date().toISOString().split('T')[0] };
      setMemberList(prev => [...prev, newMember]);
      toast({ title: 'Member Added', description: form.name });
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (m) => {
    setMemberList(prev => prev.filter(x => x.id !== m.id));
    toast({ title: 'Member Deleted', description: m.name, variant: 'destructive' });
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader title="Member Management" description="Manage all society members" actionLabel="Add Member" onAction={openAdd} />

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th className={styles.hideSmall}>Email</th>
              <th>Status</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className={styles.nameCell}>{m.name}</td>
                <td><Badge variant="secondary">{m.role}</Badge></td>
                <td className={`${styles.hideSmall} ${styles.mutedCell}`}>{m.email}</td>
                <td>
                  <Badge variant={m.status === 'Active' ? 'default' : m.status === 'Pending' ? 'outline' : 'secondary'}>
                    {m.status}
                  </Badge>
                </td>
                <td className={styles.actionsCell}>
                  <Button variant="ghost" size="icon" onClick={() => setViewMember(m)}><Eye size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m)}><Trash2 size={16} color="var(--destructive)" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title={editMember ? 'Edit Member' : 'Add New Member'}
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editMember ? 'Update' : 'Add Member'}</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Name *</label><Input placeholder="Full name" value={form.name} onChange={e => setField('name', e.target.value)} /></div>
          <div className={styles.field}><label>Email *</label><Input type="email" placeholder="email@edu" value={form.email} onChange={e => setField('email', e.target.value)} /></div>
          <div className={styles.field}><label>Class</label><Input placeholder="e.g. BSCS-6A" value={form.class} onChange={e => setField('class', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Role *</label>
            <Select value={form.role} onChange={e => setField('role', e.target.value)}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
          </div>
        </div>
      </Modal>

      {/* View Profile Modal */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Member Profile"
        footer={<Button variant="outline" onClick={() => setViewMember(null)}>Close</Button>}>
        {viewMember && (
          <div className={styles.formFields}>
            <div className={styles.field}><label>Name</label><p>{viewMember.name}</p></div>
            <div className={styles.field}><label>Email</label><p>{viewMember.email}</p></div>
            <div className={styles.field}><label>Role</label><Badge variant="secondary">{viewMember.role}</Badge></div>
            <div className={styles.field}><label>Class</label><p>{viewMember.class}</p></div>
            <div className={styles.field}><label>Status</label><Badge variant={viewMember.status === 'Active' ? 'default' : 'secondary'}>{viewMember.status}</Badge></div>
            <div className={styles.field}><label>Join Date</label><p>{viewMember.joinDate}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Members;
