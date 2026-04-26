import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed unused imports to prevent strict ESLint compilation errors
import { Image, Camera, Bell, LogOut, Plus, Send, Share2, Eye, Trash2, ExternalLink, FileImage } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useAuth } from '@/context/AuthContext.jsx'; 
import TransferRoleWidget from '@/components/TransferRoleWidget.jsx'; 
import styles from './MediaPRDashboard.module.css';

const MediaPRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);

  // 🔴 LIVE DATABASE STATES (Initialized strictly as Arrays)
  const [gallery, setGallery] = useState([]);
  const [posts, setPosts] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifs, setNotifs] = useState([]);

  // Dialogs
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });
  const [postDialog, setPostDialog] = useState(false);
  const [postForm, setPostForm] = useState({ platform: 'Instagram', content: '', status: 'Draft' });
  const [calDialog, setCalDialog] = useState(false);
  const [calForm, setCalForm] = useState({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });
  const [previewImg, setPreviewImg] = useState(null);

  // 🔴 FETCH LIVE DATA WITH BULLETPROOF ERROR HANDLING
  useEffect(() => {
    const fetchMediaData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [galRes, postRes, calRes, evRes, notifRes] = await Promise.all([
          fetch('http://localhost:5000/api/gallery', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/social-posts', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/content-calendar', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/events', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/api/notifications/all', { headers }).catch(() => ({ ok: false }))
        ]);

        // Safety Net: Ensure we only set the state if the response is actually an Array!
        if (galRes.ok) { const data = await galRes.json(); setGallery(Array.isArray(data) ? data : []); }
        if (postRes.ok) { const data = await postRes.json(); setPosts(Array.isArray(data) ? data : []); }
        if (calRes.ok) { const data = await calRes.json(); setCalendar(Array.isArray(data) ? data : []); }
        if (evRes.ok) { const data = await evRes.json(); setEvents(Array.isArray(data) ? data : []); }
        
        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          if (Array.isArray(allNotifs)) {
            setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
          }
        }
      } catch (error) {
        toast({ title: 'Failed to sync data', description: 'Check backend connection', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchMediaData();
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

  // 🔴 API ACTIONS
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
        setGallery(prev => [newImg, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Image uploaded successfully' });
        setUploadDialog(false);
        setUploadForm({ caption: '', event: '', file: null });
      } else throw new Error();
    } catch (err) { toast({ title: 'Upload failed', variant: 'destructive' }); }
  };

  const handleDeleteImage = async (id) => {
    if(!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/gallery/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.ok) {
        setGallery(prev => (Array.isArray(prev) ? prev : []).filter(g => (g._id || g.id) !== id));
        toast({ title: 'Image removed' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const handleAddPost = async () => {
    if (!postForm.content) { toast({ title: 'Content required', variant: 'destructive' }); return; }
    try {
      const payload = { ...postForm, author: currentUser?.fullName };
      const res = await fetch('http://localhost:5000/api/social-posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Post created' });
        setPostDialog(false);
        setPostForm({ platform: 'Instagram', content: '', status: 'Draft' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to create post', variant: 'destructive' }); }
  };

  const publishPost = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/social-posts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Published', date: new Date().toISOString().split('T')[0] })
      });
      if (res.ok) {
        setPosts(prev => (Array.isArray(prev) ? prev : []).map(p => (p._id || p.id) === id ? { ...p, status: 'Published', date: new Date().toISOString().split('T')[0] } : p));
        toast({ title: 'Post published!' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to publish', variant: 'destructive' }); }
  };

  const handleAddCalEntry = async () => {
    if (!calForm.title || !calForm.date) { toast({ title: 'Title and date required', variant: 'destructive' }); return; }
    try {
      const res = await fetch('http://localhost:5000/api/content-calendar', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(calForm)
      });
      if (res.ok) {
        const newEntry = await res.json();
        setCalendar(prev => [newEntry, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Calendar entry added' });
        setCalDialog(false);
        setCalForm({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Failed to add entry', variant: 'destructive' }); }
  };

  const tabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'calendar', label: 'Content Calendar', icon: FileImage },
    { id: 'coverage', label: 'Event Coverage', icon: Camera },
  ];

  const platformColor = (p) => {
    if (p === 'Instagram') return styles.platformInsta || '';
    if (p === 'Facebook') return styles.platformFb || '';
    if (p === 'LinkedIn') return styles.platformLi || '';
    return '';
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>Syncing Media Workspace...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><Camera size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Media & PR</h1>
              <p className={styles.headerSub}>Welcome, {currentUser?.fullName || 'Media Head'}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Media/PR Head</Badge>
            <TransferRoleWidget />
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} style={{ position: 'relative' }}>
              <Bell size={14} />
              {notifs.filter(n => !n.read).length > 0 && <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50px', padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1, fontWeight: 'bold' }}>{notifs.filter(n => !n.read).length}</span>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}><LogOut size={14} /> Logout</Button>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <nav className={styles.tabs}>
          {tabs.map(t => (
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'gallery' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Photo Gallery</h2>
                <Button size="sm" onClick={() => setUploadDialog(true)}><Plus size={14} style={{ marginRight: '6px' }} /> Upload Image</Button>
              </div>
              <div className={styles.galleryGrid}>
                {gallery.map(img => (
                  <div key={img._id || img.id} className={styles.galleryItem}>
                    <img src={img.url || img.imageBase64} alt={img.caption} className={styles.galleryImg} onClick={() => setPreviewImg(img)} />
                    <div className={styles.galleryOverlay}>
                      <span className={styles.galleryCaption}>{img.caption}</span>
                      <div className={styles.galleryActions}>
                        <button className={styles.iconBtn} onClick={() => setPreviewImg(img)}><Eye size={14} /></button>
                        <button className={styles.iconBtn} onClick={() => handleDeleteImage(img._id || img.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Badge variant="secondary" className={styles.galleryBadge}>{img.event}</Badge>
                  </div>
                ))}
                {gallery.length === 0 && <p className={styles.muted}>No images in gallery.</p>}
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Social Media Posts</h2>
                <Button size="sm" onClick={() => setPostDialog(true)}><Plus size={14} style={{ marginRight: '6px' }} /> Create Post</Button>
              </div>
              <div className={styles.postStats}>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Published').length}</span><span className={styles.pStatLabel}>Published</span></div>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Scheduled').length}</span><span className={styles.pStatLabel}>Scheduled</span></div>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Draft').length}</span><span className={styles.pStatLabel}>Drafts</span></div>
              </div>
              <div className={styles.postGrid}>
                {posts.map(p => (
                  <div key={p._id || p.id} className={styles.postCard}>
                    <div className={styles.postTop}>
                      <span className={`${styles.platformTag} ${platformColor(p.platform)}`}>{p.platform}</span>
                      <Badge variant={p.status === 'Published' ? 'default' : p.status === 'Scheduled' ? 'secondary' : 'outline'}>{p.status}</Badge>
                    </div>
                    <p className={styles.postContent}>{p.content}</p>
                    <div className={styles.postMeta}>
                      <span className={styles.muted}>{p.date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A')}</span>
                      {p.engagement && p.engagement !== '—' && <span className={styles.muted}>{p.engagement}</span>}
                    </div>
                    {p.status !== 'Published' && <Button size="sm" onClick={() => publishPost(p._id || p.id)} className={styles.publishBtn}><ExternalLink size={13} style={{ marginRight: '6px' }} /> Publish</Button>}
                  </div>
                ))}
                {posts.length === 0 && <p className={styles.muted}>No posts available.</p>}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Content Calendar</h2>
                <Button size="sm" onClick={() => setCalDialog(true)}><Plus size={14} style={{ marginRight: '6px' }} /> Add Entry</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Platform</th><th>Date</th><th>Type</th><th>Assigned</th></tr></thead>
                  <tbody>
                    {calendar.map(c => (
                      <tr key={c._id || c.id}>
                        <td className={styles.bold}>{c.title}</td>
                        <td><span className={`${styles.platformTag} ${platformColor(c.platform)}`}>{c.platform}</span></td>
                        <td className={styles.muted}>{c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}</td>
                        <td><Badge variant="secondary">{c.type}</Badge></td>
                        <td className={styles.muted}>{c.assigned}</td>
                      </tr>
                    ))}
                    {calendar.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>No calendar entries.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div>
              <h2 className={styles.sectionTitle}>Event Coverage</h2>
              <div className={styles.coverageGrid}>
                {events.map(e => {
                  const eventPhotos = gallery.filter(g => g.event === e.title);
                  return (
                    <div key={e._id || e.id} className={styles.coverageCard}>
                      <h3 className={styles.coverageTitle}>{e.title}</h3>
                      <div className={styles.coverageMeta}>
                        <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                        <span className={styles.muted}>{e.date ? new Date(e.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className={styles.coveragePhotos}>
                        <Camera size={14} />
                        <span className={styles.muted}>{eventPhotos.length} photos</span>
                      </div>
                      <p className={styles.muted}>{e.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadDialog} onClose={() => setUploadDialog(false)} title="Upload Image"
        footer={<><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button><Button onClick={handleUpload}><Send size={14} style={{ marginRight: '6px' }}/> Upload</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption *</label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Image caption" /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" /></div>
          <div className={styles.field}><label>Image File *</label><input type="file" accept="image/*" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} /></div>
        </div>
      </Modal>

      {/* Post Modal */}
      <Modal open={postDialog} onClose={() => setPostDialog(false)} title="Create Social Media Post"
        footer={<><Button variant="outline" onClick={() => setPostDialog(false)}>Cancel</Button><Button onClick={handleAddPost}><Send size={14} style={{ marginRight: '6px' }}/> Create</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Platform</label><Select value={postForm.platform} onChange={e => setPostForm(p => ({ ...p, platform: e.target.value }))}>
            <option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option><option value="Twitter">Twitter</option>
          </Select></div>
          <div className={styles.field}><label>Content *</label><Textarea value={postForm.content} onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your post..." rows={4} /></div>
          <div className={styles.field}><label>Status</label><Select value={postForm.status} onChange={e => setPostForm(p => ({ ...p, status: e.target.value }))}>
            <option value="Draft">Draft</option><option value="Scheduled">Scheduled</option><option value="Published">Published</option>
          </Select></div>
        </div>
      </Modal>

      {/* Calendar Modal */}
      <Modal open={calDialog} onClose={() => setCalDialog(false)} title="Add Calendar Entry"
        footer={<><Button variant="outline" onClick={() => setCalDialog(false)}>Cancel</Button><Button onClick={handleAddCalEntry}><Send size={14} style={{ marginRight: '6px' }}/> Add</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title *</label><Input value={calForm.title} onChange={e => setCalForm(p => ({ ...p, title: e.target.value }))} placeholder="Content title" /></div>
          <div className={styles.field}><label>Platform</label><Select value={calForm.platform} onChange={e => setCalForm(p => ({ ...p, platform: e.target.value }))}>
            <option value="All">All Platforms</option><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option>
          </Select></div>
          <div className={styles.field}><label>Date *</label><Input type="date" value={calForm.date} onChange={e => setCalForm(p => ({ ...p, date: e.target.value }))} /></div>
          <div className={styles.field}><label>Type</label><Select value={calForm.type} onChange={e => setCalForm(p => ({ ...p, type: e.target.value }))}>
            <option value="Post">Post</option><option value="Story">Story</option><option value="Reel">Reel</option><option value="Campaign">Campaign</option>
          </Select></div>
          <div className={styles.field}><label>Assigned To</label><Input value={calForm.assigned} onChange={e => setCalForm(p => ({ ...p, assigned: e.target.value }))} placeholder="Team member" /></div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={!!previewImg} onClose={() => setPreviewImg(null)} title={previewImg?.caption || 'Preview'}
        footer={<Button variant="outline" onClick={() => setPreviewImg(null)}>Close</Button>}>
        {previewImg && <img src={previewImg.url || previewImg.imageBase64} alt={previewImg.caption} style={{ width: '100%', borderRadius: '8px', maxHeight: '70vh', objectFit: 'contain' }} />}
      </Modal>
    </div>
  );
};

export default MediaPRDashboard;  