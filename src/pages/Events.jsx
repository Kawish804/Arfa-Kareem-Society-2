import { useState } from 'react';
import { CalendarDays, Edit, Trash2, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Select from '@/components/ui/Select.jsx';
import { events as initialEvents } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Events.module.css';

const emptyForm = { title: '', date: '', description: '', budget: '', status: 'Upcoming' };

const Events = () => {
  const [eventList, setEventList] = useState(initialEvents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditEvent(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e) => { setEditEvent(e); setForm({ title: e.title, date: e.date, description: e.description, budget: String(e.budget), status: e.status }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.title || !form.date) {
      toast({ title: 'Please fill required fields', variant: 'destructive' }); return;
    }
    if (editEvent) {
      setEventList(prev => prev.map(e => e.id === editEvent.id ? { ...e, title: form.title, date: form.date, description: form.description, budget: Number(form.budget) || 0, status: form.status } : e));
      toast({ title: 'Event Updated', description: form.title });
    } else {
      const newEvent = { id: String(Date.now()), title: form.title, date: form.date, description: form.description, budget: Number(form.budget) || 0, status: form.status };
      setEventList(prev => [...prev, newEvent]);
      toast({ title: 'Event Created', description: form.title });
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (e) => {
    setEventList(prev => prev.filter(x => x.id !== e.id));
    toast({ title: 'Event Deleted', description: e.title, variant: 'destructive' });
  };

  return (
    <div>
      <PageHeader title="Event Management" description="Organize and manage events" actionLabel="Create Event" onAction={openAdd} />

      <div className={styles.grid}>
        {eventList.map(e => (
          <div key={e.id} className={styles.card}>
            <div className={styles.cardTop}>
              <Badge variant={e.status === 'Upcoming' ? 'default' : 'secondary'}>{e.status}</Badge>
              <span className={styles.date}><CalendarDays size={12} /> {e.date}</span>
            </div>
            <h3 className={styles.cardTitle}>{e.title}</h3>
            <p className={styles.cardDesc}>{e.description}</p>
            <p className={styles.budget}>Budget: Rs {e.budget.toLocaleString()}</p>
            <div className={styles.cardActions}>
              <Button size="sm" variant="outline" onClick={() => setViewEvent(e)}>
                <Eye size={14} /> View
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(e)}><Edit size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(e)}><Trash2 size={14} color="var(--destructive)" /></Button>
            </div>
          </div>
        ))}
        {eventList.length === 0 && (
          <p style={{ color: 'var(--text-muted)', padding: 32, textAlign: 'center' }}>No events yet. Create one!</p>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title={editEvent ? 'Edit Event' : 'Create Event'}
        footer={<>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>{editEvent ? 'Update' : 'Create'}</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Event Title *</label><Input placeholder="Event name" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
          <div className={styles.field}><label>Date *</label><Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} /></div>
          <div className={styles.field}><label>Description</label><Textarea placeholder="Event description" value={form.description} onChange={e => setField('description', e.target.value)} /></div>
          <div className={styles.field}><label>Budget (Rs)</label><Input type="number" placeholder="0" value={form.budget} onChange={e => setField('budget', e.target.value)} /></div>
          <div className={styles.field}>
            <label>Status</label>
            <Select value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="Upcoming">Upcoming</option><option value="Completed">Completed</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal open={!!viewEvent} onClose={() => setViewEvent(null)} title="Event Details"
        footer={<Button variant="outline" onClick={() => setViewEvent(null)}>Close</Button>}>
        {viewEvent && (
          <div className={styles.formFields}>
            <div className={styles.field}><label>Title</label><p>{viewEvent.title}</p></div>
            <div className={styles.field}><label>Date</label><p>{viewEvent.date}</p></div>
            <div className={styles.field}><label>Status</label><Badge variant={viewEvent.status === 'Upcoming' ? 'default' : 'secondary'}>{viewEvent.status}</Badge></div>
            <div className={styles.field}><label>Budget</label><p>Rs {viewEvent.budget.toLocaleString()}</p></div>
            <div className={styles.field}><label>Description</label><p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{viewEvent.description}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Events;
