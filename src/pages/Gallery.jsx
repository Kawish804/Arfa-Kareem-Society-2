import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Select from '@/components/ui/Select.jsx';
import Input from '@/components/ui/Input.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { galleryImages as initialImages } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Gallery.module.css';

const Gallery = () => {
  const [images, setImages] = useState(initialImages);
  const [filter, setFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState({ caption: '', event: '' });
  const { toast } = useToast();

  const eventNames = [...new Set(initialImages.map(i => i.event))];
  const filtered = filter === 'all' ? images : images.filter(i => i.event === filter);

  const handleDelete = (img) => {
    setImages(prev => prev.filter(i => i.id !== img.id));
    toast({ title: 'Photo Deleted', variant: 'destructive' });
  };

  const handleUpload = () => {
    if (!form.caption) {
      toast({ title: 'Please enter a caption', variant: 'destructive' }); return;
    }
    const newImg = {
      id: String(Date.now()),
      url: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop`,
      caption: form.caption,
      event: form.event || 'General',
    };
    setImages(prev => [newImg, ...prev]);
    toast({ title: 'Photo Uploaded' });
    setUploadOpen(false);
    setForm({ caption: '', event: '' });
  };

  return (
    <div>
      <PageHeader title="Gallery" description="Event photos and memories" actionLabel="Upload Photo" onAction={() => { setForm({ caption: '', event: '' }); setUploadOpen(true); }} />

      <div className={styles.filterWrap}>
        <Select value={filter} onChange={e => setFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Events</option>
          {eventNames.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>

      <div className={styles.grid}>
        {filtered.map(img => (
          <div key={img.id} className={styles.imageCard}>
            <img src={img.url} alt={img.caption} className={styles.image} loading="lazy" />
            <div className={styles.overlay}>
              <div className={styles.overlayText}>
                <p className={styles.caption}>{img.caption}</p>
                <p className={styles.eventName}>{img.event}</p>
              </div>
              <Button variant="ghost" size="icon" className={styles.deleteBtn} onClick={() => handleDelete(img)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center', gridColumn: '1 / -1' }}>No photos found.</p>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Photo"
        footer={<>
          <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button onClick={handleUpload}>Upload</Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Photo File</label>
            <Input type="file" accept="image/*" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Caption *</label>
            <Input placeholder="Photo caption" value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Event</label>
            <Select value={form.event} onChange={e => setForm(p => ({ ...p, event: e.target.value }))}>
              <option value="">Select event</option>
              {eventNames.map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Gallery;
