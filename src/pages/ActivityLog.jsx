import { useState, useMemo, useEffect } from 'react';
import { Users, Wallet, Receipt, CalendarDays, FileCheck, UserCog, CheckCircle, Activity, Clock, LogIn, LogOut, UserPlus, Settings, Edit, Trash2, Upload, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import PageHeader from '@/components/PageHeader.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './ActivityLogs.module.css';

const ACTIVITY_ICON_MAP = {
  login: LogIn, logout: LogOut, role_change: UserCog, member_added: UserPlus,
  member_removed: Trash2, request_approved: CheckCircle, request_rejected: FileCheck,
  event_created: CalendarDays, fund_collected: Wallet, expense_added: Receipt,
  settings_changed: Settings, announcement: Edit, upload: Upload, general: Activity,
};

const ACTIVITY_COLOR_MAP = {
  login: '#3B82F6', logout: '#6B7280', role_change: '#8B5CF6', member_added: '#22C55E',
  member_removed: '#EF4444', request_approved: '#22C55E', request_rejected: '#EF4444',
  event_created: '#F59E0B', fund_collected: '#10B981', expense_added: '#F97316',
  settings_changed: '#6366F1', announcement: '#0EA5E9', upload: '#14B8A6', general: '#64748B',
};

const ROLES = ['President', 'Finance Head', 'Finance Secretary', 'Event Manager', 'General Secretary', 'Media Manager', 'Joint General Secretary', 'Assistant Finance Head', 'Co-Media Manager', 'Member', 'Class Representative', 'Student'];

const ITEMS_PER_PAGE = 10;

const ActivityLog = () => {
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [logRoleFilter, setLogRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/activities', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data);
        }
      } catch (error) {
        toast({ title: 'Failed to fetch activity logs', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [toast]);

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchSearch = !logSearch || log.action.toLowerCase().includes(logSearch.toLowerCase()) || log.user.toLowerCase().includes(logSearch.toLowerCase());
      const matchType = logTypeFilter === 'all' || log.type === logTypeFilter;
      const matchRole = logRoleFilter === 'all' || log.role === logRoleFilter;
      return matchSearch && matchType && matchRole;
    });
  }, [logSearch, logTypeFilter, logRoleFilter, activityLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [logSearch, logTypeFilter, logRoleFilter]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const exportCSV = () => {
    if (filteredLogs.length === 0) return toast({ title: 'No data to export', variant: 'destructive' });
    const headers = ['#', 'Timestamp', 'User', 'Role', 'Type', 'Action', 'IP Address'];
    const rows = filteredLogs.map((log, i) => [
      i + 1, formatTime(log.createdAt), log.user, log.role, log.type.replace(/_/g, ' '), `"${log.action}"`, log.ip || 'N/A'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV Export Downloaded' });
  };

  const exportPDF = () => {
    if (filteredLogs.length === 0) return toast({ title: 'No data to export', variant: 'destructive' });
    const printWindow = window.open('', '_blank');
    const tableRows = filteredLogs.map((log, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${formatTime(log.createdAt)}</td>
        <td><strong>${log.user}</strong></td>
        <td>${log.role}</td>
        <td>${log.type.replace(/_/g, ' ')}</td>
        <td>${log.action}</td>
        <td>${log.ip || '—'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>Activity Log Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a2e; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #666; font-size: 13px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #1E3A8A; color: white; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
      </style></head><body>
        <h1>Arfa Kareem Society — Activity Log Report</h1>
        <p>Generated on ${new Date().toLocaleString()} | Total Records: ${filteredLogs.length}</p>
        <table>
          <thead><tr><th>#</th><th>Timestamp</th><th>User</th><th>Role</th><th>Type</th><th>Action</th><th>IP</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">Arfa Kareem Society Management System — Confidential</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Activity Log" subtitle="Complete live record of all system actions" />

      {/* 🔴 THE FIX: EXPORT BUTTONS EXPLICITLY PLACED HERE */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '20px' }}>
        <Button variant="outline" onClick={exportCSV} style={{ backgroundColor: 'white' }}>
          <Download size={16} style={{ marginRight: '8px' }}/> Export CSV
        </Button>
        <Button variant="outline" onClick={exportPDF} style={{ backgroundColor: 'white' }}>
          <Download size={16} style={{ marginRight: '8px' }}/> Export PDF
        </Button>
      </div>

      <div className={styles.logFilters}>
        <div className={styles.logSearchWrap}>
          <Search size={16} className={styles.logSearchIcon} />
          <Input placeholder="Search by user or action..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className={styles.logSearchInput} />
        </div>
        <Select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="role_change">Role Change</option>
          <option value="member_added">Member Added</option>
          <option value="member_removed">Member Removed</option>
          <option value="request_approved">Request Approved</option>
          <option value="request_rejected">Request Rejected</option>
          <option value="event_created">Event Activity</option>
          <option value="fund_collected">Fund Collection</option>
          <option value="expense_added">Expense Added</option>
          <option value="announcement">Announcement</option>
          <option value="settings_changed">Settings</option>
        </Select>
        <Select value={logRoleFilter} onChange={e => setLogRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      <div className={styles.logStats}>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{activityLogs.length}</span>
          <span className={styles.logStatLabel}>Total Actions</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{activityLogs.filter(l => l.type === 'login').length}</span>
          <span className={styles.logStatLabel}>Logins</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{new Set(activityLogs.map(l => l.user)).size}</span>
          <span className={styles.logStatLabel}>Active Users</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{filteredLogs.length}</span>
          <span className={styles.logStatLabel}>Showing (Filtered)</span>
        </div>
      </div>

      <div className={styles.logTimeline}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading live activity logs...</p>
        ) : currentLogs.length === 0 ? (
          <p className={styles.empty}>No activity matches your filters.</p>
        ) : (
          currentLogs.map(log => {
            const IconComp = ACTIVITY_ICON_MAP[log.type] || Activity;
            const color = ACTIVITY_COLOR_MAP[log.type] || '#64748B';
            return (
              <div key={log._id} className={styles.logItem}>
                <div className={styles.logIconWrap} style={{ background: `${color}15`, color }}>
                  <IconComp size={16} />
                </div>
                <div className={styles.logContent}>
                  <div className={styles.logTop}>
                    <span className={styles.logUser}>{log.user}</span>
                    <Badge variant="secondary">{log.role}</Badge>
                  </div>
                  <p className={styles.logAction}>{log.action}</p>
                  <div className={styles.logMeta}>
                    <span className={styles.logTime}><Clock size={12} /> {formatTime(log.createdAt)}</span>
                    {log.ip && <span className={styles.logIp}>IP: {log.ip}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
            <ChevronLeft size={16} style={{ marginRight: '4px' }} /> Previous
          </Button>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Page <strong style={{ color: '#0f172a' }}>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
            Next <ChevronRight size={16} style={{ marginLeft: '4px' }} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;