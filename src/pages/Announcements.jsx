import { useState, useEffect } from 'react';
import { Edit, Trash2, CalendarDays, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Announcements.module.css';

const emptyForm = { title: '', description: '' };

const Announcements = () => {
  const [announcementList, setAnnouncementList] = useState([]); // Dynamic state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  // FETCH ANNOUNCEMENTS FROM DATABASE
  useEffect(() => {
    fetch('http://localhost:5000/api/announcements/all')
      .then(res => res.json())
      .then(data => setAnnouncementList(data))
      .catch(err => console.error("Error fetching announcements:", err));
  }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditAnn(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a) => { setEditAnn(a); setForm({ title: a.title, description: a.description }); setDialogOpen(true); };

  // CREATE OR UPDATE ANNOUNCEMENT
  const handleSave = async () => {
    if (!form.title || !form.description) {
      toast({ title: 'Please fill all fields', variant: 'destructive' }); return;
    }
    
    try {
      const url = editAnn 
        ? `http://localhost:5000/api/announcements/${editAnn._id}` 
        : 'http://localhost:5000/api/announcements/create';
      const method = editAnn ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description })
      });

      if (res.ok) {
        const savedData = await res.json();
        
        if (editAnn) {
          setAnnouncementList(prev => prev.map(a => a._id === editAnn._id ? savedData : a));
          toast({ title: 'Announcement Updated' });
        } else {
          setAnnouncementList(prev => [savedData, ...prev]);
          toast({ title: 'Announcement Created' });
        }
        setDialogOpen(false);
        setForm(emptyForm);
      }
    } catch (error) {
      toast({ title: 'Server error', variant: 'destructive' });
    }
  };

  // DELETE ANNOUNCEMENT
  const handleDelete = async (a) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/announcements/${a._id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncementList(prev => prev.filter(x => x._id !== a._id));
        toast({ title: 'Announcement Deleted', description: a.title, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Announcements" description="Society announcements and updates" actionLabel="Create Announcement" onAction={openAdd} />

      <div className={styles.grid}>
        {announcementList.map(a => (
          <div key={a._id} className={styles.card}>
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
          <p style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center', gridColumn: '1 / -1' }}>No announcements yet.</p>
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