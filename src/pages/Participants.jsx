import { useState, useEffect } from 'react';
import { Users, Search, Eye, Trash2, CalendarDays } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Select from '@/components/ui/Select.jsx';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Participants.module.css';

const Participants = () => {
  const [participants, setParticipants] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [viewParticipant, setViewParticipant] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5000/api/participants/all'),
      fetch('http://localhost:5000/api/events/records')
    ])
    .then(async ([partRes, evRes]) => {
      const partData = await partRes.json();
      const evData = await evRes.json();
      
      setParticipants(partData.filter(p => p.status === 'Approved'));
      setEventsData(evData);
    })
    .catch(err => console.error("Fetch error:", err));
  }, []);

  const filtered = participants.filter(p => {
    const matchSearch = p.studentName.toLowerCase().includes(search.toLowerCase());
    const matchEvent = !filterEvent || p.eventId === filterEvent;
    const matchRole = !filterRole || p.role === filterRole;
    return matchSearch && matchEvent && matchRole;
  });

  const getEventDate = (eventId) => {
    const ev = eventsData.find(e => e._id === eventId);
    return ev ? new Date(ev.date).toLocaleDateString() : 'Unknown';
  };

  const handleDelete = async (p) => {
    if(!window.confirm("Remove this participant?")) return;
    try {
      await fetch(`http://localhost:5000/api/participants/${p._id}`, { method: 'DELETE' });
      setParticipants(prev => prev.filter(x => x._id !== p._id));
      toast({ title: 'Participant Removed', description: p.studentName, variant: 'destructive' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const uniqueRoles = [...new Set(participants.map(p => p.role))];

  return (
    <div>
      <PageHeader title="Participants" description="View and manage all approved event participants" />

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}><span className={styles.summaryValue}>{participants.length}</span><span className={styles.summaryLabel}>Total Registrations</span></div>
        <div className={styles.summaryCard}><span className={styles.summaryValue}>{new Set(participants.map(p => p.studentName)).size}</span><span className={styles.summaryLabel}>Unique Members</span></div>
        <div className={styles.summaryCard}><span className={styles.summaryValue}>{new Set(participants.map(p => p.eventId)).size}</span><span className={styles.summaryLabel}>Events Covered</span></div>
        <div className={styles.summaryCard}><span className={styles.summaryValue}>{(participants.reduce((s, p) => s + (p.totalScore || 0), 0) / (participants.length || 1)).toFixed(1)}</span><span className={styles.summaryLabel}>Avg Score</span></div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <Select value={filterEvent} onChange={e => setFilterEvent(e.target.value)} className={styles.filterSelect}>
          <option value="">All Events</option>
          {eventsData.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
        </Select>
        <Select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={styles.filterSelect}>
          <option value="">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </div>

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
              <tr key={p._id}>
                <td>
                  <span className={styles.nameCell}>{p.studentName}</span>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{p.department}</div>
                </td>
                <td>
                  <div className={styles.eventCell}>
                    <span>{p.eventTitle}</span>
                    <span className={styles.eventDate}><CalendarDays size={10} /> {getEventDate(p.eventId)}</span>
                  </div>
                </td>
                <td><Badge variant="secondary">{p.role}</Badge></td>
                <td className={styles.hideSmall}><span className={styles.scores}>{p.teamwork}/{p.communication}/{p.responsibility}</span></td>
                <td className={styles.hideSmall}><span className={styles.totalScore}>{p.totalScore}/15</span></td>
                <td className={styles.actionsCell}>
                  <Button size="sm" variant="ghost" onClick={() => setViewParticipant(p)}><Eye size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}><Trash2 size={14} color="var(--destructive)" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className={styles.empty}>No approved participants found</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={!!viewParticipant} onClose={() => setViewParticipant(null)} title="Participant Details"
        footer={<Button variant="outline" onClick={() => setViewParticipant(null)}>Close</Button>}>
        {viewParticipant && (
          <div className={styles.profileCard}>
            <div className={styles.profileAvatar}>{viewParticipant.studentName.split(' ').map(n => n[0]).join('')}</div>
            <h3 className={styles.profileName}>{viewParticipant.studentName}</h3>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>{viewParticipant.department} • {viewParticipant.rollNo}</div>
            <Badge variant="secondary">{viewParticipant.role}</Badge>
            
            <div className={styles.profileMeta}>
              <div className={styles.profileRow}><span className={styles.profileLabel}>Event</span><span className={styles.profileValue}>{viewParticipant.eventTitle}</span></div>
              <div className={styles.profileRow}><span className={styles.profileLabel}>Event Date</span><span className={styles.profileValue}>{getEventDate(viewParticipant.eventId)}</span></div>
            </div>
            <div className={styles.scoreGrid}>
              <div className={styles.scoreItem}><span className={styles.scoreNum}>{viewParticipant.teamwork}</span><span className={styles.scoreName}>Teamwork</span></div>
              <div className={styles.scoreItem}><span className={styles.scoreNum}>{viewParticipant.communication}</span><span className={styles.scoreName}>Communication</span></div>
              <div className={styles.scoreItem}><span className={styles.scoreNum}>{viewParticipant.responsibility}</span><span className={styles.scoreName}>Responsibility</span></div>
            </div>
            <div className={styles.totalBlock}><span>Total Score</span><strong>{viewParticipant.totalScore}/15</strong></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Participants;