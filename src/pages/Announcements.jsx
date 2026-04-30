import { useState, useEffect } from 'react';
import { Edit, Trash2, CalendarDays, User, Megaphone, Loader2, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Announcements.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const emptyForm = { title: '', description: '' };

const Announcements = () => {
  const [announcementList, setAnnouncementList] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/announcements/all`);
        if (res.ok) {
          const data = await res.json();
          // Ensure newest are first
          setAnnouncementList(data.sort((a, b) => new Date(b.createdAt || b.postedDate) - new Date(a.createdAt || a.postedDate)));
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (err) {
        toast({ title: 'Error fetching announcements', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [toast]);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { 
    setEditAnn(null); 
    setForm(emptyForm); 
    setDialogOpen(true); 
  };
  
  const openEdit = (a) => { 
    setEditAnn(a); 
    setForm({ title: a.title, description: a.description }); 
    setDialogOpen(true); 
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: 'Validation Error', description: 'Please fill out all fields.', variant: 'destructive' }); 
      return;
    }
    
    setIsSubmitting(true);
    try {
      const url = editAnn 
        ? `${API_URL}/announcements/${editAnn._id}` 
        : `${API_URL}/announcements/create`;
      const method = editAnn ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim() })
      });

      if (res.ok) {
        const savedData = await res.json();
        
        if (editAnn) {
          setAnnouncementList(prev => prev.map(a => a._id === editAnn._id ? savedData : a));
          toast({ title: 'Success', description: 'Announcement updated successfully.' });
        } else {
          setAnnouncementList(prev => [savedData, ...prev]);
          toast({ title: 'Success', description: 'New announcement published.' });
        }
        setDialogOpen(false);
        setForm(emptyForm);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ title: 'Server Error', description: 'Could not save the announcement.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (a) => {
    if (!window.confirm(`Are you sure you want to delete "${a.title}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/announcements/${a._id}`, { method: 'DELETE' });
      if (res.ok) {
        setAnnouncementList(prev => prev.filter(x => x._id !== a._id));
        toast({ title: 'Deleted', description: 'Announcement has been removed.' });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete announcement.', variant: 'destructive' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.pageWrap}>
      <PageHeader 
        title="Announcements" 
        description="Broadcast important society updates, news, and notifications." 
        actionLabel={<><Plus size={16} style={{marginRight: '6px'}}/> Create</>} 
        onAction={openAdd} 
      />

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className={styles.spin} size={32} />
          <p>Loading announcements...</p>
        </div>
      ) : announcementList.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={48} className={styles.emptyIcon} />
          <h3>No Announcements Yet</h3>
          <p>Click "Create" to publish the first society announcement.</p>
          <Button onClick={openAdd} style={{marginTop: '12px'}}><Plus size={16} style={{marginRight: '6px'}}/> Create Announcement</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {announcementList.map(a => (
            <div key={a._id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.titleWrap}>
                  <div className={styles.iconBox}><Megaphone size={16} /></div>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                </div>
                <div className={styles.cardBtns}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a)} title="Edit" className={styles.actionBtn}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a)} title="Delete" className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <p className={styles.cardDesc}>{a.description}</p>
              </div>
              
              <div className={styles.cardFooter}>
                <span className={styles.metaBadge}><User size={12} /> {a.postedBy || 'Admin'}</span>
                <span className={styles.metaBadge}><CalendarDays size={12} /> {formatDate(a.postedDate || a.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        open={dialogOpen} 
        onClose={() => !isSubmitting && setDialogOpen(false)} 
        title={editAnn ? 'Edit Announcement' : 'Create Announcement'}
        footer={
          <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%'}}>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{marginRight: '6px'}}/> Saving...</> : editAnn ? 'Update Post' : 'Publish'}
            </Button>
          </div>
        }
      >
        <div className={styles.formFields}>
          <div className={styles.field}>
            <label>Title <span style={{color: 'red'}}>*</span></label>
            <Input placeholder="e.g., General Body Meeting Tomorrow" value={form.title} onChange={e => setField('title', e.target.value)} disabled={isSubmitting} />
          </div>
          <div className={styles.field}>
            <label>Message / Description <span style={{color: 'red'}}>*</span></label>
            <Textarea placeholder="Write the full announcement details here..." rows={5} value={form.description} onChange={e => setField('description', e.target.value)} disabled={isSubmitting} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Announcements;