import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Megaphone, CalendarDays, FileCheck, Wallet, Award } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useToast } from '../components/Toast/ToastProvider.jsx';
import { useAuth } from '../context/AuthContext.jsx'; // 🔴 1. Imported Auth Context
import styles from './Notifications.module.css';

const typeIcons = {
  announcement: Megaphone,
  event: CalendarDays,
  request: FileCheck,
  fund: Wallet,
  performance: Award,
};

const Notifications = () => {
  const { toast } = useToast();
  const { user } = useAuth(); // 🔴 2. Get the dynamically logged-in user
  const [notifs, setNotifs] = useState([]); 
  const [filter, setFilter] = useState('all');

  // FETCH DYNAMIC NOTIFICATIONS
  useEffect(() => {
    fetch('http://localhost:5000/api/notifications/all', {
      // 🔴 3. Fixed: Added the secure session token!
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setNotifs(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error fetching notifications:", err));
  }, []);

  // 🔴 4. THE REAL-WORLD LOGIC FILTER
  // Hide the President's own broadcasted announcements/events from their own feed!
  const displayNotifs = notifs.filter(n => {
    const isCurrentUserPresident = user?.role === 'President' || user?.role === 'Admin';
    const isBroadcastFromPresident = n.type?.toLowerCase() === 'announcement' || n.type?.toLowerCase() === 'event';
    
    // If I am the President, and this is a global broadcast, hide it from me.
    if (isCurrentUserPresident && isBroadcastFromPresident) {
      return false; 
    }
    // Everyone else (CRs, Students, etc.) sees everything. President still sees Requests/Funds.
    return true;
  });

  const unreadCount = displayNotifs.filter(n => !n.read).length;
  
  const filtered = filter === 'all' ? displayNotifs
    : filter === 'unread' ? displayNotifs.filter(n => !n.read)
    : displayNotifs.filter(n => n.type?.toLowerCase() === filter);

  // DYNAMIC MARK ALL READ
  const markAllRead = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/mark-all-read', { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } // 🔴 Secured
      });
      if (res.ok) {
        setNotifs(prev => prev.map(n => ({ ...n, read: true })));
        toast({ title: 'All notifications marked as read' });
      }
    } catch (error) {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  // DYNAMIC MARK SINGLE READ
  const markRead = async (id) => {
    // Optimistically update UI immediately for snappiness
    const notifToUpdate = notifs.find(n => n._id === id || n.id === id);
    if (notifToUpdate?.read) return; // Already read

    try {
      setNotifs(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { 
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } // 🔴 Secured
      });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  // DYNAMIC DELETE
  const deleteNotif = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` } // 🔴 Secured
      });
      if (res.ok) {
        setNotifs(prev => prev.filter(n => n._id !== id && n.id !== id));
        toast({ title: 'Notification removed' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'event', label: 'Events' },
    { id: 'request', label: 'Requests' },
    { id: 'fund', label: 'Funds' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bell size={22} />
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      <div className={styles.filters}>
        {filters.map(f => (
          <button key={f.id} className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length > 0 ? filtered.map(n => {
          const notifId = n._id || n.id; 
          const Icon = typeIcons[n.type?.toLowerCase()] || Bell;
          
          return (
            <div key={notifId} className={`${styles.item} ${!n.read ? styles.unread : ''}`} onClick={() => markRead(notifId)}>
              <div className={`${styles.iconWrap} ${styles[`icon_${n.type?.toLowerCase()}`] || ''}`}>
                <Icon size={16} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                  <h3 className={styles.itemTitle}>{n.title}</h3>
                  <span className={styles.itemDate}>{n.date || new Date(n.createdAt).toLocaleDateString('en-PK')}</span>
                </div>
                <p className={styles.itemMsg}>{n.message || n.description}</p>
                <div className={styles.itemMeta}>
                  <Badge variant="secondary">{n.type}</Badge>
                  {!n.read && <span className={styles.dot} />}
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteNotif(notifId); }} title="Remove">
                <Trash2 size={14} />
              </button>
            </div>
          );
        }) : (
          <div className={styles.empty}>
            <Bell size={40} />
            <p>No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;