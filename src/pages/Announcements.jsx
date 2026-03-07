import { useState } from 'react';
import { Edit, Trash2, CalendarDays, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { announcements as initialAnnouncements } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Announcements.module.css';

const emptyForm = { title: '', description: '' };

const Announcements = () => {
  const [announcementList, setAnnouncementList] = useState(initialAnnouncements);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditAnn(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a) => { setEditAnn(a); setForm({ title: a.title, description: a.description }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.title || !form.description) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    if (editAnn) {
      setAnnouncementList(prev => prev.map(a => a.id === editAnn.id ? { ...a, title: form.title, description: form.description } : a));
      toast({ title: 'Announcement Updated' });
    } else {
      const newAnn = { id: String(Date.now()), title: form.title, description: form.description, postedDate: new Date().toISOString().split('T')[0], postedBy: 'Admin' };
      setAnnouncementList(prev => [newAnn, ...prev]);
      toast({ title: 'Announcement Created' });
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (a) => {
    setAnnouncementList(prev => prev.filter(x => x.id !== a.id));
    toast({ title: 'Announcement Deleted', description: a.title, variant: 'destructive' });
  };

  return (
    <div>
      <PageHeader title="Announcements" description="Society announcements and updates" actionLabel="Create Announcement" onAction={openAdd} />

      <div className={styles.grid}>
        {announcementList.map(a => (
          <div key={a.id} className={styles.card}>
            <div className={styles.cardTop}>
              <h3 className={styles.cardTitle}>{a.title}</h3>
              <div className={styles.cardBtns}>
                <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(a)}><Trash2 size={16} color="var(--destructive)" /></Button>
              </div>
            </div>
            <p className={styles.cardDesc}>{a.description}</p>
            <div className={styles.cardFooter}>
              <span><User size={12} /> {a.postedBy}</span>
              <span><CalendarDays size={12} /> {a.postedDate}</span>
            </div>
          </div>
        ))}
        {announcementList.length === 0 && (
          <p style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>No announcements yet.</p>
        )}
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title={editAnn ? 'Edit Announcement' : 'Create Announcement'}
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editAnn ? 'Update' : 'Post'}</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input placeholder="Announcement title" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div className={styles.field}><label>Description *</label><Textarea placeholder="Write your announcement..." rows={4} value={form.description} onChange={e => setField('description', e.target.value)} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Announcements;
