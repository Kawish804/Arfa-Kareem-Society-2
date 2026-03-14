import { useState } from 'react';
import { Bell, CheckCheck, Trash2, Megaphone, CalendarDays, FileCheck, Wallet, Award } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import { notifications as initialNotifications } from '../data/mockData.js';
import { useToast } from '../components/Toast/ToastProvider.jsx';
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
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState('all');
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === 'all' ? notifs
    : filter === 'unread' ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);
  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: 'All notifications marked as read' });
  };
  const markRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    toast({ title: 'Notification removed' });
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
          const Icon = typeIcons[n.type] || Bell;
          return (
            <div key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`} onClick={() => markRead(n.id)}>
              <div className={`${styles.iconWrap} ${styles[`icon_${n.type}`]}`}>
                <Icon size={16} />
              </div>
              <div className={styles.itemContent}>
                <div className={styles.itemTop}>
                  <h3 className={styles.itemTitle}>{n.title}</h3>
                  <span className={styles.itemDate}>{n.date}</span>
                </div>
                <p className={styles.itemMsg}>{n.message}</p>
                <div className={styles.itemMeta}>
                  <Badge variant="secondary">{n.type}</Badge>
                  {!n.read && <span className={styles.dot} />}
                </div>
              </div>
              <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); deleteNotif(n.id); }} title="Remove">
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
