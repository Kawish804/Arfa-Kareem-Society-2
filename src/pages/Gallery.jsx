import { useState, useEffect } from 'react';
import { Trash2, X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Select from '@/components/ui/Select.jsx';
import Input from '@/components/ui/Input.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Gallery.module.css';

// UPDATED: filesData is now an array to hold multiple images!
const emptyForm = { caption: '', eventId: '', eventTitle: 'General', filesData: [] };

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/gallery/all'),
      fetch('http://localhost:5000/api/events/records')
    ])
    .then(async ([galRes, evRes]) => {
      const galData = await galRes.json();
      const evData = await evRes.json();
      setImages(Array.isArray(galData) ? galData : []);
      setEventsList(Array.isArray(evData) ? evData : []);
    })
    .catch(err => console.error("Error fetching data:", err));
  }, []);

  const eventNames = [...new Set(images.map(i => i.eventTitle))];
  const filtered = filter === 'all' ? images : images.filter(i => i.eventTitle === filter);

  // MULTIPLE FILE HANDLER
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Convert all selected files to Base64 strings
    Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    })).then(base64Array => {
      // Add the new images to the existing ones in the preview
      setForm(p => ({ ...p, filesData: [...p.filesData, ...base64Array] }));
    });
    
    // Reset the input so you can select the same files again if needed
    e.target.value = ''; 
  };

  const removePreviewImage = (indexToRemove) => {
    setForm(p => ({
      ...p,
      filesData: p.filesData.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleEventSelect = (e) => {
    const selectedId = e.target.value;
    const selectedEvent = eventsList.find(ev => ev._id === selectedId);
    setForm(p => ({ 
      ...p, 
      eventId: selectedId, 
      eventTitle: selectedEvent ? selectedEvent.title : 'General' 
    }));
  };

  // BATCH UPLOAD HANDLER
  const handleUpload = async () => {
    if (form.filesData.length === 0) {
      toast({ title: 'Please select at least one photo', variant: 'destructive' }); return;
    }
    if (!form.caption) {
      toast({ title: 'Please provide a shared caption', variant: 'destructive' }); return;
    }
    
    setIsUploading(true);

    try {
      // Send all images to the backend simultaneously
      const uploadPromises = form.filesData.map(base64Str => 
        fetch('http://localhost:5000/api/gallery/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: base64Str,
            caption: form.caption, // Using the same caption for the batch
            eventId: form.eventId,
            eventTitle: form.eventTitle
          })
        }).then(res => res.json())
      );

      const uploadedImages = await Promise.all(uploadPromises);

      // Add all newly uploaded images to the top of our gallery grid
      setImages(prev => [...uploadedImages, ...prev]);
      toast({ title: `${uploadedImages.length} Photos Uploaded Successfully!` });
      
      setUploadOpen(false);
      setForm(emptyForm);
    } catch (error) {
      toast({ title: 'Upload Failed', description: 'Some photos may not have saved.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (img) => {
    if (!window.confirm("Delete this photo permanently?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/gallery/${img._id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(prev => prev.filter(i => i._id !== img._id));
        toast({ title: 'Photo Deleted' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader 
        title="Gallery" 
        description="Event photos and memories" 
        actionLabel="Upload Photos" 
        onAction={() => { setForm(emptyForm); setUploadOpen(true); }} 
      />

      <div className={styles.filterWrap}>
        <Select value={filter} onChange={e => setFilter(e.target.value)} className={styles.filterSelect}>
          <option value="all">All Events</option>
          {eventNames.map(e => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>

      <div className={styles.grid}>
        {filtered.map(img => (
          <div key={img._id} className={styles.imageCard}>
            <img src={img.url} alt={img.caption} className={styles.image} loading="lazy" />
            <div className={styles.overlay}>
              <div className={styles.overlayText}>
                <p className={styles.caption}>{img.caption}</p>
                <p className={styles.eventName}>{img.eventTitle}</p>
              </div>
              <Button variant="ghost" size="icon" className={styles.deleteBtn} onClick={() => handleDelete(img)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
             <ImageIcon size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
             <p>No photos found. Click "Upload Photos" to add some memories!</p>
          </div>
        )}
      </div>

      <Modal open={uploadOpen} onClose={() => !isUploading && setUploadOpen(false)} title="Upload Multiple Photos"
        footer={<>
          <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : `Upload ${form.filesData.length} Photo(s)`}
          </Button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Select Event</label>
            <Select value={form.eventId} onChange={handleEventSelect} disabled={isUploading}>
              <option value="">General / No Specific Event</option>
              {eventsList.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </Select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Shared Caption *</label>
            <Input 
              placeholder="e.g. Prize Distribution Ceremony" 
              value={form.caption} 
              onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} 
              disabled={isUploading}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>This caption will be applied to all selected photos in this batch.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Photos *</label>
            
            {/* Custom Multi-File Input Styling */}
            <div style={{ position: 'relative', border: '2px dashed var(--border)', borderRadius: '8px', padding: '24px', textAlign: 'center', background: 'var(--bg-card)', transition: '0.2s', cursor: 'pointer' }}>
               <input 
                 type="file" 
                 accept="image/*" 
                 multiple 
                 onChange={handleFileChange} 
                 disabled={isUploading}
                 style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
               />
               <UploadCloud size={24} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
               <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-main)' }}>Click or drag files to upload</p>
               <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>You can select multiple images at once</p>
            </div>

            {/* Image Preview Grid */}
            {form.filesData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {form.filesData.map((src, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '1/1' }}>
                    <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={() => removePreviewImage(idx)} 
                      disabled={isUploading}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default Gallery;