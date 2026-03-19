import { useState } from 'react';
import { CalendarDays, Edit, Trash2, Eye, Users, Star, Image as ImageIcon, MessageSquare, Upload, MapPin, Clock, GraduationCap } from 'lucide-react';
import PageHeader from '@/components/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Input from '@/components/ui/Input.jsx';
import Textarea from '@/components/ui/Textarea.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Select from '@/components/ui/Select.jsx';
import { events as initialEvents, eventParticipants as initialParticipants, eventFeedbacks as initialFeedbacks, eventScreenshots as initialScreenshots, members } from '@/data/mockData.js';
import { useToast } from '@/components/Toast/ToastProvider.jsx';
import styles from './Events.module.css';

const emptyForm = {
  title: '', type: 'Seminar', date: '', time: '', endDate: '', venue: '',
  description: '', budget: '', status: 'Upcoming', maxParticipants: '',
  organizer: '', department: '', contactEmail: '', contactPhone: '',
  registrationDeadline: '', eligibility: 'All Students', entryFee: '',
  chiefGuest: '', requirements: ''
};

const Events = () => {
  const [eventList, setEventList] = useState(initialEvents);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [viewEvent, setViewEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [participants, setParticipants] = useState(initialParticipants);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const { toast } = useToast();

  // Detail modal tabs
  const [detailTab, setDetailTab] = useState('details');

  // Performance evaluation state
  const [evalOpen, setEvalOpen] = useState(false);
  const [evalParticipant, setEvalParticipant] = useState(null);
  const [evalForm, setEvalForm] = useState({ teamwork: 3, communication: 3, responsibility: 3 });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setEditEvent(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e) => {
    setEditEvent(e);
    setForm({
      title: e.title, type: e.type || 'Seminar', date: e.date, time: e.time || '',
      endDate: e.endDate || '', venue: e.venue || '', description: e.description,
      budget: String(e.budget), status: e.status, maxParticipants: String(e.maxParticipants || ''),
      organizer: e.organizer || '', department: e.department || '', contactEmail: e.contactEmail || '',
      contactPhone: e.contactPhone || '', registrationDeadline: e.registrationDeadline || '',
      eligibility: e.eligibility || 'All Students', entryFee: String(e.entryFee || ''),
      chiefGuest: e.chiefGuest || '', requirements: e.requirements || ''
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.date) {
      toast({ title: 'Please fill required fields', variant: 'destructive' }); return;
    }
    const eventData = {
      title: form.title, type: form.type, date: form.date, time: form.time,
      endDate: form.endDate, venue: form.venue, description: form.description,
      budget: Number(form.budget) || 0, status: form.status,
      maxParticipants: Number(form.maxParticipants) || 0, organizer: form.organizer,
      department: form.department, contactEmail: form.contactEmail, contactPhone: form.contactPhone,
      registrationDeadline: form.registrationDeadline, eligibility: form.eligibility,
      entryFee: Number(form.entryFee) || 0, chiefGuest: form.chiefGuest, requirements: form.requirements
    };
    if (editEvent) {
      setEventList(prev => prev.map(e => e.id === editEvent.id ? { ...e, ...eventData } : e));
      toast({ title: 'Event Updated', description: form.title });
    } else {
      setEventList(prev => [...prev, { id: String(Date.now()), ...eventData }]);
      toast({ title: 'Event Created', description: form.title });
    }
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const handleDelete = (e) => {
    setEventList(prev => prev.filter(x => x.id !== e.id));
    toast({ title: 'Event Deleted', description: e.title, variant: 'destructive' });
  };

  const openView = (e) => {
    setViewEvent(e);
    setDetailTab('details');
  };

  // Get participants for an event
  const getEventParticipants = (eventId) => participants.filter(p => p.eventId === eventId);
  const getEventFeedbacks = (eventId) => feedbacks.filter(f => f.eventId === eventId);
  const getEventScreenshots = (eventId) => screenshots.filter(s => s.eventId === eventId);

  // Performance evaluation
  const openEval = (participant) => {
    setEvalParticipant(participant);
    setEvalForm({ teamwork: participant.teamwork || 3, communication: participant.communication || 3, responsibility: participant.responsibility || 3 });
    setEvalOpen(true);
  };

  const saveEval = () => {
    const total = evalForm.teamwork + evalForm.communication + evalForm.responsibility;
    setParticipants(prev => prev.map(p =>
      p.id === evalParticipant.id
        ? { ...p, teamwork: evalForm.teamwork, communication: evalForm.communication, responsibility: evalForm.responsibility, totalScore: total }
        : p
    ));
    toast({ title: 'Evaluation Saved', description: `${evalParticipant.memberName}: ${total}/15` });
    setEvalOpen(false);
  };

  // Participate modal
  const [participateOpen, setParticipateOpen] = useState(false);
  const [participateEvent, setParticipateEvent] = useState(null);
  const [participateForm, setParticipateForm] = useState({ name: '', role: 'Volunteer' });

  const openParticipate = (e) => {
    setParticipateEvent(e);
    setParticipateForm({ name: '', role: 'Volunteer' });
    setParticipateOpen(true);
  };

  const handleParticipate = () => {
    if (!participateForm.name) {
      toast({ title: 'Please enter your name', variant: 'destructive' }); return;
    }
    const existing = participants.find(p => p.eventId === participateEvent.id && p.memberName === participateForm.name);
    if (existing) {
      toast({ title: 'Already participating', description: `${participateForm.name} is already registered`, variant: 'destructive' }); return;
    }
    const newP = {
      id: String(Date.now()),
      eventId: participateEvent.id,
      memberId: String(Date.now()),
      memberName: participateForm.name,
      role: participateForm.role,
      teamwork: 3, communication: 3, responsibility: 3, totalScore: 9
    };
    setParticipants(prev => [...prev, newP]);
    toast({ title: 'Participation Confirmed!', description: `${participateForm.name} joined as ${participateForm.role}` });
    setParticipateOpen(false);
  };

  // Add participant from detail view
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [addPForm, setAddPForm] = useState({ name: '', role: 'Volunteer' });

  const handleAddParticipant = () => {
    if (!addPForm.name) {
      toast({ title: 'Please enter participant name', variant: 'destructive' }); return;
    }
    const existing = participants.find(p => p.eventId === viewEvent.id && p.memberName === addPForm.name);
    if (existing) {
      toast({ title: 'Already participating', variant: 'destructive' }); return;
    }
    const newP = {
      id: String(Date.now()),
      eventId: viewEvent.id,
      memberId: String(Date.now()),
      memberName: addPForm.name,
      role: addPForm.role,
      teamwork: 3, communication: 3, responsibility: 3, totalScore: 9
    };
    setParticipants(prev => [...prev, newP]);
    toast({ title: 'Participant Added', description: `${addPForm.name} as ${addPForm.role}` });
    setAddParticipantOpen(false);
    setAddPForm({ name: '', role: 'Volunteer' });
  };

  // Screenshot upload
  const handleScreenshotUpload = (e) => {
    if (!viewEvent) return;
    const file = e.target.files[0];
    if (!file) return;
    const newSS = {
      id: String(Date.now()),
      eventId: viewEvent.id,
      url: URL.createObjectURL(file),
      caption: file.name
    };
    setScreenshots(prev => [...prev, newSS]);
    toast({ title: 'Screenshot Uploaded' });
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
            <p className={styles.budget}>Budget: Rs {e.budget.toLocaleString()}{e.entryFee ? ` • Entry: Rs ${e.entryFee}` : ' • Free Entry'}</p>
            <div className={styles.cardMeta}>
              <span className={styles.metaItem}><Users size={12} /> {getEventParticipants(e.id).length}{e.maxParticipants ? `/${e.maxParticipants}` : ''}</span>
              {e.venue && <span className={styles.metaItem}><MapPin size={12} /> {e.venue}</span>}
              {e.type && <span className={styles.metaItem}><GraduationCap size={12} /> {e.type}</span>}
              {/* <span className={styles.metaItem}><MessageSquare size={12} /> {getEventFeedbacks(e.id).length}</span> */}
            </div>
            <div className={styles.cardActions}>
              <Button size="sm" variant="outline" onClick={() => openView(e)}>
                <Eye size={14} /> View
              </Button>
              <Button size="sm" variant="outline" onClick={() => openParticipate(e)}>
                <Users size={14} /> Participate
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
          <div className={styles.formSection}><span className={styles.sectionTitle}>Basic Information</span></div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Event Title *</label><Input placeholder="e.g. Annual Tech Summit 2026" value={form.title} onChange={e => setField('title', e.target.value)} /></div>
            <div className={styles.field}>
              <label>Event Type *</label>
              <Select value={form.type} onChange={e => setField('type', e.target.value)}>
                <option value="Seminar">Seminar</option><option value="Workshop">Workshop</option>
                <option value="Competition">Competition</option><option value="Sports">Sports</option>
                <option value="Cultural">Cultural Event</option><option value="Conference">Conference</option>
                <option value="Hackathon">Hackathon</option><option value="Exhibition">Exhibition</option>
                <option value="Fundraiser">Fundraiser</option><option value="Social">Social Gathering</option>
                <option value="Guest Lecture">Guest Lecture</option><option value="Trip">Educational Trip</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Start Date *</label><Input type="date" value={form.date} onChange={e => setField('date', e.target.value)} /></div>
            <div className={styles.field}><label>End Date</label><Input type="date" value={form.endDate} onChange={e => setField('endDate', e.target.value)} /></div>
            <div className={styles.field}><label>Time</label><Input type="time" value={form.time} onChange={e => setField('time', e.target.value)} /></div>
          </div>
          <div className={styles.field}><label>Venue / Location *</label><Input placeholder="e.g. Main Auditorium, Block A" value={form.venue} onChange={e => setField('venue', e.target.value)} /></div>
          <div className={styles.field}><label>Description</label><Textarea placeholder="Detailed description of the event, agenda, activities..." value={form.description} onChange={e => setField('description', e.target.value)} rows={3} /></div>

          <div className={styles.formSection}><span className={styles.sectionTitle}>Participation & Eligibility</span></div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Max Participants</label><Input type="number" placeholder="e.g. 100" value={form.maxParticipants} onChange={e => setField('maxParticipants', e.target.value)} /></div>
            <div className={styles.field}>
              <label>Eligibility</label>
              <Select value={form.eligibility} onChange={e => setField('eligibility', e.target.value)}>
                <option value="All Students">All Students</option><option value="Society Members Only">Society Members Only</option>
                <option value="Department Specific">Department Specific</option><option value="Open for All">Open for All (Including Outsiders)</option>
              </Select>
            </div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Registration Deadline</label><Input type="date" value={form.registrationDeadline} onChange={e => setField('registrationDeadline', e.target.value)} /></div>
            <div className={styles.field}><label>Entry Fee (Rs)</label><Input type="number" placeholder="0 for free" value={form.entryFee} onChange={e => setField('entryFee', e.target.value)} /></div>
          </div>

          <div className={styles.formSection}><span className={styles.sectionTitle}>Organizer & Contact</span></div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Organizer / In-Charge</label><Input placeholder="e.g. Dr. Ahmed Khan" value={form.organizer} onChange={e => setField('organizer', e.target.value)} /></div>
            <div className={styles.field}><label>Department</label><Input placeholder="e.g. Computer Science" value={form.department} onChange={e => setField('department', e.target.value)} /></div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Contact Email</label><Input type="email" placeholder="organizer@university.edu" value={form.contactEmail} onChange={e => setField('contactEmail', e.target.value)} /></div>
            <div className={styles.field}><label>Contact Phone</label><Input type="tel" placeholder="+92 300 1234567" value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} /></div>
          </div>

          <div className={styles.formSection}><span className={styles.sectionTitle}>Budget & Additional Info</span></div>
          <div className={styles.fieldRow}>
            <div className={styles.field}><label>Total Budget (Rs)</label><Input type="number" placeholder="0" value={form.budget} onChange={e => setField('budget', e.target.value)} /></div>
            <div className={styles.field}>
              <label>Status</label>
              <Select value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="Upcoming">Upcoming</option><option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className={styles.field}><label>Chief Guest / Speaker</label><Input placeholder="e.g. Prof. Sarah Ali" value={form.chiefGuest} onChange={e => setField('chiefGuest', e.target.value)} /></div>
          <div className={styles.field}><label>Special Requirements</label><Textarea placeholder="Equipment, resources, permissions needed..." value={form.requirements} onChange={e => setField('requirements', e.target.value)} rows={2} /></div>
        </div>
      </Modal>

      {/* View Details Modal with Tabs */}
      <Modal open={!!viewEvent} onClose={() => setViewEvent(null)} title={viewEvent?.title || 'Event Details'}
        footer={<Button variant="outline" onClick={() => setViewEvent(null)}>Close</Button>}>
        {viewEvent && (
          <div>
            {/* Detail Tabs */}
            <div className={styles.detailTabs}>
              {['details', 'participants', 'evaluation', 'screenshots', 'feedbacks'].map(tab => (
                <button key={tab}
                  className={`${styles.detailTab} ${detailTab === tab ? styles.detailTabActive : ''}`}
                  onClick={() => setDetailTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {detailTab === 'details' && (
              <div className={styles.formFields}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}><label>Event Type</label><p>{viewEvent.type || 'N/A'}</p></div>
                  <div className={styles.field}><label>Status</label><Badge variant={viewEvent.status === 'Upcoming' ? 'default' : viewEvent.status === 'Cancelled' ? 'destructive' : 'secondary'}>{viewEvent.status}</Badge></div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}><label>Start Date</label><p>{viewEvent.date}</p></div>
                  {viewEvent.endDate && <div className={styles.field}><label>End Date</label><p>{viewEvent.endDate}</p></div>}
                  {viewEvent.time && <div className={styles.field}><label>Time</label><p>{viewEvent.time}</p></div>}
                </div>
                {viewEvent.venue && <div className={styles.field}><label>Venue</label><p>{viewEvent.venue}</p></div>}
                <div className={styles.fieldRow}>
                  <div className={styles.field}><label>Budget</label><p>Rs {viewEvent.budget.toLocaleString()}</p></div>
                  <div className={styles.field}><label>Entry Fee</label><p>{viewEvent.entryFee ? `Rs ${viewEvent.entryFee}` : 'Free'}</p></div>
                  <div className={styles.field}><label>Max Participants</label><p>{viewEvent.maxParticipants || 'Unlimited'}</p></div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}><label>Eligibility</label><p>{viewEvent.eligibility || 'All Students'}</p></div>
                  {viewEvent.registrationDeadline && <div className={styles.field}><label>Reg. Deadline</label><p>{viewEvent.registrationDeadline}</p></div>}
                </div>
                {viewEvent.organizer && <div className={styles.fieldRow}>
                  <div className={styles.field}><label>Organizer</label><p>{viewEvent.organizer}</p></div>
                  {viewEvent.department && <div className={styles.field}><label>Department</label><p>{viewEvent.department}</p></div>}
                </div>}
                {(viewEvent.contactEmail || viewEvent.contactPhone) && <div className={styles.fieldRow}>
                  {viewEvent.contactEmail && <div className={styles.field}><label>Email</label><p>{viewEvent.contactEmail}</p></div>}
                  {viewEvent.contactPhone && <div className={styles.field}><label>Phone</label><p>{viewEvent.contactPhone}</p></div>}
                </div>}
                {viewEvent.chiefGuest && <div className={styles.field}><label>Chief Guest / Speaker</label><p>{viewEvent.chiefGuest}</p></div>}
                <div className={styles.field}><label>Description</label><p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{viewEvent.description}</p></div>
                {viewEvent.requirements && <div className={styles.field}><label>Requirements</label><p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{viewEvent.requirements}</p></div>}
              </div>
            )}

            {/* Participants Tab */}
            {detailTab === 'participants' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Button size="sm" onClick={() => { setAddPForm({ name: '', role: 'Volunteer' }); setAddParticipantOpen(true); }}>
                    <Users size={14} /> Add Participant
                  </Button>
                </div>
                {getEventParticipants(viewEvent.id).length > 0 ? (
                  <div className={styles.participantList}>
                    {getEventParticipants(viewEvent.id).map(p => (
                      <div key={p.id} className={styles.participantRow}>
                        <div>
                          <span className={styles.participantName}>{p.memberName}</span>
                          <Badge variant="secondary">{p.role}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No participants yet</p>
                )}
              </div>
            )}

            {/* Evaluation Tab */}
            {detailTab === 'evaluation' && (
              <div>
                {getEventParticipants(viewEvent.id).length > 0 ? (
                  <div className={styles.evalList}>
                    {getEventParticipants(viewEvent.id).map(p => (
                      <div key={p.id} className={styles.evalRow}>
                        <div className={styles.evalInfo}>
                          <span className={styles.participantName}>{p.memberName}</span>
                          <Badge variant="secondary">{p.role}</Badge>
                        </div>
                        <div className={styles.evalScores}>
                          <span>T: {p.teamwork}/5</span>
                          <span>C: {p.communication}/5</span>
                          <span>R: {p.responsibility}/5</span>
                          <strong>Total: {p.totalScore}/15</strong>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openEval(p)}>
                          <Star size={12} /> Rate
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No participants to evaluate</p>
                )}
              </div>
            )}

            {/* Screenshots Tab */}
            {detailTab === 'screenshots' && (
              <div>
                <div className={styles.uploadArea}>
                  <input type="file" accept="image/*" id="ssUpload" className={styles.fileInput}
                    onChange={handleScreenshotUpload} />
                  <label htmlFor="ssUpload" className={styles.uploadLabel}>
                    <Upload size={16} /> Upload Screenshot
                  </label>
                </div>
                {getEventScreenshots(viewEvent.id).length > 0 ? (
                  <div className={styles.ssGrid}>
                    {getEventScreenshots(viewEvent.id).map(s => (
                      <div key={s.id} className={styles.ssItem}>
                        <img src={s.url} alt={s.caption} className={styles.ssImg} />
                        <span className={styles.ssCaption}>{s.caption}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No screenshots uploaded</p>
                )}
              </div>
            )}

            {/* Feedbacks Tab */}
            {detailTab === 'feedbacks' && (
              <div>
                {getEventFeedbacks(viewEvent.id).length > 0 ? (
                  <div className={styles.fbList}>
                    {getEventFeedbacks(viewEvent.id).map(f => (
                      <div key={f.id} className={styles.fbItem}>
                        <div className={styles.fbHeader}>
                          <span className={styles.fbName}>{f.memberName}</span>
                          <div className={styles.fbStars}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={14} fill={s <= f.rating ? 'var(--warning)' : 'none'} color={s <= f.rating ? 'var(--warning)' : 'var(--text-light)'} />
                            ))}
                          </div>
                        </div>
                        <p className={styles.fbComment}>{f.comment}</p>
                        <span className={styles.fbDate}>{f.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyMsg}>No feedback received yet</p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Participate Modal */}
      <Modal open={participateOpen} onClose={() => setParticipateOpen(false)} title={`Join: ${participateEvent?.title || ''}`}
        footer={<>
          <Button variant="outline" onClick={() => setParticipateOpen(false)}>Cancel</Button>
          <Button onClick={handleParticipate}>Confirm Participation</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Your Name *</label><Input placeholder="Enter your name" value={participateForm.name} onChange={e => setParticipateForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className={styles.field}>
            <label>Role</label>
            <Select value={participateForm.role} onChange={e => setParticipateForm(p => ({ ...p, role: e.target.value }))}>
              <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Speaker">Speaker</option><option value="Attendee">Attendee</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Add Participant Modal */}
      <Modal open={addParticipantOpen} onClose={() => setAddParticipantOpen(false)} title="Add Participant"
        footer={<>
          <Button variant="outline" onClick={() => setAddParticipantOpen(false)}>Cancel</Button>
          <Button onClick={handleAddParticipant}>Add</Button>
        </>}>
        <div className={styles.formFields}>
          <div className={styles.field}><label>Participant Name *</label><Input placeholder="Enter name" value={addPForm.name} onChange={e => setAddPForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className={styles.field}>
            <label>Role</label>
            <Select value={addPForm.role} onChange={e => setAddPForm(p => ({ ...p, role: e.target.value }))}>
              <option value="Volunteer">Volunteer</option><option value="Organizer">Organizer</option><option value="Speaker">Speaker</option><option value="Attendee">Attendee</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Performance Evaluation Modal */}
      <Modal open={evalOpen} onClose={() => setEvalOpen(false)} title="Rate Performance"
        footer={<>
          <Button variant="outline" onClick={() => setEvalOpen(false)}>Cancel</Button>
          <Button onClick={saveEval}>Save Evaluation</Button>
        </>}>
        {evalParticipant && (
          <div className={styles.formFields}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Evaluating: <strong>{evalParticipant.memberName}</strong> ({evalParticipant.role})
            </p>
            <div className={styles.field}>
              <label>Teamwork ({evalForm.teamwork}/5)</label>
              <input type="range" min="1" max="5" value={evalForm.teamwork}
                onChange={e => setEvalForm(p => ({ ...p, teamwork: Number(e.target.value) }))} />
            </div>
            <div className={styles.field}>
              <label>Communication ({evalForm.communication}/5)</label>
              <input type="range" min="1" max="5" value={evalForm.communication}
                onChange={e => setEvalForm(p => ({ ...p, communication: Number(e.target.value) }))} />
            </div>
            <div className={styles.field}>
              <label>Responsibility ({evalForm.responsibility}/5)</label>
              <input type="range" min="1" max="5" value={evalForm.responsibility}
                onChange={e => setEvalForm(p => ({ ...p, responsibility: Number(e.target.value) }))} />
            </div>
            <div className={styles.evalTotal}>
              Total Score: <strong>{evalForm.teamwork + evalForm.communication + evalForm.responsibility}/15</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Events;