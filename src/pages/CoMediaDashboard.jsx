import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Bell, LogOut, Image, Camera, Eye, Plus, Send, Upload } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; // 🔴 LIVE USER
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx'; // 🔴 ROLE WIDGET
import styles from './CoMediaDashboard.module.css';

const CoMediaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(true);

  // 🔴 LIVE DATABASE STATES
  const [gallery, setGallery] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifs, setNotifs] = useState([]);

  const [previewImg, setPreviewImg] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });

  // 🔴 FETCH LIVE DATA
  useEffect(() => {
    const fetchCoMediaData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [galRes, evRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/gallery', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/events', { headers }),
          fetch('http://localhost:5000/api/notifications/all', { headers })
        ]);

        if (galRes.ok) setGallery(await galRes.json());
        if (evRes.ok) setEvents(await evRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }
      } catch (error) {
        toast({ title: 'Failed to sync data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchCoMediaData();
  }, [currentUser, toast]);

  // 🔴 IMAGE CONVERTER HELPER
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.caption || !uploadForm.file) { toast({ title: 'Caption and Image required', variant: 'destructive' }); return; }
    try {
      const base64Image = await convertToBase64(uploadForm.file);
      const payload = { caption: uploadForm.caption, event: uploadForm.event || 'General', imageBase64: base64Image, uploadedBy: currentUser?.fullName };
      
      const res = await fetch('http://localhost:5000/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newImg = await res.json();
        setGallery(prev => [newImg, ...prev]);
        toast({ title: 'Content uploaded successfully' });
        setUploadDialog(false);
        setUploadForm({ caption: '', event: '', file: null });
      } else throw new Error();
    } catch (err) { toast({ title: 'Upload failed', variant: 'destructive' }); }
  };

  const tabs = [
    { key: 'upload', label: 'Upload Content', icon: Upload },
    { key: 'assist', label: 'Assist Media Manager', icon: Image },
  ];

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Syncing Co-Media Workspace...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <div className={styles.headerTitle}>Co-Media Manager</div>
              <div className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Co-Media'} — Assist Media Manager</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">Co-Media</Badge>
            <TransferRoleWidget />
            <Button size="sm" variant="outline" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={16} /> 
              {notifs.filter(n => !n.read).length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{notifs.filter(n => !n.read).length}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { logout(); navigate('/login'); }}><LogOut size={16} /></Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'upload' && (
            <>
              <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={styles.sectionTitle}>Upload Content</h2>
                <Button size="sm" onClick={() => setUploadDialog(true)}><Plus size={14} style={{ marginRight: '6px' }}/> Upload</Button>
              </div>
              <p className={styles.roleDesc}>Upload photos and media content to assist the Media Manager. Content will appear in the main gallery.</p>
              <div className={styles.galleryGrid}>
                {gallery.slice(0, 12).map(img => (
                  <div key={img._id || img.id} className={styles.galleryItem} onClick={() => setPreviewImg(img)}>
                    <img src={img.url || img.imageBase64} alt={img.caption} className={styles.galleryImg} />
                    <div className={styles.galleryOverlay}>
                      <div className={styles.galleryCaption}>{img.caption}</div>
                      <div className={styles.galleryEvent}>{img.event}</div>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className={styles.muted}>No recent uploads.</p>}
              </div>
            </>
          )}

          {activeTab === 'assist' && (
            <>
              <h2 className={styles.sectionTitle}>Assist Media Manager</h2>
              <p className={styles.roleDesc}>View the full gallery and event coverage. Help the Media Manager with content tasks.</p>

              <h3 className={styles.subTitle}>Full Gallery ({gallery.length} photos)</h3>
              <div className={styles.galleryGrid}>
                {gallery.map(img => (
                  <div key={img._id || img.id} className={styles.galleryItem} onClick={() => setPreviewImg(img)}>
                    <img src={img.url || img.imageBase64} alt={img.caption} className={styles.galleryImg} />
                    <div className={styles.galleryOverlay}>
                      <div className={styles.galleryCaption}>{img.caption}</div>
                      <div className={styles.galleryEvent}>{img.event}</div>
                    </div>
                  </div>
                ))}
                {gallery.length === 0 && <p className={styles.muted}>No images in gallery.</p>}
              </div>

              <h3 className={styles.subTitle} style={{ marginTop: 24 }}>Events to Cover</h3>
              <div className={styles.cardGrid}>
                {events.map(e => (
                  <div key={e._id || e.id} className={styles.eventCard}>
                    <div className={styles.eventTop}>
                      <span className={styles.bold}>{e.title}</span>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                    </div>
                    <div className={styles.eventDesc}>{e.description}</div>
                    <div className={styles.eventMeta}>
                      <Camera size={12} /> {e.date ? new Date(e.date).toLocaleDateString() : 'TBD'} · {gallery.filter(g => g.event === e.title).length} photos
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className={styles.muted}>No events scheduled.</p>}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={uploadDialog} onClose={() => setUploadDialog(false)} title="Upload Content"
        footer={<><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button><Button onClick={handleUpload}><Send size={14} style={{ marginRight: '6px' }} /> Upload</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption *</label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Describe the content" /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" /></div>
          <div className={styles.field}><label>Image File *</label><input type="file" accept="image/*" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} /></div>
        </div>
      </Modal>

      {previewImg && (
        <div className={styles.previewOverlay} onClick={() => setPreviewImg(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <img src={previewImg.url || previewImg.imageBase64} alt={previewImg.caption} className={styles.previewImage} style={{ maxHeight: '70vh', objectFit: 'contain' }} />
            <div className={styles.previewInfo}>
              <div className={styles.bold}>{previewImg.caption}</div>
              <div className={styles.muted}>{previewImg.event}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPreviewImg(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoMediaDashboard;