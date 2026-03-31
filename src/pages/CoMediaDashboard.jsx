import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Bell, LogOut, Image, Camera, Eye, Plus, Send, Upload
} from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { galleryImages, events, notifications } from '@/data/mockData.js';
import styles from './CoMediaDashboard.module.css';

const CoMediaDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [gallery, setGallery] = useState(galleryImages);
  const [notifs] = useState(notifications);
  const [previewImg, setPreviewImg] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });
  const navigate = useNavigate();
  const { toast } = useToast();

  const unreadNotifs = notifs.filter(n => !n.read).length;

  const handleUpload = () => {
    if (!uploadForm.caption) { toast({ title: 'Caption required', variant: 'destructive' }); return; }
    setGallery(prev => [...prev, { id: String(Date.now()), url: uploadForm.file ? URL.createObjectURL(uploadForm.file) : '/placeholder.svg', event: uploadForm.event || 'General', caption: uploadForm.caption }]);
    toast({ title: 'Content uploaded' });
    setUploadDialog(false);
    setUploadForm({ caption: '', event: '', file: null });
  };

  const tabs = [
    { key: 'upload', label: 'Upload Content', icon: Upload },
    { key: 'assist', label: 'Assist Media Manager', icon: Image },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><GraduationCap size={22} /></div>
            <div>
              <div className={styles.headerTitle}>Co-Media Manager</div>
              <div className={styles.headerSub}>Upload content & assist Media Manager</div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="secondary">Co-Media</Badge>
            <Button size="sm" variant="outline" onClick={() => navigate('/notifications')}>
              <Bell size={16} /> {unreadNotifs > 0 && <span className={styles.badge}>{unreadNotifs}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/login')}><LogOut size={16} /></Button>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}>
              <t.icon size={16} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'upload' && (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Upload Content</h2>
                <Button size="sm" onClick={() => setUploadDialog(true)}><Plus size={14} /> Upload</Button>
              </div>
              <p className={styles.roleDesc}>Upload photos and media content to assist the Media Manager. Content will appear in the gallery.</p>
              <div className={styles.galleryGrid}>
                {gallery.slice(-8).reverse().map(img => (
                  <div key={img.id} className={styles.galleryItem} onClick={() => setPreviewImg(img)}>
                    <img src={img.url} alt={img.caption} className={styles.galleryImg} />
                    <div className={styles.galleryOverlay}>
                      <div className={styles.galleryCaption}>{img.caption}</div>
                      <div className={styles.galleryEvent}>{img.event}</div>
                    </div>
                  </div>
                ))}
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
                  <div key={img.id} className={styles.galleryItem} onClick={() => setPreviewImg(img)}>
                    <img src={img.url} alt={img.caption} className={styles.galleryImg} />
                    <div className={styles.galleryOverlay}>
                      <div className={styles.galleryCaption}>{img.caption}</div>
                      <div className={styles.galleryEvent}>{img.event}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className={styles.subTitle} style={{ marginTop: 24 }}>Events to Cover</h3>
              <div className={styles.cardGrid}>
                {events.map(e => (
                  <div key={e.id} className={styles.eventCard}>
                    <div className={styles.eventTop}>
                      <span className={styles.bold}>{e.title}</span>
                      <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                    </div>
                    <div className={styles.eventDesc}>{e.description}</div>
                    <div className={styles.eventMeta}><Camera size={12} /> {e.date} · {gallery.filter(g => g.event === e.title).length} photos</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadDialog} onClose={() => setUploadDialog(false)} title="Upload Content"
        footer={<><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button><Button onClick={handleUpload}><Send size={14} /> Upload</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption *</label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Describe the content" /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" /></div>
          <div className={styles.field}><label>File</label><input type="file" accept="image/*,video/*" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} /></div>
        </div>
      </Modal>

      {/* Preview */}
      {previewImg && (
        <div className={styles.previewOverlay} onClick={() => setPreviewImg(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <img src={previewImg.url} alt={previewImg.caption} className={styles.previewImage} />
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
