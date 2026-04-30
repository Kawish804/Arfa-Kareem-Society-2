import { useState, useMemo, useEffect } from 'react';
import { Users, Wallet, Receipt, CalendarDays, FileCheck, UserCog, CheckCircle, Activity, Clock, LogIn, LogOut, UserPlus, Settings, Edit, Trash2, Upload, Search, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Select from '@/components/ui/Select.jsx';
import PageHeader from '@/components/PageHeader.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './ActivityLogs.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACTIVITY_ICON_MAP = {
  login: LogIn, logout: LogOut, role_change: UserCog, member_added: UserPlus,
  member_removed: Trash2, request_approved: CheckCircle, request_rejected: FileCheck,
  event_created: CalendarDays, fund_collected: Wallet, expense_added: Receipt,
  settings_changed: Settings, announcement: Edit, upload: Upload, general: Activity,
};

const ACTIVITY_COLOR_MAP = {
  login: '#3B82F6', logout: '#64748B', role_change: '#8B5CF6', member_added: '#10B981',
  member_removed: '#EF4444', request_approved: '#10B981', request_rejected: '#EF4444',
  event_created: '#F59E0B', fund_collected: '#059669', expense_added: '#EA580C',
  settings_changed: '#4F46E5', announcement: '#0284C7', upload: '#0D9488', general: '#475569',
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
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/activities`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data);
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (error) {
        toast({ title: 'Failed to fetch activity logs', description: 'Please check your connection.', variant: 'destructive' });
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
    setExporting(true);
    try {
      const headers = ['#', 'Timestamp', 'User', 'Role', 'Type', 'Action', 'IP Address'];
      const rows = filteredLogs.map((log, i) => [
        i + 1, formatTime(log.createdAt), `"${log.user}"`, `"${log.role}"`, log.type.replace(/_/g, ' '), `"${log.action}"`, log.ip || 'N/A'
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AKS_Activity_Log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'CSV Export Downloaded Successfully' });
    } finally {
      setExporting(false);
    }
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
        <td>${log.type.replace(/_/g, ' ').toUpperCase()}</td>
        <td>${log.action}</td>
        <td>${log.ip || '—'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Activity Log Report - Arfa Kareem Society</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 30px; color: #1e293b; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
            h1 { font-size: 24px; margin: 0; color: #0f172a; }
            .meta { color: #64748b; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { background: #f8fafc; color: #475569; padding: 10px; text-align: left; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
            tr:nth-child(even) { background: #fcfcfd; }
            .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1>Arfa Kareem Society</h1>
              <div style="font-size: 16px; color: #475569; margin-top: 4px;">System Activity Report</div>
            </div>
            <div class="meta">
              <strong>Generated:</strong> ${new Date().toLocaleString()}<br/>
              <strong>Total Records:</strong> ${filteredLogs.length}
            </div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Timestamp</th><th>User</th><th>Role</th><th>Type</th><th>Action</th><th>IP Address</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="footer">Confidential Internal Document &copy; ${new Date().getFullYear()} Arfa Kareem Society Management System</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 800);
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Activity Log" subtitle="Comprehensive live record of all system events and user actions." />

      <div className={styles.topControls}>
        <div className={styles.logFilters}>
          <div className={styles.logSearchWrap}>
            <Search size={16} className={styles.logSearchIcon} />
            <Input placeholder="Search by user or action..." value={logSearch} onChange={e => setLogSearch(e.target.value)} className={styles.logSearchInput} />
          </div>
          <Select value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)} className={styles.selectFilter}>
            <option value="all">All Event Types</option>
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
          <Select value={logRoleFilter} onChange={e => setLogRoleFilter(e.target.value)} className={styles.selectFilter}>
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div className={styles.exportBtns}>
          <Button variant="outline" onClick={exportCSV} disabled={exporting || loading}>
            {exporting ? <Loader2 size={16} className={styles.spin} /> : <Download size={16} />} 
            CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={loading}>
            <Download size={16} /> PDF
          </Button>
        </div>
      </div>

      <div className={styles.logStats}>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{activityLogs.length}</span>
          <span className={styles.logStatLabel}>Total Actions</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{activityLogs.filter(l => l.type === 'login').length}</span>
          <span className={styles.logStatLabel}>Total Logins</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum}>{new Set(activityLogs.map(l => l.user)).size}</span>
          <span className={styles.logStatLabel}>Unique Users</span>
        </div>
        <div className={styles.logStatItem}>
          <span className={styles.logStatNum} style={{ color: 'var(--primary)' }}>{filteredLogs.length}</span>
          <span className={styles.logStatLabel}>Results Found</span>
        </div>
      </div>

      <div className={styles.logTimeline}>
        {loading ? (
          <div className={styles.loadingState}>
            <Loader2 size={32} className={styles.spin} />
            <p>Fetching secure system logs...</p>
          </div>
        ) : currentLogs.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={48} />
            <h3>No activity found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          currentLogs.map(log => {
            const IconComp = ACTIVITY_ICON_MAP[log.type] || Activity;
            const color = ACTIVITY_COLOR_MAP[log.type] || '#64748B';
            return (
              <div key={log._id} className={styles.logItem}>
                <div className={styles.logIconWrap} style={{ background: `${color}15`, color }}>
                  <IconComp size={18} />
                </div>
                <div className={styles.logContent}>
                  <div className={styles.logTop}>
                    <span className={styles.logUser}>{log.user}</span>
                    <Badge variant="outline" style={{ fontSize: '0.7rem', padding: '0 6px' }}>{log.role}</Badge>
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

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
            <ChevronLeft size={16} /> Previous
          </Button>
          <span className={styles.pageInfo}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
            Next <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityLog;