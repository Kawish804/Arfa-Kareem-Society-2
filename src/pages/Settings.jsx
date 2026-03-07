import { useState } from 'react';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Switch from '@/components/ui/Switch.jsx';
import Tabs from '@/components/ui/Tabs.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Settings.module.css';

const tabs = [
  { value: 'profile', label: 'Society Profile' },
  { value: 'roles', label: 'Manage Roles' },
  { value: 'password', label: 'Change Password' },
  { value: 'notifications', label: 'Notifications' },
];

const Settings = () => {
  const { toast } = useToast();
  const [notifs, setNotifs] = useState({ email: true, events: true, funds: false, announcements: true });

  return (
    <div>
      <div className={styles.header}><h1>Settings</h1><p className={styles.sub}>Manage your society profile and preferences.</p></div>
      <Tabs tabs={tabs} defaultTab="profile">
        {(active) => (
          <>
            {active === 'profile' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Society Profile</h3>
                <div className={styles.formGrid}>
                  <div className={styles.field}><label>Society Name</label><Input defaultValue="Arfa Kareem Society" /></div>
                  <div className={styles.field}><label>University</label><Input defaultValue="University of Education" /></div>
                  <div className={styles.field}><label>Email</label><Input defaultValue="info@arfakareem.edu" /></div>
                  <div className={styles.field}><label>Phone</label><Input defaultValue="+92-300-1234567" /></div>
                </div>
                <Button onClick={() => toast({ title: 'Profile Updated' })}>Save Changes</Button>
              </div>
            )}
            {active === 'roles' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Manage Roles</h3>
                <div className={styles.rolesList}>
                  {['Admin', 'Finance Head', 'Event Coordinator', 'Secretary', 'Member'].map(role => (
                    <div key={role} className={styles.roleRow}>
                      <span>{role}</span>
                      <Button size="sm" variant="outline">Edit Permissions</Button>
                    </div>
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
                  <Button onClick={() => toast({ title: 'Password Changed' })}>Update Password</Button>
                </div>
              </div>
            )}
            {active === 'notifications' && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Notification Preferences</h3>
                <div className={styles.notifList}>
                  {Object.entries(notifs).map(([key, val]) => (
                    <div key={key} className={styles.notifRow}>
                      <div><p className={styles.notifLabel}>{key} Notifications</p><p className={styles.notifDesc}>Receive {key}-related notifications</p></div>
                      <Switch checked={val} onChange={v => setNotifs(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
                <Button onClick={() => toast({ title: 'Preferences Saved' })}>Save Preferences</Button>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
