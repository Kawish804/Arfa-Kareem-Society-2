import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Image, Camera, Bell, LogOut, Plus, Send, Megaphone, Share2, Eye, Trash2, ExternalLink, FileImage } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Select from '@/components/ui/Select.jsx';
import { galleryImages, events, announcements as initialAnnouncements, notifications as initialNotifications } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './MediaPRDashboard.module.css';

const currentUser = { name: 'Hassan Raza', role: 'Media/PR Head' };

const MediaPRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('gallery');
  const [gallery, setGallery] = useState(galleryImages);
  const [notifs] = useState(initialNotifications);

  // Social media posts
  const [posts, setPosts] = useState([
    { id: '1', platform: 'Instagram', content: 'Tech Summit 2024 was a huge success! 🎉 Thank you to all participants.', status: 'Published', date: '2024-03-15', engagement: '245 likes' },
    { id: '2', platform: 'Facebook', content: 'Registration open for Annual Cultural Night! Limited seats available.', status: 'Scheduled', date: '2024-03-20', engagement: '—' },
    { id: '3', platform: 'LinkedIn', content: 'Proud to announce our partnership with TechCorp for student internships.', status: 'Draft', date: '2024-03-18', engagement: '—' },
  ]);

  // Content calendar
  const [calendar, setCalendar] = useState([
    { id: '1', title: 'Event Recap Post', platform: 'All', date: '2024-03-22', type: 'Post', assigned: 'Hassan Raza' },
    { id: '2', title: 'Member Spotlight', platform: 'Instagram', date: '2024-03-25', type: 'Story', assigned: 'Sara Khan' },
    { id: '3', title: 'Recruitment Drive', platform: 'Facebook', date: '2024-03-28', type: 'Campaign', assigned: 'Team' },
  ]);

  // Upload dialog
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({ caption: '', event: '', file: null });

  // Post dialog
  const [postDialog, setPostDialog] = useState(false);
  const [postForm, setPostForm] = useState({ platform: 'Instagram', content: '', status: 'Draft' });

  // Calendar dialog
  const [calDialog, setCalDialog] = useState(false);
  const [calForm, setCalForm] = useState({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });

  // Preview
  const [previewImg, setPreviewImg] = useState(null);

  const handleUpload = () => {
    if (!uploadForm.caption) { toast({ title: 'Caption required', variant: 'destructive' }); return; }
    setGallery(prev => [...prev, { id: String(Date.now()), url: uploadForm.file ? URL.createObjectURL(uploadForm.file) : '/placeholder.svg', event: uploadForm.event || 'General', caption: uploadForm.caption }]);
    toast({ title: 'Image uploaded' });
    setUploadDialog(false);
    setUploadForm({ caption: '', event: '', file: null });
  };

  const handleDeleteImage = (id) => {
    setGallery(prev => prev.filter(g => g.id !== id));
    toast({ title: 'Image removed' });
  };

  const handleAddPost = () => {
    if (!postForm.content) { toast({ title: 'Content required', variant: 'destructive' }); return; }
    setPosts(prev => [...prev, { id: String(Date.now()), platform: postForm.platform, content: postForm.content, status: postForm.status, date: new Date().toISOString().split('T')[0], engagement: '—' }]);
    toast({ title: 'Post created' });
    setPostDialog(false);
    setPostForm({ platform: 'Instagram', content: '', status: 'Draft' });
  };

  const handleAddCalEntry = () => {
    if (!calForm.title || !calForm.date) { toast({ title: 'Title and date required', variant: 'destructive' }); return; }
    setCalendar(prev => [...prev, { id: String(Date.now()), ...calForm }]);
    toast({ title: 'Calendar entry added' });
    setCalDialog(false);
    setCalForm({ title: '', platform: 'All', date: '', type: 'Post', assigned: '' });
  };

  const publishPost = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'Published', date: new Date().toISOString().split('T')[0] } : p));
    toast({ title: 'Post published!' });
  };

  const tabs = [
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'calendar', label: 'Content Calendar', icon: FileImage },
    { id: 'coverage', label: 'Event Coverage', icon: Camera },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const platformColor = (p) => {
    if (p === 'Instagram') return styles.platformInsta;
    if (p === 'Facebook') return styles.platformFb;
    if (p === 'LinkedIn') return styles.platformLi;
    return '';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerLogo}><Camera size={20} /></div>
            <div>
              <h1 className={styles.headerTitle}>Media & PR</h1>
              <p className={styles.headerSub}>Welcome, {currentUser.name}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <Badge variant="default">Media/PR Head</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}><Bell size={14} /></Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}><LogOut size={14} /> Logout</Button>
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
                <Button size="sm" onClick={() => setUploadDialog(true)}><Plus size={14} /> Upload Image</Button>
              </div>
              <div className={styles.galleryGrid}>
                {gallery.map(img => (
                  <div key={img.id} className={styles.galleryItem}>
                    <img src={img.url} alt={img.caption} className={styles.galleryImg} onClick={() => setPreviewImg(img)} />
                    <div className={styles.galleryOverlay}>
                      <span className={styles.galleryCaption}>{img.caption}</span>
                      <div className={styles.galleryActions}>
                        <button className={styles.iconBtn} onClick={() => setPreviewImg(img)}><Eye size={14} /></button>
                        <button className={styles.iconBtn} onClick={() => handleDeleteImage(img.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <Badge variant="secondary" className={styles.galleryBadge}>{img.event}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Social Media Posts</h2>
                <Button size="sm" onClick={() => setPostDialog(true)}><Plus size={14} /> Create Post</Button>
              </div>
              <div className={styles.postStats}>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Published').length}</span><span className={styles.pStatLabel}>Published</span></div>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Scheduled').length}</span><span className={styles.pStatLabel}>Scheduled</span></div>
                <div className={styles.pStat}><span className={styles.pStatNum}>{posts.filter(p => p.status === 'Draft').length}</span><span className={styles.pStatLabel}>Drafts</span></div>
              </div>
              <div className={styles.postGrid}>
                {posts.map(p => (
                  <div key={p.id} className={styles.postCard}>
                    <div className={styles.postTop}>
                      <span className={`${styles.platformTag} ${platformColor(p.platform)}`}>{p.platform}</span>
                      <Badge variant={p.status === 'Published' ? 'default' : p.status === 'Scheduled' ? 'secondary' : 'outline'}>{p.status}</Badge>
                    </div>
                    <p className={styles.postContent}>{p.content}</p>
                    <div className={styles.postMeta}>
                      <span className={styles.muted}>{p.date}</span>
                      {p.engagement !== '—' && <span className={styles.muted}>{p.engagement}</span>}
                    </div>
                    {p.status !== 'Published' && <Button size="sm" onClick={() => publishPost(p.id)} className={styles.publishBtn}><ExternalLink size={13} /> Publish</Button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Content Calendar</h2>
                <Button size="sm" onClick={() => setCalDialog(true)}><Plus size={14} /> Add Entry</Button>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Title</th><th>Platform</th><th>Date</th><th>Type</th><th>Assigned</th></tr></thead>
                  <tbody>
                    {calendar.map(c => (
                      <tr key={c.id}>
                        <td className={styles.bold}>{c.title}</td>
                        <td><span className={`${styles.platformTag} ${platformColor(c.platform)}`}>{c.platform}</span></td>
                        <td className={styles.muted}>{c.date}</td>
                        <td><Badge variant="secondary">{c.type}</Badge></td>
                        <td className={styles.muted}>{c.assigned}</td>
                      </tr>
                    ))}
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
                    <div key={e.id} className={styles.coverageCard}>
                      <h3 className={styles.coverageTitle}>{e.title}</h3>
                      <div className={styles.coverageMeta}>
                        <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
                        <span className={styles.muted}>{e.date}</span>
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

          {activeTab === 'notifications' && (
            <div>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <div className={styles.notifList}>
                {notifs.map(n => (
                  <div key={n.id} className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}>
                    <div className={styles.notifDot} />
                    <div className={styles.notifContent}>
                      <h4 className={styles.notifTitle}>{n.title}</h4>
                      <p className={styles.muted}>{n.message}</p>
                      <span className={styles.notifDate}>{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadDialog} onClose={() => setUploadDialog(false)} title="Upload Image"
        footer={<><Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button><Button onClick={handleUpload}><Send size={14} /> Upload</Button></>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Caption *</label><Input value={uploadForm.caption} onChange={e => setUploadForm(p => ({ ...p, caption: e.target.value }))} placeholder="Image caption" /></div>
          <div className={styles.field}><label>Event</label><Input value={uploadForm.event} onChange={e => setUploadForm(p => ({ ...p, event: e.target.value }))} placeholder="Related event name" /></div>
          <div className={styles.field}><label>Image File</label><input type="file" accept="image/*" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} /></div>
        </div>
      </Modal>

      {/* Post Modal */}
      <Modal open={postDialog} onClose={() => setPostDialog(false)} title="Create Social Media Post"
        footer={<><Button variant="outline" onClick={() => setPostDialog(false)}>Cancel</Button><Button onClick={handleAddPost}><Send size={14} /> Create</Button></>}>
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
        footer={<><Button variant="outline" onClick={() => setCalDialog(false)}>Cancel</Button><Button onClick={handleAddCalEntry}><Send size={14} /> Add</Button></>}>
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
        {previewImg && <img src={previewImg.url} alt={previewImg.caption} style={{ width: '100%', borderRadius: '8px' }} />}
      </Modal>
    </div>
  );
};

export default MediaPRDashboard;
