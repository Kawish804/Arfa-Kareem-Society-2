import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Eye, ShieldCheck } from 'lucide-react'; // Added ShieldCheck
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // Added Auth Context
import styles from './Members.module.css';

const emptyForm = { name: '', email: '', role: '', class: '' };

const Members = () => {
  const [memberList, setMemberList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [form, setForm] = useState(emptyForm);
  
  const { toast } = useToast();
  const { user, logout } = useAuth(); // Get current logged-in user info

  const fetchMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/members');
      const data = await response.json();
      if (response.ok) {
        const formattedMembers = data.map(user => ({
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role || 'Member',
          class: `${user.department} - ${user.semester}`,
          status: 'Active',
          joinDate: new Date(user.createdAt).toISOString().split('T')[0]
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

  // --- HANDOVER LOGIC ---
  const handleTransferPresidency = async (newPresident) => {
    const confirmTransfer = window.confirm(
      `CRITICAL WARNING: Are you sure you want to transfer Presidency to ${newPresident.name}? \n\nYou will be demoted to Member and lose Admin access instantly.`
    );

    if (confirmTransfer) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${newPresident.id}/transfer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentAdminId: user.id })
        });

        if (response.ok) {
          toast({ title: 'Presidency Transferred', description: 'Logging out...' });
          setTimeout(() => logout(), 2000); // Logout old president
        } else {
          toast({ title: 'Transfer Failed', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Server Error', variant: 'destructive' });
      }
    }
  };

  const roles = ['Admin', 'CR', 'Finance Manager', 'Event Coordinator', 'Member', 'Visitor'];

  const filtered = memberList.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleDelete = async (m) => {
    if (m.email === user.email) {
      toast({ title: "Action Denied", description: "You cannot delete your own account.", variant: 'destructive' });
      return;
    }
    // ... your existing delete fetch logic here
    setMemberList(prev => prev.filter(x => x.id !== m.id));
    toast({ title: 'Member Deleted', description: m.name, variant: 'destructive' });
  };

  const openAdd = () => { setEditMember(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m) => { setEditMember(m); setForm({ name: m.name, email: m.email, role: m.role, class: m.class }); setDialogOpen(true); };
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
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>Loading members...</td></tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id}>
                  <td className={styles.nameCell}>{m.name}</td>
                  <td><Badge variant={m.role === 'Admin' ? 'default' : 'secondary'}>{m.role}</Badge></td>
                  <td className={`${styles.hideSmall} ${styles.mutedCell}`}>{m.email}</td>
                  <td><Badge>Active</Badge></td>
                  <td className={styles.actionsCell}>
                    {/* Transfer Button (Only visible to current Admin, for non-admin members) */}
                    {user?.role === 'Admin' && m.role !== 'Admin' && (
                      <Button variant="ghost" size="icon" onClick={() => handleTransferPresidency(m)} title="Transfer Presidency">
                        <ShieldCheck size={16} color="var(--primary)" />
                      </Button>
                    )}
                    
                    <Button variant="ghost" size="icon" onClick={() => setViewMember(m)}><Eye size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Edit size={16} /></Button>
                    
                    {/* Prevent Admin from deleting themselves */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(m)}
                      disabled={m.email === user.email}
                    >
                      <Trash2 size={16} color={m.email === user.email ? "#ccc" : "var(--destructive)"} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals remain mostly the same, ensuring Select roles use the new static array */}
    </div>
  );
};

export default Members;