import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, ShieldCheck, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './Members.module.css';

const emptyForm = { name: '', email: '', password: '', roles: ['Class Representative'], department: '', semester: '', batch: '', shift: '' };

const rolesList = [
  'President',
  'General Secretary',
  'Finance Head',
  'Assistant Finance Head',
  'Joint General Secretary',
  'Media Manager',
  'Co-Media Manager',
  'Class Representative'
];

const departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Mathematics', 'Business Administration'];
const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const shifts = ['Morning', 'Evening'];
const batches = ['2021', '2022', '2023', '2024', '2025', '2026', '2027'];

const Members = () => {
  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { user, logout } = useAuth();

  // 🔴 STRICT CHECK: Guarantee current user roles is an array
  const currentUserRoles = Array.isArray(user?.role) ? user.role : [user?.role || 'Class Representative'];
  const isCurrentUserPresident = currentUserRoles.includes('President');

  // --- 1. FETCH MEMBERS ---
  const fetchMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/members', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      const data = await response.json();

      if (response.ok) {
        const formattedMembers = data.map(u => ({
          id: u._id,
          name: u.fullName,
          email: u.email,
          roles: Array.isArray(u.role) ? u.role : [u.role || 'Class Representative'],
          department: u.department || '',
          semester: u.semester || '',
          batch: u.batch || '',
          shift: u.shift || '',
          status: 'Active',
          joinDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '—'
        }));
        setMemberList(formattedMembers);
      }
    } catch (error) {
      toast({ title: 'Error fetching members', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // --- 2. SAVE (ADD OR UPDATE) MEMBER ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || form.roles.length === 0) {
      toast({ title: 'Please fill required fields and select at least one role', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const isUpdating = !!editMember;
      const url = isUpdating
        ? `http://localhost:5000/api/admin/users/${editMember.id}`
        : 'http://localhost:5000/api/admin/users';
      const method = isUpdating ? 'PUT' : 'POST';

      const payload = {
        fullName: form.name,
        email: form.email,
        role: form.roles, // Backend array
        department: form.department,
        semester: form.semester,
        batch: form.batch,
        shift: form.shift
      };

      if (!isUpdating && form.password) payload.password = form.password;
      if (isUpdating && form.password) payload.password = form.password;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: `Member ${isUpdating ? 'Updated' : 'Added'} Successfully!` });
        fetchMembers();
        setDialogOpen(false);
      } else {
        const errorData = await res.json();
        toast({ title: 'Action Failed', description: errorData.message || 'Error saving member', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // --- 3. DELETE MEMBER ---
  const handleDelete = async (m) => {
    if (m.email === user.email) {
      toast({ title: "Action Denied", description: "You cannot delete your own account.", variant: 'destructive' });
      return;
    }

    if (!window.confirm(`Are you sure you want to completely remove ${m.name} from the system?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${m.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });

      if (res.ok) {
        setMemberList(prev => prev.filter(x => x.id !== m.id));
        toast({ title: 'Member Deleted', description: `${m.name} removed.` });
      } else {
        toast({ title: 'Delete Failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  // --- 4. HANDOVER PRESIDENCY ---
  const handleTransferPresidency = async (newPresident) => {
    const confirmTransfer = window.confirm(
      `CRITICAL WARNING: Are you sure you want to transfer Presidency to ${newPresident.name}? \n\nYou will lose President access instantly.`
    );

    if (confirmTransfer) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${newPresident.id}/transfer`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`
          },
          body: JSON.stringify({ currentAdminId: user.id })
        });

        if (response.ok) {
          toast({ title: 'Presidency Transferred', description: 'Logging out...' });
          setTimeout(() => logout(), 2000);
        } else {
          toast({ title: 'Transfer Failed', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Server Error', variant: 'destructive' });
      }
    }
  };

  // --- UI HELPERS ---
  const filtered = memberList.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.roles.includes(filterRole);
    return matchSearch && matchRole;
  });

  const openAdd = () => { setEditMember(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (m) => {
    setEditMember(m);
    setForm({
      name: m.name,
      email: m.email,
      roles: m.roles,
      department: m.department || '',
      semester: m.semester || '',
      batch: m.batch || '',
      shift: m.shift || '',
      password: ''
    });
    setDialogOpen(true);
  };

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <PageHeader title="Member Management" description="Manage all society members, assign roles, and control access" actionLabel="Add Member" onAction={openAdd} />

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <Input placeholder="Search members by name or email..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Roles</option>
          {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roles</th>
              <th className={styles.hideSmall}>Department/Sem</th>
              <th className={styles.hideSmall}>Email</th>
              <th className={styles.actionsHead} style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Loading members...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No members found.</td></tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id}>
                  <td className={styles.nameCell}>
                    <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined: {m.joinDate}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {m.roles.map((r, idx) => (
                        <Badge key={idx} variant={r === 'President' ? 'default' : 'secondary'}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className={`${styles.hideSmall} ${styles.mutedCell}`}>
                    {m.department ? `${m.department} ${m.semester ? `(${m.semester})` : ''}` : '—'}
                  </td>
                  <td className={`${styles.hideSmall} ${styles.mutedCell}`}>{m.email}</td>

                  <td className={styles.actionsCell} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>

                      {isCurrentUserPresident && !m.roles.includes('President') && (
                        <Button variant="outline" size="sm" onClick={() => handleTransferPresidency(m)} title="Transfer Presidency" style={{ padding: '4px 8px', color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                          <ShieldCheck size={14} />
                        </Button>
                      )}

                      <Button variant="outline" size="sm" onClick={() => setViewMember(m)} style={{ padding: '4px 8px' }}><Eye size={14} /></Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)} style={{ padding: '4px 8px' }}><Edit size={14} /></Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(m)}
                        disabled={m.email === user?.email}
                        style={{ padding: '4px 8px', color: m.email === user?.email ? '#ccc' : '#ef4444', borderColor: m.email === user?.email ? '#e2e8f0' : '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title={editMember ? "Edit Member Role & Details" : "Add New Member"}
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Member'}</Button>
        </>}>
        <form onSubmit={handleSave} className={styles.formFields}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className={styles.field}>
              <label>Full Name *</label>
              <Input value={form.name} onChange={e => setField('name', e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Email Address *</label>
              <Input type="email" value={form.email} onChange={e => setField('email', e.target.value)} required />
            </div>
          </div>

          <div className={styles.field} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Assign Roles (Select multiple) *</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: '#f8fafc'
            }}>
              {rolesList.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={form.roles.includes(r)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setField('roles', [...form.roles, r]);
                      } else {
                        setField('roles', form.roles.filter(role => role !== r));
                      }
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field} style={{ marginBottom: '16px' }}>
            <label>{editMember ? "Change Password (Optional)" : "Password *"}</label>
            <Input
              type="password"
              placeholder={editMember ? "Leave blank to keep current" : "Create password"}
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              required={!editMember}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className={styles.field}>
              <label>Department</label>
              <Select value={form.department} onChange={e => setField('department', e.target.value)}>
                <option value="">Select Dept</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className={styles.field}>
              <label>Semester</label>
              <Select value={form.semester} onChange={e => setField('semester', e.target.value)}>
                <option value="">Select Sem</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.field}>
              <label>Shift</label>
              <Select value={form.shift} onChange={e => setField('shift', e.target.value)}>
                <option value="">Select Shift</option>
                {shifts.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className={styles.field}>
              <label>Batch</label>
              <Select value={form.batch} onChange={e => setField('batch', e.target.value)}>
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </div>
          </div>

        </form>
      </Modal>

      {/* --- VIEW MEMBER MODAL --- */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Member Profile" footer={<Button onClick={() => setViewMember(null)}>Close</Button>}>
        {viewMember && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {viewMember.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '6px' }}>{viewMember.name}</h3>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {viewMember.roles.map((r, idx) => (
                    <Badge key={idx} variant={r === 'President' ? 'default' : 'secondary'}>
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email Address</span>
                <div style={{ fontWeight: 500 }}>{viewMember.email}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date Joined</span>
                <div style={{ fontWeight: 500 }}>{viewMember.joinDate}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Department</span>
                <div style={{ fontWeight: 500 }}>{viewMember.department || 'Not Provided'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester & Shift</span>
                <div style={{ fontWeight: 500 }}>
                  {viewMember.semester ? `${viewMember.semester} Sem` : '—'} {viewMember.shift ? `(${viewMember.shift})` : ''}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch</span>
                <div style={{ fontWeight: 500 }}>{viewMember.batch || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account Status</span>
                <div><Badge variant="outline" style={{ borderColor: 'green', color: 'green' }}>Active</Badge></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Members;