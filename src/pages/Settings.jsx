import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Switch from '@/components/ui/Switch.jsx';
import Tabs from '@/components/ui/Tabs.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import { useSettings } from '@/context/SettingsContext.jsx'; // <-- IMPORT THE CONTEXT
import styles from './Settings.module.css';

const tabs = [
  { value: 'profile', label: 'Society Profile' },
  { value: 'roles', label: 'Manage Roles' },
  { value: 'password', label: 'Change Password' },
  { value: 'notifications', label: 'Notifications' },
];

const Settings = () => {
  const { toast } = useToast();
  
  // GRAB THE GLOBAL SETTINGS & REFRESH FUNCTION
  const { settings, refreshSettings } = useSettings(); 
  
  const [profile, setProfile] = useState({ societyName: '', university: '', email: '', phone: '' });
  const [notifs, setNotifs] = useState({ email: true, events: true, funds: false, announcements: true });

  // Automatically fill the form when the global settings load
  useEffect(() => {
    if (settings) {
      setProfile({
        societyName: settings.societyName || '',
        university: settings.university || '',
        email: settings.email || '',
        phone: settings.phone || ''
      });
      if (settings.notifications) {
        setNotifs(settings.notifications);
      }
    }
  }, [settings]);

  const handleSave = async (section) => {
    try {
      const payload = { ...profile, notifications: notifs };

      const res = await fetch('http://localhost:5000/api/settings/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast({ title: `${section} Updated Successfully!` });
        
        // THE MAGIC: Tell the whole app to fetch the new data right now!
        refreshSettings(); 
      } else {
        toast({ title: 'Failed to update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Server Error', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p className={styles.sub}>Manage your society profile and preferences globally.</p>
      </div>

      <Tabs tabs={tabs} defaultTab="profile">
        {(active) => (
          <>
            {active === 'profile' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Society Profile</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  These details will be displayed publicly on the Student Portal and Landing Pages.
                </p>
                <div className={styles.formGrid}>
                  <div className={styles.field}><label>Society Name</label><Input value={profile.societyName} onChange={e => setProfile(p => ({ ...p, societyName: e.target.value }))} /></div>
                  <div className={styles.field}><label>University</label><Input value={profile.university} onChange={e => setProfile(p => ({ ...p, university: e.target.value }))} /></div>
                  <div className={styles.field}><label>Email Contact</label><Input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} /></div>
                  <div className={styles.field}><label>Phone Number</label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
                </div>
                <Button onClick={() => handleSave('Society Profile')}>Save Changes</Button>
              </div>
            )}
            {active === 'roles' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Manage Roles</h3>
                <div className={styles.rolesList}>
                  {['Admin', 'Finance Head', 'Event Coordinator', 'Secretary', 'Member'].map(role => (
                    <div key={role} className={styles.roleRow}><span>{role}</span><Button size="sm" variant="outline">Edit</Button></div>
                  ))}
                </div>
              </div>
            )}
            {active === 'password' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Change Password</h3>
                <div className={styles.passwordForm}>
                  <div className={styles.field}><label>Current Password</label><Input type="password" /></div>
                  <div className={styles.field}><label>New Password</label><Input type="password" /></div>
                  <div className={styles.field}><label>Confirm New Password</label><Input type="password" /></div>
                  <Button>Update Password</Button>
                </div>
              </div>
            )}
            {active === 'notifications' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Notification Preferences</h3>
                <div className={styles.notifList}>
                  {Object.entries(notifs).map(([key, val]) => (
                    <div key={key} className={styles.notifRow}>
                      <div><p className={styles.notifLabel} style={{ textTransform: 'capitalize' }}>{key} Notifications</p></div>
                      <Switch checked={val} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleSave('Notification Preferences')}>Save Preferences</Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;