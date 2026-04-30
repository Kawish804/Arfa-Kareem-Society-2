import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Camera, Bell, LogOut, Plus, Send, Share2, Eye, Trash2, ExternalLink, FileImage, MessageSquare, Loader2 } from 'lucide-react';
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MediaPRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LIVE DATABASE STATES
  const [gallery, setGallery] = useState([]);
  const [posts, setPosts] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [events, setEvents] = useState([]);

  const [notifs, setNotifs] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Dialogs
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });
  const [postDialog, setPostDialog] = useState(false);
  const [postForm, setPostForm] = useState({ platform: 'Instagram', content: '', status: 'Draft' });
  const [calDialog, setCalDialog] = useState(false);
  const [calForm, setCalForm] = useState({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });
  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    const fetchMediaData = async () => {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      try {
        const [galRes, postRes, calRes, evRes, notifRes, chatRes] = await Promise.all([
          fetch(`${API_URL}/gallery`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/social-posts`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/content-calendar`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/events`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/notifications/all`, { headers }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/messages/my-messages`, { headers }).catch(() => ({ ok: false }))
        ]);

        if (galRes.ok) { const data = await galRes.json(); setGallery(Array.isArray(data) ? data : []); }
        if (postRes.ok) { const data = await postRes.json(); setPosts(Array.isArray(data) ? data : []); }
        if (calRes.ok) { const data = await calRes.json(); setCalendar(Array.isArray(data) ? data : []); }
        if (evRes.ok) { const data = await evRes.json(); setEvents(Array.isArray(data) ? data : []); }

        if (notifRes.ok) {
          const allNotifs = await notifRes.json();
          if (Array.isArray(allNotifs)) setNotifs(allNotifs.filter(n => !n.targetUser || n.targetUser === currentUser?.fullName));
        }

        if (chatRes.ok) {
          const msgs = await chatRes.json();
          const myId = currentUser?._id || currentUser?.id;
          setUnreadChatCount(msgs.filter(m => !m.read && m.receiver === myId).length);
        }
      } catch (error) {
        toast({ title: 'Sync Error', description: 'Failed to connect to media servers.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchMediaData();
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
    if (!uploadForm.caption.trim() || !uploadForm.file) { toast({ title: 'Validation Error', description: 'Caption and Image required.', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      const base64Image = await convertToBase64(uploadForm.file);
      const payload = { caption: uploadForm.caption.trim(), event: uploadForm.event || 'General', imageBase64: base64Image, uploadedBy: currentUser?.fullName };

      const res = await fetch(`${API_URL}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newImg = await res.json();
        setGallery(prev => [newImg, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Success', description: 'Image uploaded to the gallery.' });
        setUploadDialog(false);
        setUploadForm({ caption: '', event: '', file: null });
      } else throw new Error();
    } catch (err) { toast({ title: 'Upload failed', description: 'Image might be too large.', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm("Are you sure you want to completely delete this image?")) return;
    try {
      const res = await fetch(`${API_URL}/gallery/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (res.ok) {
        setGallery(prev => (Array.isArray(prev) ? prev : []).filter(g => (g._id || g.id) !== id));
        toast({ title: 'Success', description: 'Image permanently removed.' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  const handleAddPost = async () => {
    if (!postForm.content.trim()) { toast({ title: 'Validation Error', description: 'Content is required.', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      const payload = { ...postForm, author: currentUser?.fullName };
      const res = await fetch(`${API_URL}/social-posts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts(prev => [newPost, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Success', description: 'Social post drafted.' });
        setPostDialog(false);
        setPostForm({ platform: 'Instagram', content: '', status: 'Draft' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Error', description: 'Failed to create post.', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
  };

  const publishPost = async (id) => {
    try {
      const res = await fetch(`${API_URL}/social-posts/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify({ status: 'Published', date: new Date().toISOString().split('T')[0] })
      });
      if (res.ok) {
        setPosts(prev => (Array.isArray(prev) ? prev : []).map(p => (p._id || p.id) === id ? { ...p, status: 'Published', date: new Date().toISOString().split('T')[0] } : p));
        toast({ title: 'Success', description: 'Post published!' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Publish Error', variant: 'destructive' }); }
  };

  const handleAddCalEntry = async () => {
    if (!calForm.title.trim() || !calForm.date) { toast({ title: 'Validation Error', description: 'Title and date required.', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/content-calendar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('token')}` },
        body: JSON.stringify(calForm)
      });
      if (res.ok) {
        const newEntry = await res.json();
        setCalendar(prev => [newEntry, ...(Array.isArray(prev) ? prev : [])]);
        toast({ title: 'Success', description: 'Calendar entry added.' });
        setCalDialog(false);
        setCalForm({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });
      } else throw new Error();
    } catch (err) { toast({ title: 'Error', description: 'Failed to schedule entry.', variant: 'destructive' }); }
    finally { setIsSubmitting(false); }
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

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spin} size={48} />
        <h2>Syncing Media Workspace...</h2>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><Camera size={22} /></div>
            <div>
              <h1 className={styles.headerTitle}>Media & PR</h1>
              <p className={styles.headerSub}>Logged in as <strong>{currentUser?.fullName}</strong></p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="outline" className={styles.hideMobile}>Media Head Access</Badge>
            <TransferRoleWidget />

            <button className={styles.iconBtn} onClick={() => navigate('/chat')} title="Messages">
              <MessageSquare size={20} />
              {unreadChatCount > 0 && <span className={styles.badgeAlert}>{unreadChatCount}</span>}
            </button>

            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} title="Notifications">
              <Bell size={20} />
              {notifs.filter(n => !n.read).length > 0 && <span className={styles.badgeAlert}>{notifs.filter(n => !n.read).length}</span>}
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
            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
              <t.icon size={16} style={{ marginRight: '6px' }} /><span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeTab === 'gallery' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Photo Gallery</h2>
                  <p className={styles.sectionDesc}>Manage and upload society photos.</p>
                </div>
                <Button onClick={() => setUploadDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> Upload Image</Button>
              </div>
              <div className={styles.galleryGrid}>
                {gallery.map(img => (
                  <div key={img._id || img.id} className={styles.galleryItem}>
                    <img src={img.url || img.imageBase64} alt={img.caption} className={styles.galleryImg} onClick={() => setPreviewImg(img)} />
                    <div className={styles.galleryOverlay}>
                      <span className={styles.galleryCaption}>{img.caption}</span>
                      <div className={styles.galleryActions}>
                        <button className={styles.overlayIconBtn} onClick={() => setPreviewImg(img)}><Eye size={16} /></button>
                        <button className={styles.overlayIconBtn} onClick={() => handleDeleteImage(img._id || img.id)} style={{ color: '#fca5a5' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className={styles.galleryBadge}>{img.event}</div>
                  </div>
                ))}
                {gallery.length === 0 && <p className={styles.emptyTable}>No images in gallery.</p>}
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Social Media Posts</h2>
                  <p className={styles.sectionDesc}>Draft and schedule posts across platforms.</p>
                </div>
                <Button onClick={() => setPostDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> Create Post</Button>
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
                      <Badge variant={p.status === 'Published' ? 'success' : p.status === 'Scheduled' ? 'secondary' : 'warning'}>{p.status}</Badge>
                    </div>
                    <p className={styles.postContent}>{p.content}</p>
                    <div className={styles.postMeta}>
                      <span>{p.date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A')}</span>
                      {p.engagement && p.engagement !== '—' && <span>{p.engagement}</span>}
                    </div>
                    {p.status !== 'Published' && <Button size="sm" variant="outline" onClick={() => publishPost(p._id || p.id)} style={{ marginTop: '16px', width: '100%', borderColor: '#52a447', color: '#52a447' }}><ExternalLink size={14} style={{ marginRight: '6px' }} /> Publish Now</Button>}
                  </div>
                ))}
                {posts.length === 0 && <p className={styles.emptyTable}>No posts available.</p>}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className={styles.fadeEnter}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Content Calendar</h2>
                  <p className={styles.sectionDesc}>Plan out the content strategy for the month.</p>
                </div>
                <Button onClick={() => setCalDialog(true)} style={{ backgroundColor: '#52a447' }}><Plus size={16} style={{ marginRight: '6px' }} /> Add Entry</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Platform</th><th>Date</th><th>Type</th><th>Assigned</th></tr></thead>
                  <tbody>
                    {calendar.map(c => (
                      <tr key={c._id || c.id}>
                        <td className={styles.bold}>{c.title}</td>
                        <td><span className={`${styles.platformTag} ${platformColor(c.platform)}`}>{c.platform}</span></td>
                        <td className={styles.mutedInfo}>{c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}</td>
                        <td><Badge variant="outline">{c.type}</Badge></td>
                        <td className={styles.mutedInfo}>{c.assigned}</td>
                      </tr>
                    ))}
                    {calendar.length === 0 && <tr><td colSpan={5} className={styles.emptyTable}>No calendar entries.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coverage' && (
            <div className={styles.fadeEnter}>
              <h2 className={styles.sectionTitle}>Event Coverage</h2>
              <div className={styles.coverageGrid}>
                {events.map(e => {
                  const eventPhotos = gallery.filter(g => g.event === e.title);
                  return (
                    <div key={e._id || e.id} className={styles.coverageCard}>
                      <h3 className={styles.coverageTitle}>{e.title}</h3>
                      <div className={styles.coverageMeta}>
                        <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                        <span>{e.date ? new Date(e.date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div className={styles.coveragePhotos}>
                        <Camera size={14} style={{ marginRight: '6px' }} />
                        {eventPhotos.length} photos captured
                      </div>
                      <p className={styles.mutedInfo} style={{ marginTop: '12px' }}>{e.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <Modal open={uploadDialog} onClose={() => !isSubmitting && setUploadDialog(false)} title="Upload Image"
        footer={<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}><Button variant="outline" onClick={() => setUploadDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleUpload} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Uploading...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Upload</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption <span style={{ color: 'red' }}>*</span></label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Image caption" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" disabled={isSubmitting} /></div>
          <div className={styles.field}>
            <label>Image File <span style={{ color: 'red' }}>*</span></label>
            <div className={styles.uploadWrap}>
              <input type="file" accept="image/*" id="prUpload" className={styles.fileInput} onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} disabled={isSubmitting} />
              <label htmlFor="prUpload" className={`${styles.uploadBtn} ${isSubmitting ? styles.disabled : ''}`}>
                {uploadForm.file ? uploadForm.file.name : 'Choose an image file...'}
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={postDialog} onClose={() => !isSubmitting && setPostDialog(false)} title="Create Social Media Post"
        footer={<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}><Button variant="outline" onClick={() => setPostDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddPost} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Saving...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Create Post</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Platform</label><Select value={postForm.platform} onChange={e => setPostForm(p => ({ ...p, platform: e.target.value }))} disabled={isSubmitting}>
            <option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option><option value="Twitter">Twitter</option>
          </Select></div>
          <div className={styles.field}><label>Content <span style={{ color: 'red' }}>*</span></label><Textarea value={postForm.content} onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your post..." rows={4} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Status</label><Select value={postForm.status} onChange={e => setPostForm(p => ({ ...p, status: e.target.value }))} disabled={isSubmitting}>
            <option value="Draft">Draft</option><option value="Scheduled">Scheduled</option><option value="Published">Published</option>
          </Select></div>
        </div>
      </Modal>

      <Modal open={calDialog} onClose={() => !isSubmitting && setCalDialog(false)} title="Add Calendar Entry"
        footer={<div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}><Button variant="outline" onClick={() => setCalDialog(false)} disabled={isSubmitting}>Cancel</Button><Button onClick={handleAddCalEntry} disabled={isSubmitting} style={{ backgroundColor: '#52a447' }}>{isSubmitting ? <><Loader2 size={16} className={styles.spin} style={{ marginRight: '6px' }} /> Adding...</> : <><Send size={14} style={{ marginRight: '6px' }} /> Schedule</>}</Button></div>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Title <span style={{ color: 'red' }}>*</span></label><Input value={calForm.title} onChange={e => setCalForm(p => ({ ...p, title: e.target.value }))} placeholder="Content title" disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Platform</label><Select value={calForm.platform} onChange={e => setCalForm(p => ({ ...p, platform: e.target.value }))} disabled={isSubmitting}>
            <option value="All">All Platforms</option><option value="Instagram">Instagram</option><option value="Facebook">Facebook</option><option value="LinkedIn">LinkedIn</option>
          </Select></div>
          <div className={styles.field}><label>Date <span style={{ color: 'red' }}>*</span></label><Input type="date" value={calForm.date} onChange={e => setCalForm(p => ({ ...p, date: e.target.value }))} disabled={isSubmitting} /></div>
          <div className={styles.field}><label>Type</label><Select value={calForm.type} onChange={e => setCalForm(p => ({ ...p, type: e.target.value }))} disabled={isSubmitting}>
            <option value="Post">Post</option><option value="Story">Story</option><option value="Reel">Reel</option><option value="Campaign">Campaign</option>
          </Select></div>
          <div className={styles.field}><label>Assigned To</label><Input value={calForm.assigned} onChange={e => setCalForm(p => ({ ...p, assigned: e.target.value }))} placeholder="Team member" disabled={isSubmitting} /></div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal open={!!previewImg} onClose={() => setPreviewImg(null)} title={previewImg?.caption || 'Preview'} footer={<Button variant="outline" onClick={() => setPreviewImg(null)}>Close</Button>}>
        {previewImg && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
            <img src={previewImg.url || previewImg.imageBase64} alt={previewImg.caption} style={{ width: '100%', borderRadius: '8px', maxHeight: '60vh', objectFit: 'contain' }} />
            <div style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}>
              <span>Event: <strong>{previewImg.event}</strong></span>
              <span>By: {previewImg.uploadedBy}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MediaPRDashboard;