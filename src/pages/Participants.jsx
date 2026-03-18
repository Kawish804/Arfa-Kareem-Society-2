import { useState } from 'react';
import { Users, Search, Eye, Trash2, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Select from '@/components/ui/Select.jsx';
import { events, eventParticipants as initialParticipants } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Participants.module.css';

const Participants = () => {
  const [participants, setParticipants] = useState(initialParticipants);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [viewParticipant, setViewParticipant] = useState(null);
  const { toast } = useToast();

  const filtered = participants.filter(p => {
    const matchSearch = p.memberName.toLowerCase().includes(search.toLowerCase());
    const matchEvent = !filterEvent || p.eventId === filterEvent;
    const matchRole = !filterRole || p.role === filterRole;
    return matchSearch && matchEvent && matchRole;
  });

  const getEventName = (eventId) => {
    const ev = events.find(e => e.id === eventId);
    return ev ? ev.title : 'Unknown Event';
  };

  const getEventDate = (eventId) => {
    const ev = events.find(e => e.id === eventId);
    return ev ? ev.date : '';
  };

  const handleDelete = (p) => {
    setParticipants(prev => prev.filter(x => x.id !== p.id));
    toast({ title: 'Participant Removed', description: p.memberName, variant: 'destructive' });
  };

  const uniqueRoles = [...new Set(participants.map(p => p.role))];

  return (
    <div>
      <PageHeader title="Participants" description="View and manage all event participants" />

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{participants.length}</span>
          <span className={styles.summaryLabel}>Total Registrations</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{new Set(participants.map(p => p.memberName)).size}</span>
          <span className={styles.summaryLabel}>Unique Members</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{new Set(participants.map(p => p.eventId)).size}</span>
          <span className={styles.summaryLabel}>Events Covered</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue}>{(participants.reduce((s, p) => s + (p.totalScore || 0), 0) / (participants.length || 1)).toFixed(1)}</span>
          <span className={styles.summaryLabel}>Avg Score</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <Select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className={styles.filterSelect}>
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </Select>
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={styles.filterSelect}>
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Participant</th>
              <th>Event</th>
              <th>Role</th>
              <th className={styles.hideSmall}>Scores (T/C/R)</th>
              <th className={styles.hideSmall}>Total</th>
              <th className={styles.actionsHead}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td><span className={styles.nameCell}>{p.memberName}</span></td>
                <td>
                  <div className={styles.eventCell}>
                    <span>{getEventName(p.eventId)}</span>
                    <span className={styles.eventDate}><CalendarDays size={10} /> {getEventDate(p.eventId)}</span>
                  </div>
                </td>
                <td><Badge variant="secondary">{p.role}</Badge></td>
                <td className={styles.hideSmall}>
                  <span className={styles.scores}>{p.teamwork}/{p.communication}/{p.responsibility}</span>
                </td>
                <td className={styles.hideSmall}>
                  <span className={styles.totalScore}>{p.totalScore}/15</span>
                </td>
                <td className={styles.actionsCell}>
                  <Button size="sm" variant="ghost" onClick={() => setViewParticipant(p)}><Eye size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}><Trash2 size={14} color="var(--destructive)" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={styles.empty}>No participants found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      <Modal open={!!viewParticipant} onClose={() => setViewParticipant(null)} title="Participant Details"
        footer={<Button variant="outline" onClick={() => setViewParticipant(null)}>Close</Button>}>
        {viewParticipant && (
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>{viewParticipant.memberName.split(' ').map(n => n[0]).join('')}</div>
            <h3 className={styles.profileName}>{viewParticipant.memberName}</h3>
            <Badge variant="secondary">{viewParticipant.role}</Badge>
            <div className={styles.profileMeta}>
              <div className={styles.profileRow}>
                <span className={styles.profileLabel}>Event</span>
                <span className={styles.profileValue}>{getEventName(viewParticipant.eventId)}</span>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.profileLabel}>Event Date</span>
                <span className={styles.profileValue}>{getEventDate(viewParticipant.eventId)}</span>
              </div>
            </div>
            <div className={styles.scoreGrid}>
              <div className={styles.scoreItem}>
                <span className={styles.scoreNum}>{viewParticipant.teamwork}</span>
                <span className={styles.scoreName}>Teamwork</span>
              </div>
              <div className={styles.scoreItem}>
                <span className={styles.scoreNum}>{viewParticipant.communication}</span>
                <span className={styles.scoreName}>Communication</span>
              </div>
              <div className={styles.scoreItem}>
                <span className={styles.scoreNum}>{viewParticipant.responsibility}</span>
                <span className={styles.scoreName}>Responsibility</span>
              </div>
            </div>
            <div className={styles.totalBlock}>
              <span>Total Score</span>
              <strong>{viewParticipant.totalScore}/15</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Participants;
