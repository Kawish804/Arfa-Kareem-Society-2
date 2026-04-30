import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Bell, LogOut, Image, Camera, Eye, Plus, Send, Upload, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx';
import styles from './CoMediaDashboard.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CoMediaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(true);

  const [gallery, setGallery] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [previewImg, setPreviewImg] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });

  useEffect(() => {
    const fetchCoMediaData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [galRes, evRes, notifRes] = await Promise.all([
          fetch(`${API_URL}/gallery`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/events`, { headers }),
          fetch(`${API_URL}/notifications/all`, { headers })
        ]);

        if (galRes.ok) setGallery(await galRes.json());
        if (evRes.ok) setEvents(await evRes.json());
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          const validNotifs = allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName);
          setNotifs(validNotifs);
          setUnreadCount(validNotifs.filter(n => !n.read).length);
        }
      } catch (error) {
        toast({ title: 'Failed to sync data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchCoMediaData();
  }, [currentUser, toast]);

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

      const res = await fetch(`${API_URL}/gallery`, {
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
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>Co-Media Manager</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>Co-Media Access</Badge>
            <TransferRoleWidget />

            {/* ENTERPRISE FIX: Chat Icon */}
            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
            </button>

            {/* ENTERPRISE FIX: Notification Icon */}
            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && <span className={styles.notifBadge}>{unreadCount}</span>}
            </button>

            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.hideMobile} style={{ marginLeft: '6px' }}>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} style={{ marginRight: '6px' }} /> <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'upload' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Upload Content</h2>
                  <p className={styles.roleDesc}>Upload photos and media content to assist the Media Manager.</p>
                </div>
                <Button onClick={() => setUploadDialog(true)} className={styles.actionBtn}><Plus size={16} style={{ marginRight: '6px' }} /> Upload</Button>
              </div>

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
            </div>
          )}

          {activeTab === 'assist' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Assist Media Manager</h2>
              <p className={styles.roleDesc}>View the full gallery and event coverage details.</p>

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

              <h3 className={styles.subTitle} style={{ marginTop: 40 }}>Events to Cover</h3>
              <div className={styles.cardGrid}>
                {events.map(e => (
                  <div key={e._id || e.id} className={styles.eventCard}>
                    <div className={styles.eventTop}>
                      <span className={styles.bold}>{e.title}</span>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                    </div>
                    <div className={styles.eventDesc}>{e.description}</div>
                    <div className={styles.eventMeta}>
                      <Camera size={14} /> {e.date ? new Date(e.date).toLocaleDateString() : 'TBD'} • {gallery.filter(g => g.event === e.title).length} photos
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p className={styles.muted}>No events scheduled.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={uploadDialog} onClose={() => setUploadDialog(false)} title="Upload Content"
        footer={<><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button><Button onClick={handleUpload} style={{ backgroundColor: '#52a447' }}><Send size={14} style={{ marginRight: '6px' }} /> Upload</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption *</label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Describe the content" /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" /></div>
          <div className={styles.field}>
            <label>Image File *</label>
            <div className={styles.uploadWrap}>
              <input type="file" accept="image/*" id="coMediaUpload" className={styles.fileInput} onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} />
              <label htmlFor="coMediaUpload" className={styles.uploadBtn}>
                {uploadForm.file ? uploadForm.file.name : 'Choose an image file...'}
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {previewImg && (
        <div className={styles.previewOverlay} onClick={() => setPreviewImg(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <img src={previewImg.url || previewImg.imageBase64} alt={previewImg.caption} className={styles.previewImage} style={{ maxHeight: '70vh', objectFit: 'contain' }} />
            <div className={styles.previewInfo}>
              <div className={styles.previewCaption}>{previewImg.caption}</div>
              <div className={styles.muted}>{previewImg.event}</div>
            </div>
            <div style={{ padding: '0 20px 20px' }}><Button size="sm" variant="outline" onClick={() => setPreviewImg(null)}>Close</Button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoMediaDashboard;